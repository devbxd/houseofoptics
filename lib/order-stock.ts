import { createServiceClient } from "@/lib/supabase/server";
import { resolveVariant } from "@/lib/variant-resolve";

type ServiceClient = ReturnType<typeof createServiceClient>;

// Gives back exactly the stock an order took — same atomic RPC used to
// restore it when a checkout fails to save, just triggered by a
// cancellation (admin- or customer-initiated) instead. Shared so both
// call sites resolve variants and call the RPC identically.
export async function restoreOrderStock(supabase: ServiceClient, orderId: string): Promise<void> {
  const { data: items } = await supabase.from("order_items").select("product_id, variant_label, quantity").eq("order_id", orderId);
  if (!items || items.length === 0) return;

  const productIds = [...new Set(items.map((i) => i.product_id).filter((v): v is string => !!v))];
  const [{ data: allVariants }, { data: productRows }] = productIds.length
    ? await Promise.all([
        supabase.from("product_variants").select("id, product_id, color_label, size_label, label, kind, price, stock").in("product_id", productIds),
        supabase.from("products").select("id, base_color, base_size").in("id", productIds),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];
  const productById = new Map((productRows ?? []).map((p: any) => [p.id, p]));

  const stockItems = items
    .filter((i) => i.product_id)
    .map((i) => {
      const product: any = productById.get(i.product_id);
      const match = i.variant_label
        ? resolveVariant(
            (allVariants ?? []).filter((v: any) => v.product_id === i.product_id),
            { color: product?.base_color ?? null, size: product?.base_size ?? null },
            i.variant_label
          )
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
