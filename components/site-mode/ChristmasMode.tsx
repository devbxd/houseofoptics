"use client";

import { useEffect, useRef, useState } from "react";

type Particle = { left: number; delay: number; duration: number; size: number; sway: number };

function makeParticles(count: number, sizeRange: [number, number]): Particle[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 9 + Math.random() * 8,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    sway: (Math.random() - 0.5) * 60,
  }));
}

const ORNAMENTS = [
  { left: "12%", color: "#c8102e", delay: "0s" },
  { left: "30%", color: "#e8c766", delay: "0.4s" },
  { left: "50%", color: "#1f7a4d", delay: "0.8s" },
  { left: "70%", color: "#e8c766", delay: "0.3s" },
  { left: "88%", color: "#c8102e", delay: "0.6s" },
];

export function ChristmasMode() {
  const [far, setFar] = useState<Particle[] | null>(null);
  const [near, setNear] = useState<Particle[] | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setFar(makeParticles(26, [4, 8]));
    setNear(makeParticles(16, [9, 16]));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Browsers block audio with sound until the visitor has interacted with
    // the page at least once — there's no way around that from JS. Try to
    // play immediately, and if it's blocked, start on the first tap/click/key
    // anywhere on the page instead (so no dedicated "play music" button is
    // needed — any normal interaction with the site starts it).
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
      {/* Ambient wash */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(20,60,42,0.16) 0%, rgba(0,0,0,0) 55%), radial-gradient(ellipse at center, transparent 45%, rgba(6,20,14,0.32) 100%)",
        }}
      />

      {/* Hanging garland with 3D-shaded baubles */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-16 overflow-hidden">
        <div
          className="absolute inset-x-[4%] top-2 h-px opacity-40"
          style={{ background: "linear-gradient(90deg, transparent, #e8c766, transparent)" }}
        />
        {ORNAMENTS.map((o, i) => (
          <div
            key={i}
            className="absolute top-2 origin-top"
            style={{ left: o.left, animation: `mode-swing 3.4s ease-in-out ${o.delay} infinite` }}
          >
            <div className="mx-auto h-2 w-px bg-[#e8c766]/50" />
            <div
              className="h-4 w-4 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
              style={{
                background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.85), ${o.color} 42%, rgba(0,0,0,0.35) 100%)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Parallax snow — far (small, blurred, slow) then near (bigger, sharp, faster) */}
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
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
      </div>

      <audio ref={audioRef} src="/audio/jingle-bells.wav" loop preload="auto" />
    </>
  );
}
