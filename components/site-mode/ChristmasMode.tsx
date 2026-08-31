"use client";

import { useEffect, useRef, useState } from "react";
import { Christmas3D } from "./Christmas3D";

type Light = { left: number; top: number; delay: number; size: number };
type Bokeh = { left: number; top: number; size: number; color: string; opacity: number; delay: number; duration: number; dx: number; dy: number };

const GOLD = "#e8c766";
const GOLD_DEEP = "#c9a227";
const RED = "#c8102e";

const BOKEH_SPOTS: Omit<Bokeh, "delay" | "duration" | "dx" | "dy">[] = [
  { left: 6, top: 8, size: 220, color: GOLD, opacity: 0.28 },
  { left: 18, top: 26, size: 140, color: RED, opacity: 0.16 },
  { left: 92, top: 10, size: 200, color: GOLD, opacity: 0.24 },
  { left: 80, top: 30, size: 130, color: RED, opacity: 0.14 },
  { left: 50, top: 4, size: 170, color: "#fff6d8", opacity: 0.18 },
  { left: 4, top: 55, size: 160, color: GOLD_DEEP, opacity: 0.15 },
  { left: 96, top: 60, size: 150, color: GOLD_DEEP, opacity: 0.14 },
];

function makeLights(count: number): Light[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 34,
    delay: Math.random() * 4,
    size: 2.5 + Math.random() * 2.5,
  }));
}

function makeBokeh(): Bokeh[] {
  return BOKEH_SPOTS.map((b) => ({
    ...b,
    delay: Math.random() * 5,
    duration: 7 + Math.random() * 5,
    dx: (Math.random() - 0.5) * 30,
    dy: (Math.random() - 0.5) * 24,
  }));
}

export function ChristmasMode({ t }: { t: Record<string, string> }) {
  const year = new Date().getFullYear() + 1;
  const [lights, setLights] = useState<Light[] | null>(null);
  const [bokeh, setBokeh] = useState<Bokeh[] | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setLights(makeLights(55));
    setBokeh(makeBokeh());
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
      {/* Warm ambient wash — a deep vignette the bokeh glows sit on top of */}
      <div
        className="pointer-events-none fixed inset-0 z-[40]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(6,26,16,0.32) 100%)",
        }}
      />

      {/* Soft blurred bokeh-light glows, like out-of-focus warm string
          lights behind a photographed ornament — this is what actually
          reads as "premium ambiance" instead of flat colored shapes; every
          circle here is heavily blurred and low-opacity, so it's light, not
          an object. */}
      <div className="pointer-events-none fixed inset-0 z-[41] overflow-hidden">
        {bokeh?.map((b, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={
              {
                left: `${b.left}%`,
                top: `${b.top}%`,
                width: b.size,
                height: b.size,
                background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
                filter: "blur(38px)",
                "--bokeh-opacity": b.opacity,
                "--bokeh-dx": `${b.dx}px`,
                "--bokeh-dy": `${b.dy}px`,
                animation: `mode-bokeh-breathe ${b.duration}s ease-in-out ${b.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

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

      {/* Real 3D decorations — glossy ornament clusters, a lit pine tree and
          falling snow, all actual lit WebGL geometry (see Christmas3D.tsx),
          not flat CSS shapes. Sits in the page corners/edges only. */}
      <Christmas3D />

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

      <audio ref={audioRef} src="/audio/we-wish-you-a-merry-christmas.wav" loop preload="auto" />
    </>
  );
}
