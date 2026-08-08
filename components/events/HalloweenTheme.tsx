"use client";

import { useEffect, useState } from "react";
import { useMelody } from "./useMelody";

// Slow tritone alternation — the classic "spooky" interval.
const MELODY = [220.0, 311.13, 220.0, 311.13, 196.0, 277.18, 196.0, 277.18];

export function HalloweenTheme() {
  const [bats, setBats] = useState<{ top: number; delay: number; duration: number; size: number }[] | null>(null);
  const { playing, toggle } = useMelody(MELODY, 420, "sawtooth");

  useEffect(() => {
    setBats(
      Array.from({ length: 10 }, () => ({
        top: Math.random() * 65,
        delay: Math.random() * 10,
        duration: 9 + Math.random() * 6,
        size: 20 + Math.random() * 16,
      }))
    );
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {bats?.map((b, i) => (
          <span
            key={i}
            className="absolute left-0 opacity-80"
            style={{
              top: `${b.top}%`,
              fontSize: b.size,
              animation: `event-fly ${b.duration}s linear ${b.delay}s infinite`,
            }}
          >
            🦇
          </span>
        ))}
        <div className="absolute inset-x-0 top-0 flex justify-between px-4 pt-2 text-3xl opacity-70">
          <span>🕸️</span>
          <span className="scale-x-[-1]">🕸️</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#150a1f] to-transparent" />
      </div>

      <button
        onClick={toggle}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff8a3d] text-xl text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Ambiance Halloween"
      >
        {playing ? "🔊" : "🎃"}
      </button>
    </>
  );
}
