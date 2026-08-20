"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGiftCard } from "./GiftCardProvider";

// A small persistent reminder, visible on every page, for as long as the
// customer's account has a gift card they've revealed but not yet used —
// GiftCardProvider already re-fetches this from the account (not local
// storage), so it shows up the same way on any device they're logged into.
export function GiftCardReminder({ t }: { t: Record<string, string> }) {
  const { giftCard } = useGiftCard();
  const pathname = usePathname();

  // Both /checkout and /carte-cadeau already show this exact gift card's
  // status inline — showing the floating pill on top of that reads as a
  // second, conflicting signal ("is it applied, or do I still need to do
  // something with this pill?").
  if (!giftCard || !giftCard.valid || pathname === "/checkout" || pathname === "/carte-cadeau") return null;

  const summary =
    giftCard.type === "product"
      ? giftCard.product.name
      : giftCard.type === "discount"
        ? `-${giftCard.discountPercent}%`
        : `$${giftCard.creditAmount.toFixed(2)}`;

  const href = giftCard.type === "product" ? "/carte-cadeau" : "/checkout";

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
