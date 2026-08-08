"use client";

import { useEffect, useState } from "react";
import { useMelody } from "./useMelody";

const GARLAND_COLORS = ["#c8102e", "#e8c766", "#1f7a4d"];
const BULB_COUNT = 28;

// Opening motif of "Jingle Bells" (public domain) — recognizable, loops cleanly.
const MELODY = [
  659.25, 659.25, 659.25, null,
  659.25, 659.25, 659.25, null,
  659.25, 783.99, 523.25, 587.33, 659.25, null, null, null,
];

export function ChristmasTheme() {
  const [flakes, setFlakes] = useState<{ left: number; delay: number; duration: number; size: number }[] | null>(
    null
  );
  const { playing, toggle } = useMelody(MELODY, 260, "triangle");

  useEffect(() => {
    setFlakes(
      Array.from({ length: 45 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 7 + Math.random() * 7,
        size: 10 + Math.random() * 14,
      }))
    );
  }, []);

  return (
    <>
      <div className="pointer-events-none relative z-10 flex w-full justify-center gap-2 overflow-hidden py-3">
        {Array.from({ length: BULB_COUNT }).map((_, i) => (
          <span
            key={i}
            className="inline-block h-3 w-3 shrink-0 rounded-full shadow-[0_0_8px_currentColor]"
            style={{
              backgroundColor: GARLAND_COLORS[i % GARLAND_COLORS.length],
              color: GARLAND_COLORS[i % GARLAND_COLORS.length],
              animation: `event-twinkle 1.6s ease-in-out ${(i % 6) * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {flakes?.map((f, i) => (
          <span
            key={i}
            className="absolute top-0 text-white/90"
            style={{
              left: `${f.left}%`,
              fontSize: f.size,
              animation: `event-fall ${f.duration}s linear ${f.delay}s infinite`,
            }}
          >
            ❄
          </span>
        ))}
      </div>

      <button
        onClick={toggle}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#c8102e] text-xl text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Musique de Noël"
      >
        {playing ? "🔊" : "🎵"}
      </button>
    </>
  );
}
