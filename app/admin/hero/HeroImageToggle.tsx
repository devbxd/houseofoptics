"use client";

import { useState } from "react";
import { toggleHeroImage } from "./actions";

export function HeroImageToggle({ imageId, initialIsHero }: { imageId: string; initialIsHero: boolean }) {
  const [isHero, setIsHero] = useState(initialIsHero);
  const [pending, setPending] = useState(false);

  return (
    <button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const next = !isHero;
        try {
          await toggleHeroImage(imageId, next);
          setIsHero(next);
        } finally {
          setPending(false);
        }
      }}
      className={`w-full py-1.5 text-xs uppercase tracking-wide transition-colors disabled:opacity-50 ${
        isHero ? "bg-brand-red text-white" : "border border-neutral-300 text-neutral-600 hover:border-brand-black"
      }`}
    >
      {isHero ? "In hero ✓" : "Add to hero"}
    </button>
  );
}
