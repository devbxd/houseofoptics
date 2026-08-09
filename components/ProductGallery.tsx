"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "./ImageLightbox";

export function ProductGallery({
  images,
  alt,
  discountPercent,
  zoomLabel,
}: {
  images: { url: string }[];
  alt: string;
  discountPercent?: number | null;
  zoomLabel?: string;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasMultiple = images.length > 1;

  // Auto-advance through the product's other photos, pausing while the
  // lightbox is open so it doesn't jump around mid-zoom.
  useEffect(() => {
    if (!hasMultiple || lightboxOpen) return;
    const interval = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [hasMultiple, lightboxOpen, images.length]);

  if (images.length === 0) {
    return <div className="aspect-square rounded-md bg-neutral-100" />;
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-md bg-neutral-100">
        <Image
          src={images[active].url}
          alt={alt}
          fill
          quality={95}
          sizes="50vw"
          className="cursor-zoom-in object-cover"
          priority
          onClick={() => setLightboxOpen(true)}
        />

        {!!discountPercent && discountPercent > 0 && (
          <span className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-black text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow hover:bg-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => (i + 1) % images.length)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow hover:bg-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border ${
                active === i ? "border-brand-black" : "border-neutral-200"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          index={active}
          onIndexChange={setActive}
          onClose={() => setLightboxOpen(false)}
          zoomLabel={zoomLabel}
        />
      )}
    </div>
  );
}
