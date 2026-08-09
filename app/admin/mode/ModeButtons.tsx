"use client";

import { useState } from "react";
import { setSiteMode } from "./actions";
import type { SiteMode } from "@/lib/settings";

const OPTIONS: { value: SiteMode; label: string; emoji: string; activeClass: string }[] = [
  { value: null, label: "Normal", emoji: "🏬", activeClass: "bg-brand-black text-white border-brand-black" },
  { value: "noel", label: "Noël & Nouvel An", emoji: "🎄", activeClass: "bg-[#0e3b28] text-white border-[#0e3b28]" },
  { value: "halloween", label: "Mode Halloween", emoji: "🎃", activeClass: "bg-[#3a1a4d] text-white border-[#3a1a4d]" },
];

export function ModeButtons({ initialMode }: { initialMode: SiteMode }) {
  const [mode, setMode] = useState<SiteMode>(initialMode);
  const [pending, setPending] = useState(false);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.label}
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await setSiteMode(opt.value);
              setMode(opt.value);
              setPending(false);
            }}
            className={`flex flex-col items-center gap-2 rounded-md border px-4 py-6 text-sm transition-colors disabled:opacity-50 ${
              active ? opt.activeClass : "border-neutral-300 text-neutral-600 hover:border-brand-black"
            }`}
          >
            <span className="text-3xl">{opt.emoji}</span>
            {opt.label}
            {active && <span className="text-xs uppercase tracking-wide opacity-80">Actif</span>}
          </button>
        );
      })}
    </div>
  );
}
