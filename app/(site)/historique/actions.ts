"use server";

import { createServiceClient } from "@/lib/supabase/server";

export type HistoryOrder = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  city: string;
  payment_method: string;
  items: { product_name: string; variant_label: string | null; quantity: number; unit_price: number }[];
};

// Order IDs are unguessable UUIDs stored client-side (localStorage) after
// checkout — there are no customer accounts, so "only orders whose exact
// ID was requested" is the access boundary here, not a login.
export async function getOrderHistory(ids: string[]): Promise<HistoryOrder[]> {
  const cleanIds = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 100);
  if (cleanIds.length === 0) return [];

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("id, created_at, status, total, city, payment_method, items:order_items(product_name, variant_label, quantity, unit_price)")
    .in("id", cleanIds)
    .order("created_at", { ascending: false });

  return (data as HistoryOrder[]) ?? [];
}
