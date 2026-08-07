"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Slide = { id: string; name: string; url: string };

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const interval = setInterval(() => setActive((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <Image
            src={s.url}
            alt={s.name}
            fill
            quality={95}
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50" />
    </div>
  );
}
