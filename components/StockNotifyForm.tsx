"use client";

import { useState } from "react";
import { subscribeStockNotification } from "@/app/(site)/notify-stock-actions";

export function StockNotifyForm({
  productId,
  colorLabel,
  sizeLabel,
  t,
}: {
  productId: string;
  colorLabel: string | null;
  sizeLabel: string | null;
  t: Record<string, string>;
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return <p className="mt-3 text-sm text-emerald-700">{t["product.notifyMeConfirmed"]}</p>;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
          await subscribeStockNotification({ productId, colorLabel, sizeLabel, email });
          setDone(true);
        } catch {
          setError(t["product.notifyMeError"]);
        } finally {
          setPending(false);
        }
      }}
      className="mt-3"
    >
      <p className="mb-1.5 text-sm text-neutral-700">{t["product.notifyMe"]}</p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t["product.notifyMePlaceholder"]}
          className="min-w-0 flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white disabled:opacity-50"
        >
          {pending ? "..." : t["product.notifyMeSubmit"]}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </form>
  );
}
