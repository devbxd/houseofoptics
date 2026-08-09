"use client";

import { useEffect, useRef, useState } from "react";

type Particle = { left: number; delay: number; duration: number; size: number; sway: number };
type Ornament = { left: number; delay: number; duration: number; size: number; sway: number; color: string };
type Light = { left: number; top: number; delay: number; size: number };

const GOLD = "#e8c766";
const GOLD_DEEP = "#c9a227";
const RED = "#c8102e";
const RED_DEEP = "#8f0f24";
const GREEN = "#155c3a";
const PEARL = "#fdf6e8";

const BAUBLE_COLORS = [RED, GOLD, GREEN, PEARL, GOLD_DEEP, RED_DEEP];

function makeParticles(count: number, sizeRange: [number, number]): Particle[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 9 + Math.random() * 8,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    sway: (Math.random() - 0.5) * 60,
  }));
}

function makeOrnaments(count: number): Ornament[] {
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 20,
    duration: 15 + Math.random() * 9,
    size: 16 + Math.random() * 14,
    sway: (Math.random() - 0.5) * 70,
    color: BAUBLE_COLORS[i % BAUBLE_COLORS.length],
  }));
}

function makeLights(count: number): Light[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 34,
    delay: Math.random() * 4,
    size: 2.5 + Math.random() * 2.5,
  }));
}

// A row of alternating 3D-shaded baubles, gold icicle drips and small
// sparkle accents — a full, dense swag instead of a thin sparse line.
const GARLAND_ITEMS = [
  { left: "4%", color: RED, size: 20, icicle: false },
  { left: "13%", color: GOLD, size: 15, icicle: true },
  { left: "22%", color: GREEN, size: 22, icicle: false },
  { left: "31%", color: PEARL, size: 17, icicle: true },
  { left: "40%", color: GOLD_DEEP, size: 20, icicle: false },
  { left: "50%", color: RED_DEEP, size: 24, icicle: true },
  { left: "60%", color: GOLD, size: 20, icicle: false },
  { left: "69%", color: PEARL, size: 17, icicle: true },
  { left: "78%", color: GREEN, size: 22, icicle: false },
  { left: "87%", color: GOLD, size: 15, icicle: true },
  { left: "96%", color: RED, size: 20, icicle: false },
];

const SPARKLE_SPOTS = ["9%", "27%", "45%", "64%", "82%"];

function Bauble({ color, size }: { color: string; size: number }) {
  return (
    <div
      className="rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95), ${color} 45%, rgba(0,0,0,0.4) 100%)`,
        boxShadow: `0 3px 8px rgba(0,0,0,0.4), inset 0 0 ${size / 4}px rgba(255,255,255,0.25)`,
      }}
    />
  );
}

function Icicle({ size }: { size: number }) {
  return (
    <div
      className="mx-auto"
      style={{
        width: size * 0.4,
        height: size * 1.5,
        clipPath: "polygon(20% 0%, 80% 0%, 55% 100%, 45% 100%)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(220,235,245,0.5))",
        boxShadow: "0 0 4px rgba(255,255,255,0.6)",
      }}
    />
  );
}

