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
        <span className="relative h-3 w-3 shrink-0">
          <span className="absolute left-1/2 top-1/2 h-[1.5px] w-3 -translate-x-1/2 -translate-y-1/2 bg-current" />
          <span
            className={`absolute left-1/2 top-1/2 h-[1.5px] w-3 -translate-x-1/2 -translate-y-1/2 bg-current transition-transform ${open ? "rotate-0" : "rotate-90"}`}
          />
        </span>
      </button>
      {open && <div className="pb-4 text-sm leading-relaxed text-neutral-700">{children}</div>}
    </div>
  );
}
