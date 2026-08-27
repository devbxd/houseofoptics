"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { restoreOrderStock } from "@/lib/order-stock";

// A "client" isn't its own row anywhere — it's derived from orders and
// spin-wheel entries — so deleting one means deleting every order placed
// under that email (order_items cascade automatically) plus any wheel wins.
export async function deleteClient(email: string) {
  const supabase = createServiceClient();
  const { data: orders } = await supabase.from("orders").select("id, status").eq("customer_email", email);
  for (const o of orders ?? []) {
    if (o.status !== "cancelled") await restoreOrderStock(supabase, o.id);
  }
  await supabase.from("orders").delete().eq("customer_email", email);
  await supabase.from("spin_wheel_wins").delete().eq("email", email);
  revalidatePath("/admin/clients");
  revalidatePath("/admin/orders");
  revalidateTag("products");
}
