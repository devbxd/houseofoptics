"use client";

import { useState } from "react";
import { deleteGiftCard } from "./actions";

export function GiftCardRow({
  card,
}: {
  card: { id: string; code: string; recipientName: string; summary: string; redeemed: boolean; createdAt: string };
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="border-b border-neutral-100">
      <td className="py-2 pr-4 font-mono text-xs">{card.code}</td>
      <td className="py-2 pr-4">{card.recipientName}</td>
      <td className="py-2 pr-4">{card.summary}</td>
      <td className="py-2 pr-4">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            card.redeemed ? "bg-neutral-100 text-neutral-500" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {card.redeemed ? "Redeemed" : "Unused"}
        </span>
      </td>
      <td className="py-2 pr-4 text-xs text-neutral-500">{new Date(card.createdAt).toLocaleDateString()}</td>
      <td className="py-2 text-right">
        <button
          disabled={deleting}
          onClick={async () => {
            if (!confirm(`Delete gift card ${card.code}? This can't be undone.`)) return;
            setDeleting(true);
            setError(null);
            try {
              await deleteGiftCard(card.id);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Delete failed");
              setDeleting(false);
            }
          }}
          className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-50"
        >
          {deleting ? "..." : "Delete"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
