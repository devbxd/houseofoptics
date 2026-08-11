"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type ModelPhoto = { id: string; image_url: string; product: { name: string; slug: string } | null };

// Auto-scrolls slowly on its own, like the brand strip — the visitor can
// still drag/swipe it by hand to move faster.
export function ModelPhotosStrip({ photos, title }: { photos: ModelPhoto[]; title?: string }) {
  const linked = photos.filter((p) => p.product);
  // Cards here are much wider than the brand logos strip, so even 2 photos
  // duplicated is already wider than the viewport — no need to wait for a
  // large count before auto-scroll kicks in.
  const loop = linked.length > 1;
  const items = loop ? [...linked, ...linked] : linked;

  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef({ startX: 0, startScrollLeft: 0, dragging: false });

  useEffect(() => {
    if (!loop) return;
    const track = trackRef.current;
    if (!track) return;
    let raf: number;
    function tick() {
      if (track && !pausedRef.current) {
        track.scrollLeft += 0.3;
        if (track.scrollLeft >= track.scrollWidth / 2) track.scrollLeft = 0;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loop]);

  function pause() {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }
  function resumeSoon() {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 2500);
  }

  // Touch devices already get native swipe-scroll on overflow-x-auto —
  // only add manual click-and-drag for mouse users on desktop.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const track = trackRef.current;
    if (!track) return;
    pause();
    dragRef.current = { startX: e.clientX, startScrollLeft: track.scrollLeft, dragging: true };
    track.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.dragging) return;
    const track = trackRef.current;
    if (!track) return;
    track.scrollLeft = dragRef.current.startScrollLeft - (e.clientX - dragRef.current.startX);
  }
  function onPointerUp() {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    resumeSoon();
  }

  if (linked.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      {title && <h2 className="mb-8 text-center font-serif text-2xl tracking-wide">{title}</h2>}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={pause}
        onTouchEnd={resumeSoon}
        className={`no-scrollbar flex select-none gap-4 overflow-x-auto px-1 pb-2 ${loop ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((p, i) => (
          <Link
            key={`${p.id}-${i}`}
            href={`/produit/${p.product!.slug}`}
            draggable={false}
            className="group relative aspect-[3/4] w-48 shrink-0 overflow-hidden rounded-sm bg-neutral-100 sm:w-56"
          >
            <Image
              src={p.image_url}
              alt={p.product!.name}
              fill
              sizes="224px"
              className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-black shadow transition-transform group-hover:scale-110">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M6 18 18 6M9 6h9v9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
