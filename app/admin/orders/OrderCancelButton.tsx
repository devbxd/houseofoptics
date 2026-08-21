"use client";

import { useTransition } from "react";
import { cancelOrder } from "./actions";

export function OrderCancelButton({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  if (status === "cancelled") {
    return <span className="text-xs text-neutral-400">Cancelled</span>;
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Cancel this order? Its stock will be given back automatically.")) {
          startTransition(() => cancelOrder(orderId));
        }
      }}
      className="text-xs text-neutral-400 hover:text-brand-red disabled:opacity-50"
    >
      {pending ? "..." : "Cancel"}
    </button>
  );
}
