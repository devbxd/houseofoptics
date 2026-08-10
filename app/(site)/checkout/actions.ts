"use server";

import { createServiceClient } from "@/lib/supabase/server";

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

  // Re-validate the promo code against the database rather than trusting
  // whatever discount the client displayed — an already-used, expired, or
  // made-up code is silently ignored instead of failing the whole order.
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
      discountPercent = win.discount_percent;
      redeemedCode = normalized;
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

  if (error || !order) throw error;

  if (redeemedCode) {
    await supabase
      .from("spin_wheel_wins")
      .update({ used_at: new Date().toISOString() })
      .eq("code", redeemedCode)
      .is("used_at", null);
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

  return { orderId: order.id as string, total };
}
