"use client";

import { useEffect, useRef, useState } from "react";

type Particle = { left: number; delay: number; duration: number; size: number; sway: number };
type Garland = { left: number; delay: number; duration: number; size: number; sway: number };

function makeParticles(count: number, sizeRange: [number, number]): Particle[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 9 + Math.random() * 8,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    sway: (Math.random() - 0.5) * 60,
  }));
}

function makeGarlands(count: number): Garland[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 20,
    duration: 16 + Math.random() * 9,
    size: 24 + Math.random() * 16,
    sway: (Math.random() - 0.5) * 70,
  }));
}

const ORNAMENTS = [
  { left: "12%", color: "#c8102e", delay: "0s" },
  { left: "30%", color: "#e8c766", delay: "0.4s" },
  { left: "50%", color: "#1f7a4d", delay: "0.8s" },
  { left: "70%", color: "#e8c766", delay: "0.3s" },
  { left: "88%", color: "#c8102e", delay: "0.6s" },
];

// A short segment of 3D-tumbling tinsel garland — beads on a metallic
// string, rendered as a small pill so it stays light enough not to
// obscure product photos underneath as it falls.
function GarlandStrand({ g }: { g: Garland }) {
  return (
    <span
      className="absolute top-0 block rounded-full"
      style={
        {
          left: `${g.left}%`,
          width: g.size,
          height: g.size * 0.3,
          background:
            "repeating-linear-gradient(90deg, #c8102e 0 18%, #f0d78a 18% 36%, #1f7a4d 36% 54%, #f0d78a 54% 72%, #c8102e 72% 90%)",
          boxShadow: "0 2px 5px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.5)",
          "--sway": `${g.sway}px`,
          animation: `mode-flip-fall ${g.duration}s linear ${g.delay}s infinite`,
        } as React.CSSProperties
      }
    />
  );
}