function FallingOrnament({ o }: { o: Ornament }) {
  return (
    <span
      className="absolute top-0 block rounded-full"
      style={
        {
          left: `${o.left}%`,
          width: o.size,
          height: o.size,
          background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95), ${o.color} 45%, rgba(0,0,0,0.35) 100%)`,
          boxShadow: "0 3px 8px rgba(0,0,0,0.35)",
          "--sway": `${o.sway}px`,
          animation: `mode-flip-fall ${o.duration}s linear ${o.delay}s infinite`,
        } as React.CSSProperties
      }
    />
  );
}

export function ChristmasMode({ t }: { t: Record<string, string> }) {
  const year = new Date().getFullYear() + 1;
  const [far, setFar] = useState<Particle[] | null>(null);
  const [near, setNear] = useState<Particle[] | null>(null);
  const [ornaments, setOrnaments] = useState<Ornament[] | null>(null);
  const [lights, setLights] = useState<Light[] | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setFar(makeParticles(26, [4, 8]));
    setNear(makeParticles(16, [9, 16]));
    setOrnaments(makeOrnaments(10));
    setLights(makeLights(55));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Background music, not a foreground track — kept modest so it never
    // fights with the visitor for attention.
    audio.volume = 0.32;

    const start = () => {
      audio.play().catch(() => {});
      document.removeEventListener("click", start);
      document.removeEventListener("touchstart", start);
      document.removeEventListener("keydown", start);
    };

    audio.play().catch(() => {
      document.addEventListener("click", start);
      document.addEventListener("touchstart", start);
      document.addEventListener("keydown", start);
    });

    return () => {
      document.removeEventListener("click", start);
      document.removeEventListener("touchstart", start);
      document.removeEventListener("keydown", start);
    };
  }, []);

  return (
    <>
      {/* Warm ambient wash — gold glow up top fading into a deep pine vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-[41]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(232,199,102,0.22) 0%, rgba(0,0,0,0) 45%), radial-gradient(ellipse at center, transparent 40%, rgba(6,26,16,0.38) 100%)",
        }}
      />

      {/* Twinkling fairy lights, like a lit tree, scattered across the top of the page */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[41] h-[38vh] overflow-hidden">
        {lights?.map((l, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${l.left}%`,
              top: `${l.top}%`,
              width: l.size,
              height: l.size,
              background: "radial-gradient(circle, #fff6d8, #f5c84c 55%, transparent 75%)",
              boxShadow: "0 0 7px 2px rgba(245,200,76,0.55)",
              animation: `mode-twinkle ${2 + (i % 4) * 0.4}s ease-in-out ${l.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Dense hanging garland: baubles, icicles and gold sparkle */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[45] h-24 overflow-hidden">
        <div
          className="absolute inset-x-[2%] top-2 h-[3px] rounded-full opacity-70"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_DEEP}, ${GOLD}, transparent)` }}
        />
        {SPARKLE_SPOTS.map((left, i) => (
          <span
            key={left}
            className="absolute top-0 text-sm"
            style={{
              left,
              color: i % 2 === 0 ? GOLD : PEARL,
              textShadow: `0 0 6px ${GOLD}`,
              animation: `mode-twinkle ${1.8 + (i % 3) * 0.3}s ease-in-out ${i * 0.25}s infinite`,
            }}
          >
            ✦
          </span>
        ))}
        {GARLAND_ITEMS.map((o, i) => (
          <div
            key={i}
            className="absolute top-2 flex origin-top flex-col items-center"
            style={{ left: o.left, animation: `mode-swing 3.6s ease-in-out ${(i % 5) * 0.3}s infinite` }}
          >
            <div className="h-2 w-px" style={{ background: `${GOLD}88` }} />
            <Bauble color={o.color} size={o.size} />
            {o.icicle && <Icicle size={o.size} />}
          </div>
        ))}
      </div>

      {/* Combined greeting — floats directly on the header image, no card/frame */}
      <div className="pointer-events-none fixed inset-x-0 top-24 z-[45] flex justify-center px-6 md:top-28">
        <p
          className="max-w-2xl bg-clip-text text-center font-serif text-lg font-medium leading-snug tracking-wide text-transparent sm:text-3xl"
          style={{
            backgroundImage: `linear-gradient(90deg, ${GOLD}, #fff6d8, ${GOLD_DEEP}, #fff6d8, ${GOLD})`,
            backgroundSize: "200% auto",
            textShadow: "0 2px 10px rgba(0,0,0,0.65), 0 1px 4px rgba(0,0,0,0.85)",
            animation: "mode-shimmer 4s linear infinite, mode-glow-pulse 2.6s ease-in-out infinite",
          }}
        >
          {t["christmasNewYear.title"].replace("{year}", String(year))}
        </p>
      </div>

      {/* Parallax snow — far (small, blurred, slow) then near (bigger, sharp, faster) */}
      <div className="pointer-events-none fixed inset-0 z-[42] overflow-hidden">
        {far?.map((p, i) => (
          <span
            key={`f${i}`}
            className="absolute top-0 rounded-full"
            style={
              {
                left: `${p.left}%`,
                width: p.size,
                height: p.size,
                filter: "blur(1.5px)",
                background: "radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
                "--sway": `${p.sway}px`,
                "--particle-opacity": 0.45,
                animation: `mode-drift-far ${p.duration}s linear ${p.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
        {near?.map((p, i) => (
          <span
            key={`n${i}`}
            className="absolute top-0 rounded-full"
            style={
              {
                left: `${p.left}%`,
                width: p.size,
                height: p.size,
                background: "radial-gradient(circle at 35% 30%, #ffffff, rgba(255,255,255,0.55) 60%, rgba(255,255,255,0) 75%)",
                boxShadow: "0 0 10px rgba(255,255,255,0.5)",
                "--sway": `${p.sway}px`,
                "--particle-opacity": 0.9,
                animation: `mode-drift-near ${p.duration}s linear ${p.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
        {/* Falling ornaments — sparse, so they never pile up over the products */}
        {ornaments?.map((o, i) => (
          <FallingOrnament key={`o${i}`} o={o} />
        ))}
      </div>

      <audio ref={audioRef} src="/audio/we-wish-you-a-merry-christmas.wav" loop preload="auto" />
    </>
  );
}
