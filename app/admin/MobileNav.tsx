"use client";

import { useState } from "react";
import Link from "next/link";

type NavItem = { href: string; label: string };

export function MobileNav({ nav, signOut }: { nav: NavItem[]; signOut: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menu"
          className="flex items-center gap-2 text-neutral-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <p className="font-serif">Dashboard</p>
        <form action={signOut}>
          <button className="text-sm text-neutral-600">Log out</button>
        </form>
      </header>

      <div className={`fixed inset-0 z-[70] md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <span className="font-serif text-lg">Dashboard</span>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-2xl leading-none">
              ×
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded px-3 py-2.5 hover:bg-neutral-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
