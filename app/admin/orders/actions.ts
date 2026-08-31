"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { restoreOrderStock } from "@/lib/order-stock";

export async function deleteOrder(id: string) {
  const supabase = createServiceClient();
  // Don't restore twice — a cancelled order already gave its stock back.
  const { data: order } = await supabase.from("orders").select("status").eq("id", id).maybeSingle();
  if (order && order.status !== "cancelled") await restoreOrderStock(supabase, id);
  await supabase.from("orders").delete().eq("id", id);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/clients");
  revalidateTag("products");
}

// The non-cancelled states an order can move through by hand — there was
// previously no way to mark an order fulfilled at all, so every order that
// wasn't cancelled just sat as "pending_payment" forever. Cancelling stays
// its own dedicated action (it restores stock); this never touches stock.
const ORDER_STATUSES = ["pending_payment", "confirmed", "delivered"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!ORDER_STATUSES.includes(status)) throw new Error("Invalid status");
  const supabase = createServiceClient();
  const { data: order } = await supabase.from("orders").select("status").eq("id", id).maybeSingle();
  if (!order) throw new Error("Order not found");
  // A cancelled order already had its stock restored — moving it back to
  // an active status here would leave that stock double-counted, so
  // reactivating one isn't allowed from this simple status dropdown.
  if (order.status === "cancelled") throw new Error("This order is cancelled");
  await supabase.from("orders").update({ status }).eq("id", id);
  revalidatePath("/admin/orders");
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
