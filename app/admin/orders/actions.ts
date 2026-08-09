"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function deleteOrder(id: string) {
  const supabase = createServiceClient();
  await supabase.from("orders").delete().eq("id", id);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/clients");
}
