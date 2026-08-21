import { createServiceClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createServiceClient>;

// Mirrors variantLabel() in checkout/actions.ts — resolves each order line
// back to a concrete product_variants row (if any) so the stock restore
// hits the same row checkout_decrement_stock took it from.
function variantLabel(v: { color_label: string | null; size_label: string | null; label?: string | null; kind?: string | null }) {
  const color = v.color_label ?? (v.kind === "color" ? v.label : null) ?? null;
  const size = v.size_label ?? (v.kind === "size" ? v.label : null) ?? null;
  if (color && size) return `${color} — ${size}`;
  return color || size || "";
}

// Gives back exactly the stock an order took — same atomic RPC used to
// restore it when a checkout fails to save, just triggered by a
// cancellation (admin- or customer-initiated) instead. Shared so both
// call sites resolve variants and call the RPC identically.
export async function restoreOrderStock(supabase: ServiceClient, orderId: string): Promise<void> {
  const { data: items } = await supabase.from("order_items").select("product_id, variant_label, quantity").eq("order_id", orderId);
  if (!items || items.length === 0) return;

  const productIds = [...new Set(items.map((i) => i.product_id).filter((v): v is string => !!v))];
  const { data: allVariants } = productIds.length
    ? await supabase.from("product_variants").select("id, product_id, color_label, size_label, label, kind").in("product_id", productIds)
    : { data: [] as any[] };

  const stockItems = items
    .filter((i) => i.product_id)
    .map((i) => {
      const match = i.variant_label
        ? (allVariants ?? []).find((v) => v.product_id === i.product_id && variantLabel(v) === i.variant_label)
        : null;
      return { product_id: i.product_id as string, variant_id: match?.id ?? null, quantity: i.quantity };
    });

  if (stockItems.length === 0) return;

  const { error } = await supabase.rpc("checkout_restore_stock", { items: stockItems });
  // Function missing (migration not applied) is the one error worth
  // swallowing — anything else and the order shouldn't be marked
  // cancelled while its stock silently never came back.
  if (error && error.code !== "PGRST202") throw new Error(error.message);
}
