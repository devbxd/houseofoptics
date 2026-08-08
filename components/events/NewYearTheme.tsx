"use client";

import { useEffect, useState } from "react";
import { useMelody } from "./useMelody";

const MELODY = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, null];
const CONFETTI_COLORS = ["#f5d76e", "#ff5e7e", "#5ec8ff", "#9dff8f", "#ffffff"];

export function NewYearTheme() {
  // Computed, not hardcoded — the banner stays correct every year the site is live.
  const year = new Date().getFullYear() + 1;
  const [confetti, setConfetti] = useState<
    { left: number; delay: number; duration: number; color: string; rotate: number }[] | null
  >(null);
  const { playing, toggle } = useMelody(MELODY, 220, "square");

  useEffect(() => {
    setConfetti(
      Array.from({ length: 60 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 5 + Math.random() * 5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotate: Math.random() * 360,
      }))
    );
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {confetti?.map((c, i) => (
          <span
            key={i}
            className="absolute top-0 block h-2.5 w-1.5"
            style={{
              left: `${c.left}%`,
              backgroundColor: c.color,
              transform: `rotate(${c.rotate}deg)`,
              animation: `event-fall ${c.duration}s linear ${c.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-20 pt-10 text-center">
        <p
          className="font-serif text-3xl tracking-wide text-[#f5d76e] md:text-5xl"
          style={{ animation: "event-pulse-glow 2.2s ease-in-out infinite" }}
        >
          Happy New Year {year}
        </p>
      </div>

      <button
        onClick={toggle}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#141432] text-xl text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Musique du Nouvel An"
      >
        {playing ? "🔊" : "🎆"}
      </button>
    </>
  );
}
