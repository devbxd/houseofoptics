"use client";

import { useEffect, useRef } from "react";

type Testimonial = { id: string; author_name: string; quote: string; rating: number | null };

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || testimonials.length < 2) return;

    const interval = setInterval(() => {
      const cardWidth = track.firstElementChild?.clientWidth ?? 0;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
      track.scrollTo({
        left: atEnd ? 0 : track.scrollLeft + cardWidth + 16,
        behavior: "smooth",
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="mb-10 text-center font-serif text-2xl tracking-wide">What our customers say</h2>
      <div ref={trackRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4">
        {testimonials.map((r) => (
          <div
            key={r.id}
            className="w-[280px] shrink-0 snap-start border border-neutral-200 p-6 text-sm"
          >
            {r.rating && (
              <p className="mb-2 text-brand-red">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
            )}
            <p className="text-neutral-700">&ldquo;{r.quote}&rdquo;</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-neutral-400">{r.author_name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
