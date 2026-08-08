"use client";

import { useEffect, useState } from "react";
import { useMelody } from "./useMelody";

// Slow tritone alternation — the classic "spooky" interval.
const MELODY = [220.0, 311.13, 220.0, 311.13, 196.0, 277.18, 196.0, 277.18];

const BAT_CLIP =
  "polygon(50% 42%, 43% 22%, 32% 2%, 27% 26%, 12% 12%, 16% 36%, 2% 30%, 21% 50%, 2% 70%, 16% 64%, 12% 88%, 27% 74%, 32% 98%, 43% 62%, 50% 66%, 57% 62%, 68% 98%, 73% 74%, 88% 88%, 84% 64%, 98% 70%, 79% 50%, 98% 30%, 84% 36%, 88% 12%, 73% 26%, 68% 2%, 57% 22%)";

type Ember = { left: number; delay: number; duration: number; size: number; sway: number };
type Bat = { top: number; delay: number; duration: number; size: number };

export function HalloweenMode() {
  const [embers, setEmbers] = useState<Ember[] | null>(null);
  const [bats, setBats] = useState<Bat[] | null>(null);
  const { playing, toggle } = useMelody(MELODY, 420, "sawtooth");

  useEffect(() => {
    setEmbers(
      Array.from({ length: 22 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 8 + Math.random() * 7,
        size: 3 + Math.random() * 4,
        sway: (Math.random() - 0.5) * 50,
      }))
    );
    setBats(
      Array.from({ length: 4 }, () => ({
        top: 8 + Math.random() * 45,
        delay: Math.random() * 8,
        duration: 11 + Math.random() * 7,
        size: 26 + Math.random() * 18,
      }))
    );
  }, []);

  return (
    <>
      {/* Flickering candlelight vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(255,138,61,0.10) 0%, rgba(0,0,0,0) 45%), radial-gradient(ellipse at center, transparent 40%, rgba(10,4,16,0.5) 100%)",
          animation: "mode-flicker 5s ease-in-out infinite",
        }}
      />

      {/* Layered fog banks drifting at the bottom */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-64 overflow-hidden">
        <div
          className="absolute -inset-x-1/4 bottom-0 h-40 opacity-60 blur-2xl"
          style={{
            background: "radial-gradient(ellipse at 30% 100%, rgba(120,80,160,0.5), transparent 65%)",
            animation: "mode-fog-drift 16s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -inset-x-1/4 bottom-0 h-52 opacity-50 blur-3xl"
          style={{
            background: "radial-gradient(ellipse at 70% 100%, rgba(255,138,61,0.25), transparent 60%)",
            animation: "mode-fog-drift 22s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Bat silhouettes */}
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {bats?.map((b, i) => (
          <span
            key={i}
            className="absolute left-0"
            style={{
              top: `${b.top}%`,
              width: b.size,
              height: b.size * 0.6,
              animation: `mode-fly ${b.duration}s linear ${b.delay}s infinite`,
            }}
          >
            <span
              className="block h-full w-full bg-[#0d0611] opacity-85"
              style={{ clipPath: BAT_CLIP, animation: `mode-wing 0.5s ease-in-out ${b.delay}s infinite` }}
            />
          </span>
        ))}

        {/* Embers rising with a gentle flicker */}
        {embers?.map((e, i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full"
            style={
              {
                left: `${e.left}%`,
                width: e.size,
                height: e.size,
                background: "radial-gradient(circle, #ffb072, #ff6a1f 60%, transparent 75%)",
                boxShadow: "0 0 8px rgba(255,120,40,0.8)",
                "--sway": `${e.sway}px`,
                "--particle-opacity": 0.85,
                animation: `mode-rise ${e.duration}s ease-in ${e.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <button
        onClick={toggle}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-xl text-white shadow-[0_6px_20px_rgba(0,0,0,0.4)] transition-transform hover:scale-105"
        style={{ background: "radial-gradient(circle at 35% 30%, #ff9d54, #c2540f)" }}
        aria-label="Ambiance Halloween"
      >
        {playing ? "🔊" : "🎃"}
      </button>
    </>
  );
}
