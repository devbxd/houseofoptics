import { createServiceClient } from "@/lib/supabase/server";
import { getSiteSettings, whatsappLink } from "@/lib/settings";

export default async function AdminOrdersPage() {
  const supabase = createServiceClient();
  const [{ data: orders }, settings] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, customer_name, customer_phone, customer_email, address, city, payment_method, shipping_zone, shipping_cost, total, status, created_at, items:order_items(product_name, variant_label, quantity, unit_price)"
      )
      .order("created_at", { ascending: false }),
    getSiteSettings(),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Orders</h1>

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
                </div>
                <div className="text-right">
                  <p className="text-sm">${Number(o.total).toFixed(2)}</p>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs uppercase text-neutral-600">{o.status}</span>
                </div>
              </div>
              <p className="mt-2 text-xs uppercase tracking-wide text-neutral-400">
                {o.payment_method === "cod" ? "Cash on delivery" : "Card payment"} · Shipping: {o.shipping_zone === "beirut" ? "Beirut" : "Outside Beirut"} (${Number(o.shipping_cost).toFixed(2)})
              </p>
              <ul className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
                {(o.items ?? []).map((it: any, i: number) => (
                  <li key={i}>
                    {it.quantity} × {it.product_name}
                    {it.variant_label ? ` (${it.variant_label})` : ""} — ${Number(it.unit_price).toFixed(2)}
                  </li>
                ))}
              </ul>
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
