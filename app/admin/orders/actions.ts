"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { restoreOrderStock } from "@/lib/order-stock";

export async function deleteOrder(id: string) {
  const supabase = createServiceClient();
  await supabase.from("orders").delete().eq("id", id);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/clients");
}

// Guarded against double-restoring if an already cancelled order gets
// cancelled again.
export async function cancelOrder(id: string) {
  const supabase = createServiceClient();

  const { data: order } = await supabase.from("orders").select("id, status").eq("id", id).maybeSingle();
  if (!order) throw new Error("Order not found");
  if (order.status === "cancelled") return;

  await restoreOrderStock(supabase, id);

  await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
  revalidatePath("/admin/orders");
  revalidateTag("products");
}
