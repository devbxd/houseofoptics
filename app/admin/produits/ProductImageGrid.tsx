"use client";

import { useState } from "react";
import Image from "next/image";
import { deleteProductImage, setProductImagePosition } from "./actions";

type Img = { id: string; url: string };

export function ProductImageGrid({ productId, images }: { productId: string; images: Img[] }) {
  const [movingId, setMovingId] = useState<string | null>(null);

  if (images.length === 0) return null;

  return (
    <div className="mb-6 flex max-w-lg flex-wrap gap-3">
      {images.map((img, i) => (
        <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded border border-neutral-200">
          <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
          <button
            type="button"
            onClick={async () => {
              await deleteProductImage(img.id);
            }}
            className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white"
          >
            ✕
          </button>
          {images.length > 1 && (
            <select
              aria-label="Position"
              value={i}
              disabled={movingId === img.id}
              onChange={async (e) => {
                setMovingId(img.id);
                try {
                  await setProductImagePosition(productId, img.id, Number(e.target.value));
                } finally {
                  setMovingId(null);
                }
              }}
              className="absolute bottom-0.5 left-0.5 w-9 rounded border-0 bg-black/60 py-0.5 text-center text-xs text-white disabled:opacity-50"
            >
              {images.map((_, idx) => (
                <option key={idx} value={idx}>
                  {idx + 1}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
