"use server";

import { revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

// Mirrors the client-side variantLabel() in ProductDetailInteractive.tsx —
// falls back to the older label/kind columns for rows saved before the
// color_label/size_label migration ran (same fallback used elsewhere, e.g.
// getProductBySlug in lib/products.ts).
function variantLabel(v: { color_label: string | null; size_label: string | null; label?: string | null; kind?: string | null }) {
  const color = v.color_label ?? (v.kind === "color" ? v.label : null) ?? null;
  const size = v.size_label ?? (v.kind === "size" ? v.label : null) ?? null;
  if (color && size) return `${color} — ${size}`;
  return color || size || "";
}

type CheckoutInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  paymentMethod: "card" | "cod";
  shippingZone: "beirut" | "outside_beirut";
  shippingCost: number;
  promoCode: string | null;
  items: { productId: string; variant: string | null; name: string; price: number; quantity: number }[];
};

export async function createOrder(input: CheckoutInput) {
  if (!input.name || !input.email || !input.phone || !input.address || input.items.length === 0) {
    throw new Error("Missing required checkout fields");
  }

  const supabase = createServiceClient();
  const itemsTotal = input.items.reduce((a, i) => a + i.price * i.quantity, 0);

  // Resolve each cart line to a concrete product/variant row, then
  // atomically check-and-decrement stock for the whole order in one
  // database transaction — see supabase/migrations/0045_checkout_stock_check.sql.
  // Nothing about this trusts client-side "out of stock" button states:
  // a cart can hold an item that went out of stock after it was added, or
  // simply after the button-disabling check ran in an earlier page load.
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const { data: allVariants } = await supabase
    .from("product_variants")
    .select("id, product_id, color_label, size_label, label, kind")
    .in("product_id", productIds);

  const stockItems: { product_id: string; variant_id: string | null; quantity: number }[] = [];
  for (const item of input.items) {
    if (item.variant) {
      const match = (allVariants ?? []).find((v) => v.product_id === item.productId && variantLabel(v) === item.variant);
      // A variant label with nothing matching it in the database (deleted
      // since it was added to the cart, say) can't be stock-checked safely
      // — block the order for that line rather than guessing.
      if (!match) throw new Error("OUT_OF_STOCK");
      stockItems.push({ product_id: item.productId, variant_id: match.id, quantity: item.quantity });
    } else {
      stockItems.push({ product_id: item.productId, variant_id: null, quantity: item.quantity });
    }
  }

  // checkout_decrement_stock comes from a migration that may not have run
  // yet on this deployment — PGRST202 means Supabase can't find the
  // function at all, so treat that specifically as "stock checking isn't
  // set up here yet" and let checkout proceed unblocked (same posture as
  // before this feature existed), rather than failing every order until
  // the migration is applied. Any other error is a real result from the
  // function itself (raise exception 'insufficient_stock...') and does
  // block the order.
  const { error: stockError } = await supabase.rpc("checkout_decrement_stock", { items: stockItems });
  if (stockError && stockError.code !== "PGRST202") throw new Error("OUT_OF_STOCK");

  // Re-validate the promo code against the database rather than trusting
  // whatever discount the client displayed — an already-used, expired, or
  // made-up code is silently ignored instead of failing the whole order.
  //
  // The code is claimed (used_at set) here, atomically, BEFORE the discount
  // is applied — not after the order is created like before. Two checkouts
  // racing on the same code both used to pass the initial "is it used?"
  // read, so both got the discount and both orders were created with it;
  // only the later used_at UPDATE actually "won", but the code had already
  // been spent twice. Claiming with an UPDATE ... WHERE used_at IS NULL is
  // atomic at the database level: only one concurrent request can ever
  // flip a given row from unused to used, so checking whether *this*
  // request's update affected a row is a race-free single-use check.
  let discountPercent = 0;
  let redeemedCode: string | null = null;
  if (input.promoCode) {
    const normalized = input.promoCode.trim().toUpperCase();
    const { data: win } = await supabase
      .from("spin_wheel_wins")
      .select("discount_percent, created_at")
      .eq("code", normalized)
      .is("used_at", null)
      .maybeSingle();
    if (win && Date.now() - new Date(win.created_at).getTime() <= 60 * 60 * 1000) {
      const { data: claimed } = await supabase
        .from("spin_wheel_wins")
        .update({ used_at: new Date().toISOString() })
        .eq("code", normalized)
        .is("used_at", null)
        .select("code")
        .maybeSingle();
      if (claimed) {
        discountPercent = win.discount_percent;
        redeemedCode = normalized;
      }
    }
  }

  const discountAmount = Math.round(itemsTotal * (discountPercent / 100) * 100) / 100;
  const total = itemsTotal - discountAmount + input.shippingCost;

  const orderFields = {
    customer_name: input.name,
    customer_email: input.email,
    customer_phone: input.phone,
    address: input.address,
    city: input.city,
    latitude: input.latitude,
    longitude: input.longitude,
    payment_method: input.paymentMethod,
    shipping_zone: input.shippingZone,
    shipping_cost: input.shippingCost,
    promo_code: redeemedCode,
    discount_amount: discountAmount,
    total,
    status: "pending_payment",
  };

  // promo_code/discount_amount come from a migration that may not have run
  // yet — retry without them rather than breaking checkout entirely.
  let { data: order, error } = await supabase.from("orders").insert(orderFields).select("id").single();
  if (error) {
    const { promo_code, discount_amount, ...fallback } = orderFields;
    ({ data: order, error } = await supabase.from("orders").insert(fallback).select("id").single());
  }

  if (error || !order) {
    // Stock was already decremented and the promo code (if any) already
    // claimed above — if the order itself never got created, give both
    // back rather than burning a customer's discount and inventory on an
    // order they don't actually have.
    await supabase.rpc("checkout_restore_stock", { items: stockItems });
    if (redeemedCode) {
      await supabase.from("spin_wheel_wins").update({ used_at: null }).eq("code", redeemedCode);
    }
    throw error;
  }

  await supabase.from("order_items").insert(
    input.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.name,
      variant_label: i.variant,
      unit_price: i.price,
      quantity: i.quantity,
    }))
  );

  try {
    const { notifyNewOrder } = await import("@/lib/notify-order");
    await notifyNewOrder({ orderId: order.id, ...input, total });
  } catch {
    // notification failure must never block the customer's order from succeeding
  }

  // Stock just changed — without this, the cached catalog/product pages
  // (see lib/products.ts) could keep showing an item as available for up
  // to the cache's TTL after it actually sold out.
  revalidateTag("products");

  return { orderId: order.id as string, total };
}
