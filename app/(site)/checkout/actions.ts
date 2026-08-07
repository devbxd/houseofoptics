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
  items: { productId: string; variant: string | null; name: string; price: number; quantity: number }[];
};

export async function createOrder(input: CheckoutInput) {
  if (!input.name || !input.email || !input.phone || !input.address || input.items.length === 0) {
    throw new Error("Missing required checkout fields");
  }

  const supabase = createServiceClient();
  const itemsTotal = input.items.reduce((a, i) => a + i.price * i.quantity, 0);
  const total = itemsTotal + input.shippingCost;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
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
      total,
      status: "pending_payment",
    })
    .select("id")
    .single();

  if (error || !order) throw error;

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
