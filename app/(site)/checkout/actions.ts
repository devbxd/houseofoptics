"use server";

import { revalidateTag } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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
  giftCardCode: string | null;
  items: { productId: string; variant: string | null; name: string; price: number; quantity: number; image: string | null }[];
};

export async function createOrder(input: CheckoutInput) {
  if (!input.name || !input.email || !input.phone || !input.address || input.items.length === 0) {
    throw new Error("Missing required checkout fields");
  }

  // Read from the session cookie, never trust a client-supplied customer
  // id — that would let anyone attribute an order (or a gift card
  // redemption) to a different account just by forging the request.
  const cookieClient = await createClient();
  const {
    data: { user: sessionUser },
  } = await cookieClient.auth.getUser();
  const customerId = sessionUser?.id ?? null;

  const totalQuantity = input.items.reduce((a, i) => a + i.quantity, 0);
  if (totalQuantity > 1 && !customerId) {
    throw new Error("ACCOUNT_REQUIRED");
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

  // Gift cards are claimed the same atomic, race-free way as the promo
  // code above (UPDATE ... WHERE redeemed_at IS NULL) — but unlike a promo
  // code, an invalid/already-used one here isn't silently ignored: the
  // customer explicitly chose to redeem this specific gift, so they get a
  // clear error and a chance to remove it and try again, never a
  // discount/credit that quietly fails to apply.
  let giftCardDiscountAmount = 0;
  let giftCardCreditAmount = 0;
  let claimedGiftCardCode: string | null = null;
  let claimedGiftCardType: "product" | "discount" | "credit" | null = null;
  let claimedGiftCardProductName: string | null = null;
  // Only meaningful for type "credit" — how much was left on the card
  // right after this order spent from it, so the customer can be told
  // "you still have $30" instead of the gift just quietly vanishing.
  let giftCardRemainingAfter: number | null = null;

  async function releaseReservations() {
    await supabase.rpc("checkout_restore_stock", { items: stockItems });
    if (redeemedCode) await supabase.from("spin_wheel_wins").update({ used_at: null }).eq("code", redeemedCode);
  }

  async function releaseGiftCard() {
    if (!claimedGiftCardCode) return;
    if (claimedGiftCardType === "credit") {
      await supabase.rpc("restore_gift_card_credit", { p_code: claimedGiftCardCode, p_amount: giftCardCreditAmount });
    } else {
      await supabase.from("gift_cards").update({ redeemed_at: null }).eq("code", claimedGiftCardCode);
    }
  }

  if (input.giftCardCode) {
    const normalizedGiftCode = input.giftCardCode.trim().toUpperCase();
    const { data: giftCard } = await supabase
      .from("gift_cards")
      .select("code, type, discount_percent, credit_amount, remaining_amount, product:products(name)")
      .eq("code", normalizedGiftCode)
      .is("redeemed_at", null)
      .maybeSingle();

    if (!giftCard) {
      await releaseReservations();
      throw new Error("GIFT_CARD_INVALID");
    }

    if (giftCard.type === "credit") {
      // remaining_amount is only null for a card generated before this
      // column existed — treat it as never having been spent yet.
      const balance = Number(giftCard.remaining_amount ?? giftCard.credit_amount ?? 0);
      const amountToUse = Math.min(balance, itemsTotal + input.shippingCost);
      if (amountToUse <= 0) {
        await releaseReservations();
        throw new Error("GIFT_CARD_INVALID");
      }

      const { data: remainingAfter, error: creditError } = await supabase.rpc("redeem_gift_card_credit", {
        p_code: normalizedGiftCode,
        p_amount: amountToUse,
      });
      // Either the migration for this function hasn't been applied yet, or
      // (extremely rare) another checkout spent from this exact balance in
      // the same instant and left less than amountToUse — either way this
      // must block rather than silently apply a discount that was never
      // actually deducted from the card.
      if (creditError) {
        await releaseReservations();
        throw new Error("GIFT_CARD_INVALID");
      }

      claimedGiftCardCode = normalizedGiftCode;
      claimedGiftCardType = "credit";
      giftCardCreditAmount = amountToUse;
      giftCardRemainingAfter = Number(remainingAfter);
    } else {
      const { data: claimedGift } = await supabase
        .from("gift_cards")
        .update({ redeemed_at: new Date().toISOString() })
        .eq("code", normalizedGiftCode)
        .is("redeemed_at", null)
        .select("code")
        .maybeSingle();

      // Lost the race — someone else's checkout claimed this exact code in
      // the gap between the read above and this update.
      if (!claimedGift) {
        await releaseReservations();
        throw new Error("GIFT_CARD_INVALID");
      }

      claimedGiftCardCode = normalizedGiftCode;
      claimedGiftCardType = giftCard.type as "product" | "discount";
      if (giftCard.type === "discount" && giftCard.discount_percent) {
        giftCardDiscountAmount = Math.round(itemsTotal * (giftCard.discount_percent / 100) * 100) / 100;
      } else if (giftCard.type === "product") {
        // The gifted item was already added to the cart at $0 on the
        // /carte-cadeau reveal page, so it's already reflected in
        // itemsTotal like any other line — this is only recorded so the
        // invoice/admin dashboard can say "this line was a free gift",
        // not left guessing why one line happens to be priced at $0.
        const p = Array.isArray(giftCard.product) ? giftCard.product[0] : giftCard.product;
        claimedGiftCardProductName = p?.name ?? null;
      }
    }
  }

  const discountAmount = Math.round(itemsTotal * (discountPercent / 100) * 100) / 100;
  const total = Math.max(0, itemsTotal - discountAmount - giftCardDiscountAmount - giftCardCreditAmount + input.shippingCost);

  const orderFields = {
    customer_name: input.name,
    customer_email: input.email,
    customer_phone: input.phone,
    customer_id: customerId,
    address: input.address,
    city: input.city,
    latitude: input.latitude,
    longitude: input.longitude,
    payment_method: input.paymentMethod,
    shipping_zone: input.shippingZone,
    shipping_cost: input.shippingCost,
    promo_code: redeemedCode,
    discount_amount: discountAmount,
    gift_card_code: claimedGiftCardCode,
    gift_card_type: claimedGiftCardType,
    gift_card_amount: giftCardDiscountAmount + giftCardCreditAmount,
    gift_card_product_name: claimedGiftCardProductName,
    total,
    status: "pending_payment",
  };

  // customer_id/promo_code/discount_amount/gift_card_* come from
  // migrations that may not have run yet — retry without them rather than
  // breaking checkout entirely.
  let { data: order, error } = await supabase.from("orders").insert(orderFields).select("id").single();
  if (error) {
    const { customer_id, promo_code, discount_amount, gift_card_code, gift_card_type, gift_card_amount, gift_card_product_name, ...fallback } =
      orderFields;
    ({ data: order, error } = await supabase.from("orders").insert(fallback).select("id").single());
  }

  if (error || !order) {
    // Stock, the promo code, and the gift card were all already
    // claimed/decremented above — if the order itself never got created,
    // give everything back rather than burning a customer's discount,
    // gift, and inventory on an order they don't actually have.
    await releaseReservations();
    await releaseGiftCard();
    throw error;
  }

  if (claimedGiftCardCode) {
    // Gift card redemption already requires being logged in (see
    // middleware.ts on /carte-cadeau) — customerId is always set here, but
    // guarded anyway rather than assumed.
    await supabase
      .from("gift_cards")
      .update({ order_id: order.id, ...(customerId ? { customer_id: customerId } : {}) })
      .eq("code", claimedGiftCardCode);
  }

  const orderItemFields = input.items.map((i) => ({
    order_id: order.id,
    product_id: i.productId,
    product_name: i.name,
    variant_label: i.variant,
    unit_price: i.price,
    quantity: i.quantity,
    image_url: i.image,
  }));
  // image_url comes from a migration that may not have run yet — retry
  // without it rather than failing the whole order over a missing column.
  const { error: itemsError } = await supabase.from("order_items").insert(orderItemFields);
  if (itemsError) {
    await supabase
      .from("order_items")
      .insert(orderItemFields.map(({ image_url, ...rest }) => rest));
  }

  try {
    const { notifyNewOrder } = await import("@/lib/notify-order");
    await notifyNewOrder({
      orderId: order.id,
      ...input,
      total,
      subtotal: itemsTotal,
      promoCode: redeemedCode,
      discountAmount,
      giftCardCode: claimedGiftCardCode,
      giftCardType: claimedGiftCardType,
      giftCardAmount: giftCardDiscountAmount + giftCardCreditAmount,
      giftCardProductName: claimedGiftCardProductName,
    });
  } catch {
    // notification failure must never block the customer's order from succeeding
  }

  // Stock just changed — without this, the cached catalog/product pages
  // (see lib/products.ts) could keep showing an item as available for up
  // to the cache's TTL after it actually sold out.
  revalidateTag("products");

  return {
    orderId: order.id as string,
    total,
    // Only set when a credit gift card was used and money is still left on
    // it — tells the client to keep showing it as active (with the new
    // balance) instead of clearing it like a fully-spent one-time code.
    giftCardRemainingAmount: claimedGiftCardType === "credit" && giftCardRemainingAfter && giftCardRemainingAfter > 0 ? giftCardRemainingAfter : null,
  };
}
