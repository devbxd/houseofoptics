"use server";

import { createServiceClient } from "@/lib/supabase/server";

export async function subscribeStockNotification(input: {
  productId: string;
  colorLabel: string | null;
  sizeLabel: string | null;
  email: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("invalid_email");
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("stock_notifications").insert({
    product_id: input.productId,
    variant_color_label: input.colorLabel,
    variant_size_label: input.sizeLabel,
    email,
  });
  // 23505 = already subscribed to this exact product/variant — fine, treat
  // as success rather than surfacing an error for signing up twice.
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}
