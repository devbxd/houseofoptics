import { createServiceClient } from "@/lib/supabase/server";
import { getSiteSettings, whatsappLink } from "@/lib/settings";
import { OrderDeleteButton } from "./OrderDeleteButton";
import { OrderCancelButton } from "./OrderCancelButton";
import { OrderStatusSelect } from "./OrderStatusSelect";
import { OrderItemsList } from "./OrderItemsList";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const supabase = createServiceClient();

  // select("*") rather than naming every column — promo_code/discount_amount
  // and the gift_card_* columns come from migrations that may not have run
  // yet on this deployment, and "*" degrades gracefully instead of erroring
  // the whole page over a missing column.
  let query = supabase
    .from("orders")
    .select("*, items:order_items(product_name, variant_label, quantity, unit_price, image_url)")
    .order("created_at", { ascending: false });

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const [{ data: orders }, settings] = await Promise.all([query, getSiteSettings()]);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Orders</h1>

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">From</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">To</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white"
        >
          Filter
        </button>
        {(from || to) && (
          <a href="/admin/orders" className="text-xs text-neutral-400 hover:text-neutral-600">
            Clear
          </a>
        )}
      </form>

      {(!orders || orders.length === 0) && <p className="text-sm text-neutral-500">No orders yet.</p>}

      <div className="space-y-4">
        {(orders as any[] ?? []).map((o) => {
          const summary = (o.items ?? [])
            .map((it: any) => `${it.quantity}x ${it.product_name}${it.variant_label ? ` (${it.variant_label})` : ""}`)
            .join(", ");
          const notifyMessage = `New order #${o.id.slice(0, 8)} — ${o.customer_name} (${o.customer_phone})\n${summary}\nTotal: $${Number(o.total).toFixed(2)} — ${o.payment_method === "cod" ? "Cash on delivery" : "Card"}\n${o.address}, ${o.city}`;

          return (
            <div key={o.id} className="rounded-md border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{o.customer_name}</p>
                  <p className="text-xs text-neutral-500">
                    {o.customer_phone} · {o.customer_email} · {o.address}, {o.city}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">${Number(o.total).toFixed(2)}</p>
                  <OrderStatusSelect orderId={o.id} status={o.status} />
                  <div className="mt-2 flex items-center justify-end gap-3">
                    <OrderCancelButton orderId={o.id} status={o.status} />
                    <OrderDeleteButton orderId={o.id} />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs uppercase tracking-wide text-neutral-400">
                {o.payment_method === "cod" ? "Cash on delivery" : "Card payment"} · Shipping: {o.shipping_zone === "beirut" ? "Beirut" : "Outside Beirut"} (${Number(o.shipping_cost).toFixed(2)})
              </p>
              <OrderItemsList items={o.items ?? []} />
              {(o.promo_code || o.gift_card_code) && (
                <div className="mt-2 space-y-0.5 border-t border-dashed border-neutral-100 pt-2 text-xs text-brand-red">
                  {o.promo_code && (
                    <p>
                      Promo code {o.promo_code}: -${Number(o.discount_amount ?? 0).toFixed(2)}
                    </p>
                  )}
                  {o.gift_card_code && (
                    <p>
                      🎁 Gift card {o.gift_card_code}
                      {o.gift_card_type === "product"
                        ? ` — ${o.gift_card_product_name ?? "free item"} (FREE)`
                        : `: -$${Number(o.gift_card_amount ?? 0).toFixed(2)}`}
                    </p>
                  )}
                </div>
              )}
              {settings.whatsapp_number && (
                <a
                  href={whatsappLink(settings.whatsapp_number, notifyMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs uppercase tracking-wide text-green-700 hover:underline"
                >
                  Send WhatsApp reminder →
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
