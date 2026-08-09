"use client";

import { useEffect, useRef, useState } from "react";
import { useMelody } from "./useMelody";

const MELODY = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, null];
const SPARK_COLORS = ["#f5d76e", "#ffffff", "#9dd7ff", "#ff9ecb"];
const CONFETTI_COLORS = ["#f5d76e", "#e6c65c", "#ffffff", "#c9a227"];
const SPARKLE_SPOTS = [
  { left: "6%", top: "12%" },
  { left: "92%", top: "18%" },
  { left: "14%", top: "78%" },
  { left: "86%", top: "72%" },
  { left: "50%", top: "4%" },
  { left: "50%", top: "92%" },
];

type Star = { left: number; top: number; delay: number; size: number };
type Confetti = { left: number; delay: number; duration: number; color: string; sway: number };
type Burst = { id: number; left: number; top: number; sparks: { dx: number; dy: number; color: string }[] };

export function NewYearMode() {
  // Computed, not hardcoded — the banner stays correct every year the site is live.
  const year = new Date().getFullYear() + 1;
  const [stars, setStars] = useState<Star[] | null>(null);
  const [confetti, setConfetti] = useState<Confetti[] | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstId = useRef(0);
  const { playing, toggle } = useMelody(MELODY, 220, "square");

  useEffect(() => {
    setStars(
      Array.from({ length: 40 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 60,
        delay: Math.random() * 4,
        size: 1 + Math.random() * 2,
      }))
    );
    setConfetti(
      Array.from({ length: 40 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        sway: (Math.random() - 0.5) * 80,
      }))
    );

    function spawnBurst() {
      const id = burstId.current++;
      const sparks = Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 40 + Math.random() * 40;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        };
      });
      const burst: Burst = { id, left: 15 + Math.random() * 70, top: 10 + Math.random() * 35, sparks };
      setBursts((prev) => [...prev, burst]);
      setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 1100);
    }

    spawnBurst();
    const interval = setInterval(spawnBurst, 1900);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Night sky wash + stars */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(80,90,160,0.18) 0%, rgba(0,0,0,0) 55%), radial-gradient(ellipse at center, transparent 40%, rgba(4,4,16,0.4) 100%)",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        {stars?.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animation: `mode-twinkle 2.4s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Fireworks */}
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {bursts.map((b) => (
          <div key={b.id} className="absolute" style={{ left: `${b.left}%`, top: `${b.top}%` }}>
            {b.sparks.map((s, i) => (
              <span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={
                  {
                    backgroundColor: s.color,
                    boxShadow: `0 0 6px ${s.color}`,
                    "--dx": `${s.dx}px`,
                    "--dy": `${s.dy}px`,
                    animation: "mode-spark 1.1s ease-out forwards",
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ))}

        {/* Metallic confetti with a 3D flip */}
        {confetti?.map((c, i) => (
          <span
            key={i}
            className="absolute top-0 block h-3 w-1.5 rounded-[1px]"
            style={
              {
                left: `${c.left}%`,
                background: `linear-gradient(135deg, ${c.color}, rgba(255,255,255,0.9))`,
                "--sway": `${c.sway}px`,
                animation: `mode-flip-fall ${c.duration}s linear ${c.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Glassmorphic banner — big, glowing, genuinely sparkling */}
      <div className="relative z-20 flex justify-center px-4 pt-8 md:pt-12">
        <div className="relative rounded-2xl border border-white/20 bg-white/10 px-8 py-6 backdrop-blur-md sm:rounded-full sm:px-14 sm:py-7">
          {SPARKLE_SPOTS.map((s, i) => (
            <span
              key={i}
              className="absolute text-base sm:text-2xl"
              style={{
                left: s.left,
                top: s.top,
                color: SPARK_COLORS[i % SPARK_COLORS.length],
                textShadow: "0 0 8px currentColor",
                animation: `mode-twinkle ${1.6 + (i % 3) * 0.4}s ease-in-out ${i * 0.3}s infinite`,
              }}
            >
              ✦
            </span>
          ))}
          <p
            className="relative bg-clip-text text-center font-serif text-4xl font-medium leading-tight tracking-wide text-transparent sm:text-6xl md:text-7xl"
            style={{
              backgroundImage: "linear-gradient(90deg, #f5d76e, #fff6d8, #c9a227, #fff6d8, #f5d76e)",
              backgroundSize: "200% auto",
              animation: "mode-shimmer 3s linear infinite, mode-glow-pulse 2.2s ease-in-out infinite",
            }}
          >
            Bonne Année {year}
          </p>
        </div>
      </div>

      <button
        onClick={toggle}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-xl text-white shadow-[0_6px_20px_rgba(0,0,0,0.4)] transition-transform hover:scale-105"
        style={{ background: "radial-gradient(circle at 35% 30%, #3a3a6e, #12122c)" }}
        aria-label="Musique du Nouvel An"
      >
        {playing ? "🔊" : "🎆"}
      </button>
    </>
  );
}
