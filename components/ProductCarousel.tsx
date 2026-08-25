"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductCard } from "@/lib/products";
import { ProductCardTile } from "./ProductCardTile";

// A single row of product cards that advances on its own — used for
// "Recommended for you" on the homepage and "Latest sunglasses" on the
// product page. Auto-advances like TestimonialsCarousel; still swipeable
// by hand, it just doesn't need to be.
export function ProductCarousel({
  products,
  title,
  t,
}: {
  products: ProductCard[];
  title: string;
  t: Record<string, string>;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || products.length < 2) return;

    const interval = setInterval(() => {
      const cardWidth = (track.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + cardWidth + 16, behavior: "smooth" });
    }, 3500);

    return () => clearInterval(interval);
  }, [products.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function onScroll() {
      const track = trackRef.current;
      if (!track) return;
      const cardWidth = (track.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1;
      setActiveIndex(Math.round(track.scrollLeft / (cardWidth + 16)));
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToIndex(i: number) {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (track && card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <div>
      <h2 className="mb-8 text-center font-serif text-2xl tracking-wide">{title}</h2>
      <div
        ref={trackRef}
        // Pinned LTR — see BrandStrip.tsx for why (scrollLeft-based position
        // tracking here is LTR-only and breaks under Arabic).
        dir="ltr"
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[45%] shrink-0 snap-start sm:w-[30%] lg:w-[22%]">
            <ProductCardTile product={p} t={t} />
          </div>
        ))}
      </div>

      {products.length > 1 && products.length <= 10 && (
        <div className="mt-4 flex justify-center gap-2">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={p.name}
              className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-5 bg-brand-black" : "w-1.5 bg-neutral-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
