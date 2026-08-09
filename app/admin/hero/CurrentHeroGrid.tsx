"use client";

import Image from "next/image";
import { toggleHeroImage } from "./actions";

type Img = { id: string; url: string };

export function CurrentHeroGrid({ images }: { images: Img[] }) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {images.map((img) => (
        <div key={img.id} className="relative h-20 w-20 overflow-hidden rounded border border-neutral-200">
          <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
          <button
            type="button"
            onClick={async () => {
              await toggleHeroImage(img.id, false);
            }}
            aria-label="Remove from carousel"
            className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
