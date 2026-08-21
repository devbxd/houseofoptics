"use client";

import { useRouter } from "next/navigation";
import { CancelOrderButton } from "@/components/CancelOrderButton";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: { product_name: string; variant_label: string | null; quantity: number; unit_price: number }[];
};

export function OrdersList({ orders, t }: { orders: Order[]; t: Record<string, string> }) {
  const router = useRouter();

  if (orders.length === 0) {
    return <p className="text-sm text-neutral-500">{t["account.dashboard.ordersEmpty"]}</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="rounded-md border border-neutral-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-mono text-neutral-500">#{o.id.slice(0, 8)}</span>
            <span className="text-neutral-500">{new Date(o.created_at).toLocaleDateString()}</span>
            <span className="text-xs uppercase tracking-wide text-neutral-500">{o.status}</span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-neutral-700">
            {(o.items ?? []).map((i, idx) => (
              <li key={idx}>
                {i.quantity} × {i.product_name}
                {i.variant_label ? ` (${i.variant_label})` : ""} — ${Number(i.unit_price).toFixed(2)}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm font-medium">Total: ${Number(o.total).toFixed(2)}</p>
            <CancelOrderButton orderId={o.id} status={o.status} onCancelled={() => router.refresh()} t={t} />
          </div>
        </div>
      ))}
    </div>
  );
}
