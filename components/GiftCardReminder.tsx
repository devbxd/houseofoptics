"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGiftCard } from "./GiftCardProvider";
import { previewGiftCard, type GiftCardPreview } from "@/app/(site)/carte-cadeau/actions";

// A small persistent reminder, visible on every page, for as long as the
// customer has a gift card they've revealed but not yet used — otherwise
// nothing on the site reminds them it's waiting once they navigate away
// from /carte-cadeau.
export function GiftCardReminder({ t }: { t: Record<string, string> }) {
  const { giftCard, clearGiftCard } = useGiftCard();
  const [preview, setPreview] = useState<GiftCardPreview | null>(null);

  useEffect(() => {
    if (!giftCard) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    // Re-checked against the database rather than trusted at face value —
    // it could have been redeemed since on another device/tab, in which
    // case the reminder should quietly disappear instead of dangling.
    previewGiftCard(giftCard.code).then((result) => {
      if (cancelled) return;
      if (!result.valid) {
        clearGiftCard();
        return;
      }
      setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [giftCard, clearGiftCard]);

  if (!preview || !preview.valid) return null;

  const summary =
    preview.type === "product"
      ? preview.product.name
      : preview.type === "discount"
        ? `-${preview.discountPercent}%`
        : `$${preview.creditAmount.toFixed(2)}`;

  const href = preview.type === "product" ? "/carte-cadeau" : "/checkout";

  return (
    <Link
      href={href}
      className="fixed bottom-[5.25rem] left-4 z-50 flex max-w-[80vw] items-center gap-2 rounded-full bg-brand-black px-4 py-2.5 text-xs text-white shadow-xl transition-transform hover:scale-105"
    >
      <span className="shrink-0 text-base" aria-hidden>
        🎁
      </span>
      <span className="truncate">{t["giftCard.reminder"].replace("{summary}", summary)}</span>
    </Link>
  );
}
