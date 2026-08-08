"use client";

import { useState } from "react";
import Link from "next/link";

type Category = { id: string; name: string; slug: string; parent_id: string | null };

export function HamburgerMenu({
  categories,
  whatsappUrl,
  facebookUrl,
  instagramUrl,
  mailUrl,
  t,
}: {
  categories: Category[];
  whatsappUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  mailUrl: string;
  t: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu"
        className="flex items-center gap-2 text-xs uppercase tracking-[0.15em]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
        Menu
      </button>

      <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <span className="font-serif text-lg">Menu</span>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-2xl leading-none">
              ×
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 py-4 text-sm">
            <Link href="/" onClick={() => setOpen(false)} className="block py-2.5 uppercase tracking-wide">
              {t["nav.home"]}
            </Link>
            <Link href="/produits" onClick={() => setOpen(false)} className="block py-2.5 uppercase tracking-wide">
              {t["nav.allProducts"]}
            </Link>
            {categories.length > 0 && (
              <div className="mt-2 border-t border-neutral-100 pt-2">
                {categories
                  .filter((c) => !c.parent_id)
                  .map((c) => (
                    <div key={c.id}>
                      <Link
                        href={`/categorie/${c.slug}`}
                        onClick={() => setOpen(false)}
                        className="block py-2 pl-3 text-neutral-600"
                      >
                        {c.name}
                      </Link>
                      {categories
                        .filter((sub) => sub.parent_id === c.id)
                        .map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/categorie/${sub.slug}`}
                            onClick={() => setOpen(false)}
                            className="block py-1.5 pl-7 text-xs text-neutral-500"
                          >
                            {sub.name}
                          </Link>
                        ))}
                    </div>
                  ))}
              </div>
            )}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-2 block border-t border-neutral-100 py-2.5 pt-4 uppercase tracking-wide"
            >
              {t["nav.contact"]}
            </Link>

            <div className="mt-6 flex items-center justify-center gap-6 border-t border-neutral-200 pt-6">
              {mailUrl && (
                <a href={mailUrl} aria-label="Email">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6 text-neutral-700 hover:text-brand-black">
                    <path d="M3 6h18v12H3z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <svg viewBox="0 0 32 32" className="h-7 w-7">
                    <circle cx="16" cy="16" r="16" fill="#25D366" />
                    <path
                      fill="#fff"
                      d="M23.47 8.52A10.4 10.4 0 0 0 16.02 5.3c-5.74 0-10.42 4.68-10.42 10.42 0 1.84.48 3.63 1.4 5.21L5.5 26.7l6-1.57a10.4 10.4 0 0 0 4.98 1.27h.01c5.74 0 10.42-4.68 10.42-10.42a10.36 10.36 0 0 0-3.44-7.46Zm-7.45 16.02h-.01a8.66 8.66 0 0 1-4.41-1.21l-.32-.19-3.27.86.88-3.19-.21-.33a8.63 8.63 0 0 1-1.33-4.57c0-4.77 3.88-8.65 8.66-8.65a8.6 8.6 0 0 1 6.12 2.54 8.6 8.6 0 0 1 2.53 6.12c0 4.77-3.88 8.62-8.64 8.62Zm4.75-6.47c-.26-.13-1.53-.75-1.77-.84-.24-.09-.41-.13-.58.13-.17.26-.67.84-.82 1.01-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.1-1.29-.78-.69-1.3-1.55-1.46-1.81-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.92-.21-.51-.42-.44-.58-.45h-.5c-.17 0-.45.06-.68.32-.24.26-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.74 4.35 3.84.61.26 1.08.42 1.45.54.61.19 1.16.17 1.6.1.49-.07 1.53-.62 1.74-1.22.22-.6.22-1.12.15-1.22-.06-.11-.24-.17-.5-.3Z"
                    />
                  </svg>
                </a>
              )}
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-neutral-700 hover:text-brand-black">
                    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
                  </svg>
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6 text-neutral-700 hover:text-brand-black">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
