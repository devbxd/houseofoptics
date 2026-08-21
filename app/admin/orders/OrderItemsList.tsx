"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "@/components/ImageLightbox";

type Item = { product_name: string; variant_label: string | null; quantity: number; unit_price: number; image_url: string | null };

export function OrderItemsList({ items }: { items: Item[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Only items with a photo are navigable in the lightbox — this maps each
  // item's position in the full list to its position within that subset.
  const photoItems = items.filter((it) => it.image_url);
  const photoIndexByItem = new Map(photoItems.map((it, i) => [it, i]));

  return (
    <>
      <ul className="mt-3 space-y-2 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {it.image_url ? (
              <button
                type="button"
                onClick={() => setLightboxIndex(photoIndexByItem.get(it) ?? 0)}
                className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100"
                aria-label="View photo"
              >
                <Image src={it.image_url} alt="" fill unoptimized sizes="40px" className="object-cover" />
              </button>
            ) : (
              <div className="h-10 w-10 shrink-0 rounded bg-neutral-100" />
            )}
            <span>
              {it.quantity} × {it.product_name}
              {it.variant_label ? ` (${it.variant_label})` : ""} — ${Number(it.unit_price).toFixed(2)}
              {Number(it.unit_price) === 0 && <span className="ml-1 text-brand-red">(Gift — Free)</span>}
            </span>
          </li>
        ))}
      </ul>

      {lightboxIndex !== null && photoItems.length > 0 && (
        <ImageLightbox
          images={photoItems.map((it) => ({ url: it.image_url as string }))}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
