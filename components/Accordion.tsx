"use client";

import { useState } from "react";

export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold uppercase tracking-wide"
      >
        {title}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7l5 5 5-5H5z" />
        </svg>
      </button>
      {open && <div className="pb-4 text-sm leading-relaxed text-neutral-700">{children}</div>}
    </div>
  );
}
