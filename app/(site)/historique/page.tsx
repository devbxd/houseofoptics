"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-client";
import { getOrderHistoryIds } from "@/lib/order-history";
import { getOrderHistory, type HistoryOrder } from "./actions";

export default function OrderHistoryPage() {
  const { t } = useLocale();
  const [orders, setOrders] = useState<HistoryOrder[] | null>(null);

  useEffect(() => {
    const ids = getOrderHistoryIds();
    if (ids.length === 0) {
      setOrders([]);
      return;
    }
    getOrderHistory(ids).then(setOrders);
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-2xl">{t["history.title"]}</h1>

      {orders === null && <p className="mt-6 text-sm text-neutral-500">{t["history.loading"]}</p>}

      {orders?.length === 0 && (
        <div className="mt-6">
          <p className="text-sm text-neutral-500">{t["history.empty"]}</p>
          <Link href="/produits" className="mt-4 inline-block border border-brand-black px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-brand-black hover:text-white">
            {t["home.shopNow"]}
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-mono text-neutral-500">#{o.id.slice(0, 8)}</span>
                <span className="text-neutral-500">{new Date(o.created_at).toLocaleDateString()}</span>
                <span className="uppercase tracking-wide text-xs text-neutral-500">{o.status}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-neutral-700">
                {o.items.map((i, idx) => (
                  <li key={idx}>
                    {i.quantity} × {i.product_name}
                    {i.variant_label ? ` (${i.variant_label})` : ""} — ${i.unit_price.toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium">Total: ${o.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
