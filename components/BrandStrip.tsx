"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type Brand = { id: string; name: string; slug: string; logo_url?: string | null };

// Shows ~5 logos at a time: auto-scrolls on its own, but the visitor can
// also drag/swipe it by hand to move faster (mouse drag on desktop, native
// touch swipe on mobile).
export function BrandStrip({ brands, title }: { brands: Brand[]; title?: string }) {
  const withLogo = brands.filter((b) => b.logo_url);
  const loop = withLogo.length > 5;
  const items = loop ? [...withLogo, ...withLogo] : withLogo;

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
        track.scrollLeft += 0.5;
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

  if (withLogo.length === 0) return null;

  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-10">
      {title && <h2 className="mb-8 text-center text-xs uppercase tracking-[0.35em] text-neutral-500">{title}</h2>}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={pause}
        onTouchEnd={resumeSoon}
        className={`no-scrollbar flex select-none gap-x-2 overflow-x-auto px-6 ${loop ? "cursor-grab active:cursor-grabbing" : "justify-center"}`}
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((b, i) => (
          <Link
            key={`${b.id}-${i}`}
            href={`/marque/${b.slug}`}
            aria-label={b.name}
            draggable={false}
            className="relative h-16 w-1/5 shrink-0 grayscale transition-all hover:grayscale-0"
          >
            <Image src={b.logo_url!} alt={b.name} fill sizes="20vw" className="pointer-events-none object-contain" />
          </Link>
        ))}
      </div>
    </section>
  );
}
