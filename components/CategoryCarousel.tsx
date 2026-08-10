"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type CategoryCard = { id: string; slug: string; name: string; image: string | null; count: number };

export function CategoryCarousel({
  categories,
  shopNowLabel,
  productsLabel,
}: {
  categories: CategoryCard[];
  shopNowLabel: string;
  productsLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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

  return (
    <div>
      <div ref={trackRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/categorie/${c.slug}`}
            className="group relative aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden rounded-sm bg-neutral-100 sm:w-[45%] lg:w-[30%]"
          >
            {c.image ? (
              <Image
                src={c.image}
                alt=""
                fill
                quality={90}
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 30vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-neutral-200" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-center text-white">
              <p className="font-serif text-xl tracking-wide">{c.name}</p>
              <span className="mt-3 inline-block border border-white px-6 py-2 text-xs uppercase tracking-[0.2em] transition-colors group-hover:bg-white group-hover:text-brand-black">
                {shopNowLabel}
              </span>
              <p className="mt-2 text-xs italic text-white/80">
                {c.count} {productsLabel}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {categories.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {categories.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={c.name}
              className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-5 bg-brand-black" : "w-1.5 bg-neutral-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
