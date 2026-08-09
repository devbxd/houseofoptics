"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Popup = {
  id: string;
  title: string;
  description: string;
  discount_percent: number | null;
  image_url: string | null;
};

export function PromoPopup({ popup }: { popup: Popup }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `house-of-optics-popup-dismissed-${popup.id}`;
    if (localStorage.getItem(key)) return;
    const timer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(timer);
  }, [popup.id]);

  function close() {
    setOpen(false);
    localStorage.setItem(`house-of-optics-popup-dismissed-${popup.id}`, "1");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4" onClick={close}>
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-md bg-white text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-xl leading-none text-white hover:bg-black/60"
        >
          ×
        </button>

        {popup.image_url && (
          <div className="relative h-44 w-full">
            <Image src={popup.image_url} alt="" fill sizes="384px" className="object-cover" />
          </div>
        )}

        <div className="p-8">
          {popup.discount_percent != null && (
            <p className="font-serif text-5xl text-brand-red">{popup.discount_percent}%</p>
          )}
          <h2 className="mt-2 font-serif text-xl">{popup.title}</h2>
          {popup.description && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-600">{popup.description}</p>
          )}
          <button
            type="button"
            onClick={close}
            className="mt-6 inline-block border border-brand-black px-8 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-brand-black hover:text-white"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
