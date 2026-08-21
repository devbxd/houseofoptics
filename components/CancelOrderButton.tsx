"use client";

import { useState } from "react";
import { cancelOrderAsCustomer } from "@/app/(site)/order-actions";

export function CancelOrderButton({
  orderId,
  status,
  onCancelled,
  t,
}: {
  orderId: string;
  status: string;
  onCancelled: () => void;
  t: Record<string, string>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "cancelled") {
    return <span className="text-xs uppercase tracking-wide text-neutral-400">{t["order.cancelled"]}</span>;
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!confirm(t["order.cancelConfirm"])) return;
          setPending(true);
          setError(null);
          try {
            const res = await cancelOrderAsCustomer(orderId);
            if (res.ok) {
              onCancelled();
            } else {
              setError(res.error ?? t["checkout.genericError"]);
            }
          } finally {
            setPending(false);
          }
        }}
        className="text-xs uppercase tracking-wide text-neutral-500 underline underline-offset-2 hover:text-brand-red disabled:opacity-50"
      >
        {pending ? t["order.cancelling"] : t["order.cancel"]}
      </button>
      {error && <p className="mt-1 text-xs text-brand-red">{error}</p>}
    </div>
  );
}
