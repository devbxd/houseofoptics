"use client";

import { useEffect, useRef, useState } from "react";
import { Christmas3D } from "./Christmas3D";

type Light = { left: number; top: number; delay: number; size: number };

const GOLD = "#e8c766";
const GOLD_DEEP = "#c9a227";

function makeLights(count: number): Light[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 34,
    delay: Math.random() * 4,
    size: 2.5 + Math.random() * 2.5,
  }));
}

export function ChristmasMode({ t }: { t: Record<string, string> }) {
  const year = new Date().getFullYear() + 1;
  const [lights, setLights] = useState<Light[] | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
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
