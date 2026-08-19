import { createServiceClient } from "@/lib/supabase/server";
import { GiftCardTypePicker } from "./GiftCardTypePicker";
import { GiftCardRow } from "./GiftCardRow";

export default async function GiftCardsPage() {
  const supabase = createServiceClient();

  const [{ data: products }, { data: cards }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, images:product_images(url, sort_order)")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("gift_cards")
      .select(
        "id, code, type, discount_percent, credit_amount, recipient_name, message, redeemed_at, created_at, product:products(name)"
      )
      .order("created_at", { ascending: false }),
  ]);

  const pickerProducts = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    images: (p.images ?? []).slice().sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
  }));

  const rows = (cards ?? []).map((c: any) => ({
    id: c.id,
    code: c.code,
    recipientName: c.recipient_name,
    redeemed: !!c.redeemed_at,
    createdAt: c.created_at,
    summary:
      c.type === "product"
        ? ((Array.isArray(c.product) ? c.product[0]?.name : c.product?.name) ?? "Deleted product")
        : c.type === "discount"
          ? `${c.discount_percent}% off`
          : `$${Number(c.credit_amount).toFixed(2)} credit`,
  }));

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Gift Cards</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Generate a code for a free item, a discount, or store credit, then hand it to the customer — they redeem it on the
        public Gift Card page and it's applied automatically at checkout.
      </p>

      <GiftCardTypePicker products={pickerProducts} />

      <h2 className="mb-3 mt-10 font-serif text-xl">Issued gift cards</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No gift cards generated yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">For</th>
                <th className="py-2 pr-4">Gift</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <GiftCardRow key={row.id} card={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
