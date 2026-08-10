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

// Mobile: a real centered modal with the image front and center — small
// screens don't have room for a subtle corner card to read well. Desktop:
// a quiet corner fixture that doesn't interrupt browsing.
export function PromoPopup({ popup }: { popup: Popup }) {
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `house-of-optics-popup-dismissed-${popup.id}`;
    const alreadyDismissed = !!localStorage.getItem(key);
    setDismissed(alreadyDismissed);
    if (alreadyDismissed) return;
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [popup.id]);

  function close() {
    setVisible(false);
    localStorage.setItem(`house-of-optics-popup-dismissed-${popup.id}`, "1");
  }

  if (dismissed) return null;

  return (
    <>
      {/* Mobile: centered modal */}
      <div
        className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-6 transition-opacity duration-500 md:hidden ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      >
        <div
          className={`relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform duration-500 ${
            visible ? "scale-100" : "scale-95"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-xl leading-none text-white hover:bg-black/60"
          >
            ×
          </button>

          {popup.image_url && (
            <div className="relative h-56 w-full">
              <Image src={popup.image_url} alt="" fill sizes="384px" className="object-cover" />
            </div>
          )}

          <div className="p-6 text-center">
            {popup.discount_percent != null && (
              <p className="font-serif text-4xl text-brand-red">{popup.discount_percent}%</p>
            )}
            <p className="mt-1 font-serif text-lg">{popup.title}</p>
            {popup.description && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-600">{popup.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: quiet corner card */}
      <div
        className={`fixed bottom-[5.25rem] left-4 z-40 hidden w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg transition-all duration-500 md:block ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-sm leading-none text-neutral-500 shadow-sm hover:text-brand-black"
        >
          ×
        </button>

        {popup.image_url && (
          <div className="relative h-28 w-full">
            <Image src={popup.image_url} alt="" fill sizes="256px" className="object-cover" />
          </div>
        )}

        <div className="p-4">
          {popup.discount_percent != null && (
            <p className="font-serif text-2xl text-brand-red">{popup.discount_percent}%</p>
          )}
          <p className="mt-0.5 text-sm font-medium">{popup.title}</p>
          {popup.description && (
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-neutral-600">{popup.description}</p>
          )}
        </div>
      </div>
    </>
  );
}
