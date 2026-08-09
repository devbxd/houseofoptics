"use client";

import Image from "next/image";
import { deleteHeroSlide } from "./actions";

type Slide = { id: string; image_url: string };

export function HeroSlidesGrid({ slides }: { slides: Slide[] }) {
  if (slides.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {slides.map((s) => (
        <div key={s.id} className="relative h-20 w-20 overflow-hidden rounded border border-neutral-200">
          <Image src={s.image_url} alt="" fill sizes="80px" className="object-cover" />
          <button
            type="button"
            onClick={async () => {
              await deleteHeroSlide(s.id);
            }}
            className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