// Santa's sleigh, built from layered gradient shapes (not flat clipart) so
// it reads with real depth, crossing high above the content on a timer.
function SantaSleigh() {
  return (
    <div
      className="pointer-events-none fixed left-0 top-[6%] z-[45] md:top-[9%]"
      style={{ animation: "mode-sleigh-fly 34s ease-in-out infinite", filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.4))" }}
    >
      <svg viewBox="0 0 340 140" className="h-[70px] w-[190px] md:h-[92px] md:w-[250px]">
        <defs>
          <linearGradient id="deerBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a06a3e" />
            <stop offset="100%" stopColor="#4f3018" />
          </linearGradient>
          <linearGradient id="sleighRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8384f" />
            <stop offset="100%" stopColor="#8f0f24" />
          </linearGradient>
          <linearGradient id="coatRed" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ef4d61" />
            <stop offset="100%" stopColor="#9a1226" />
          </linearGradient>
          <linearGradient id="goldTrim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f5d76e" />
            <stop offset="100%" stopColor="#a9791a" />
          </linearGradient>
          <linearGradient id="skinTone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0b98d" />
            <stop offset="100%" stopColor="#d99a68" />
          </linearGradient>
        </defs>

        {/* Reindeer, leading on the right (direction of travel) */}
        <g>
          <path d="M300 78 L314 104 L308 106 L294 82Z" fill="url(#deerBody)" />
          <path d="M290 80 L280 102 L274 100 L284 78Z" fill="url(#deerBody)" opacity="0.9" />
          <path d="M256 80 L268 103 L262 105 L250 82Z" fill="url(#deerBody)" />
          <path d="M248 78 L238 99 L232 97 L242 76Z" fill="url(#deerBody)" opacity="0.9" />
          <ellipse cx="278" cy="68" rx="34" ry="17" fill="url(#deerBody)" />
          <path d="M246 62 Q236 58 240 50 Q248 54 250 64Z" fill="url(#deerBody)" />
          <ellipse cx="316" cy="48" rx="13" ry="11" fill="url(#deerBody)" />
          <ellipse cx="330" cy="53" rx="6" ry="5" fill="#5a3a24" />
          <circle cx="337" cy="53" r="3.2" fill="#ff3b30" style={{ filter: "drop-shadow(0 0 3px #ff8a70)" }} />
          <path d="M308 36 Q302 24 294 24 Q300 32 306 40Z M312 34 Q316 20 326 18 Q322 28 316 38Z" fill="#7a5a3a" />
          <ellipse cx="309" cy="37" rx="3.5" ry="6" fill="url(#deerBody)" transform="rotate(-20 309 37)" />
        </g>

        {/* Harness line back to the sleigh */}
        <path d="M255 70 Q232 76 210 80" stroke="url(#goldTrim)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Sleigh runners */}
        <path
          d="M55 100 L185 100 Q205 100 205 82 Q205 68 190 68"
          fill="none"
          stroke="url(#goldTrim)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M55 106 L178 106 Q196 106 196 90"
          fill="none"
          stroke="#8a6414"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Sleigh basket */}
        <path d="M48 95 L48 58 Q48 44 68 42 L162 42 Q180 42 182 56 L182 95Z" fill="url(#sleighRed)" />
        <path d="M48 58 Q48 44 68 42 L162 42 Q180 42 182 56" fill="none" stroke="url(#goldTrim)" strokeWidth="3" />
        <rect x="48" y="86" width="134" height="6" fill="url(#goldTrim)" opacity="0.85" />

        {/* Gift sack peeking over the rim */}
        <rect x="62" y="26" width="16" height="18" rx="2" fill="#2b6cb0" transform="rotate(-8 70 35)" />
        <rect x="82" y="20" width="18" height="22" rx="2" fill="#1f7a4d" transform="rotate(6 91 31)" />
        <circle cx="91" cy="24" r="3" fill="#f5d76e" />
        <rect x="104" y="24" width="15" height="18" rx="2" fill="#c9a227" transform="rotate(-4 111 33)" />

        {/* Santa, seated */}
        <rect x="102" y="82" width="12" height="12" rx="2" fill="#1a1a1a" />
        <rect x="132" y="82" width="12" height="12" rx="2" fill="#1a1a1a" />
        <path d="M96 88 Q98 50 128 42 Q152 42 156 62 Q158 78 148 90 Q120 96 96 88Z" fill="url(#coatRed)" />
        <rect x="98" y="64" width="56" height="6" fill="#1a1a1a" />
        <rect x="122" y="63" width="8" height="8" fill="url(#goldTrim)" />
        <path
          d="M150 48 Q166 40 176 24"
          fill="none"
          stroke="url(#coatRed)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <circle cx="178" cy="21" r="6.5" fill="#fff" />
        <ellipse cx="128" cy="40" rx="15" ry="7" fill="#fff" />
        <circle cx="127" cy="29" r="11.5" fill="url(#skinTone)" />
        <ellipse cx="127" cy="35" rx="12.5" ry="8.5" fill="#fff" />
        <path
          d="M117 21 Q104 6 92 12 Q100 22 118 19Z"
          fill="url(#coatRed)"
        />
        <ellipse cx="119" cy="20" rx="10" ry="4" fill="#fff" />
        <circle cx="92" cy="12" r="5" fill="#fff" />
      </svg>
    </div>
  );
}

export function ChristmasMode() {
  const [far, setFar] = useState<Particle[] | null>(null);
  const [near, setNear] = useState<Particle[] | null>(null);
  const [garlands, setGarlands] = useState<Garland[] | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setFar(makeParticles(26, [4, 8]));
    setNear(makeParticles(16, [9, 16]));
    setGarlands(makeGarlands(9));
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
        className="pointer-events-none fixed inset-0 z-[41]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(20,60,42,0.16) 0%, rgba(0,0,0,0) 55%), radial-gradient(ellipse at center, transparent 45%, rgba(6,20,14,0.32) 100%)",
        }}
      />

      {/* Hanging garland with 3D-shaded baubles */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[45] h-16 overflow-hidden">
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

      {/* Santa's sleigh, crossing high above the page every so often */}
      <SantaSleigh />

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
        {/* Falling 3D garland — sparse, so it never piles up over the products */}
        {garlands?.map((g, i) => (
          <GarlandStrand key={`gl${i}`} g={g} />
        ))}
      </div>

      <audio ref={audioRef} src="/audio/we-wish-you-a-merry-christmas.wav" loop preload="auto" />
    </>
  );
}
