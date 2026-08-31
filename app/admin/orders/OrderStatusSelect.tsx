"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus, type OrderStatus } from "./actions";

const LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending",
  confirmed: "Confirmed",
  delivered: "Delivered",
};

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [pending, startTransition] = useTransition();

  // A cancelled order's stock was already restored — changing its status
  // here isn't allowed (see updateOrderStatus), so just show it plainly.
  if (current === "cancelled") {
    return <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs uppercase text-neutral-600">Cancelled</span>;
  }

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as OrderStatus;
        const prev = current;
        setCurrent(next);
        startTransition(async () => {
          try {
            await updateOrderStatus(orderId, next);
          } catch {
            setCurrent(prev);
          }
        });
      }}
      className="rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs uppercase text-neutral-600 disabled:opacity-50"
    >
      {(Object.keys(LABELS) as OrderStatus[]).map((s) => (
        <option key={s} value={s}>
          {LABELS[s]}
        </option>
      ))}
    </select>
  );
}
