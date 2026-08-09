"use client";

import { useEffect, useState } from "react";

const BAT_CLIP =
  "polygon(50% 42%, 43% 22%, 32% 2%, 27% 26%, 12% 12%, 16% 36%, 2% 30%, 21% 50%, 2% 70%, 16% 64%, 12% 88%, 27% 74%, 32% 98%, 43% 62%, 50% 66%, 57% 62%, 68% 98%, 73% 74%, 88% 88%, 84% 64%, 98% 70%, 79% 50%, 98% 30%, 84% 36%, 88% 12%, 73% 26%, 68% 2%, 57% 22%)";

type Ember = { left: number; delay: number; duration: number; size: number; sway: number };
type Bat = { top: number; delay: number; duration: number; size: number };
type Witch = { top: number; delay: number; duration: number; size: number };
type PumpkinSpec = { left: number; size: number; delay: number };

const PUMPKINS: PumpkinSpec[] = [
  { left: 6, size: 56, delay: 0 },
  { left: 20, size: 40, delay: 0.6 },
  { left: 34, size: 64, delay: 0.2 },
  { left: 58, size: 44, delay: 0.9 },
  { left: 74, size: 58, delay: 0.4 },
  { left: 90, size: 42, delay: 0.7 },
];

function Pumpkin({ left, size, delay }: PumpkinSpec) {
  return (
    <div
      className="absolute bottom-0"
      style={{
        left: `${left}%`,
        width: size,
        height: size * 0.82,
        animation: `mode-bob 4.5s ease-in-out ${delay}s infinite`,
      }}
    >
      <div
        className="absolute -top-2 left-1/2 h-3 w-2 -translate-x-1/2 rounded-sm"
        style={{ background: "linear-gradient(135deg, #6b8f3f, #2f4a1a)", transform: "translateX(-50%) rotate(-12deg)" }}
      />
      <div
        className="absolute inset-0 rounded-[50%]"
        style={{
          background: "radial-gradient(circle at 33% 28%, #ffb347, #ff8c1a 55%, #b34700 100%)",
          boxShadow: "inset -6px -6px 10px rgba(0,0,0,0.4), inset 4px 4px 8px rgba(255,255,255,0.25), 0 6px 12px rgba(0,0,0,0.45)",
        }}
      />
      <div
        className="absolute inset-0 rounded-[50%] opacity-25"
        style={{ background: "repeating-linear-gradient(90deg, transparent 0 9%, rgba(0,0,0,0.35) 9% 11%)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center gap-[16%]" style={{ paddingBottom: "18%" }}>
        <span
          className="block"
          style={{
            width: size * 0.16,
            height: size * 0.16,
            background: "#2a1400",
            clipPath: "polygon(0% 100%, 50% 0%, 100% 100%)",
            filter: "drop-shadow(0 0 4px #ffcf8a)",
          }}
        />
        <span
          className="block"
          style={{
            width: size * 0.16,
            height: size * 0.16,
            background: "#2a1400",
            clipPath: "polygon(0% 100%, 50% 0%, 100% 100%)",
            filter: "drop-shadow(0 0 4px #ffcf8a)",
          }}
        />
      </div>
      <div
        className="absolute left-1/2 top-[64%] -translate-x-1/2"
        style={{
          width: size * 0.52,
          height: size * 0.13,
          background: "#2a1400",
          clipPath:
            "polygon(0% 0%, 9% 100%, 18% 0%, 27% 100%, 36% 0%, 45% 100%, 54% 0%, 63% 100%, 72% 0%, 81% 100%, 90% 0%, 100% 100%)",
          filter: "drop-shadow(0 0 4px #ffcf8a)",
        }}
      />
    </div>
  );
}

function WitchSilhouette() {
  return (
    <svg viewBox="0 0 130 70" className="h-full w-full">
      <defs>
        <linearGradient id="witchRobe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a2a66" />
          <stop offset="100%" stopColor="#0d0616" />
        </linearGradient>
        <linearGradient id="witchBroom" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e0b573" />
          <stop offset="100%" stopColor="#8a6414" />
        </linearGradient>
      </defs>
      <rect x="18" y="30" width="72" height="4" rx="2" fill="#5a3a1e" />
      <polygon points="18,20 18,44 0,32" fill="url(#witchBroom)" />
      <path d="M78 16 Q100 6 116 20 Q124 32 112 44 Q94 54 78 44 Q68 32 78 16Z" fill="url(#witchRobe)" />
      <path d="M84 20 Q100 14 110 22" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
      <path d="M90 4 L104 20 L78 20Z" fill="url(#witchRobe)" />
      <ellipse cx="91" cy="20" rx="14" ry="3.4" fill="url(#witchRobe)" />
    </svg>
  );
}

export function HalloweenMode() {
  const [embers, setEmbers] = useState<Ember[] | null>(null);
  const [bats, setBats] = useState<Bat[] | null>(null);
  const [witches, setWitches] = useState<Witch[] | null>(null);

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
        top: 8 + Math.random() * 30,
        delay: Math.random() * 8,
        duration: 11 + Math.random() * 7,
        size: 26 + Math.random() * 18,
      }))
    );
    setWitches(
      Array.from({ length: 2 }, () => ({
        top: 12 + Math.random() * 28,
        delay: Math.random() * 14,
        duration: 20 + Math.random() * 8,
        size: 90 + Math.random() * 40,
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

      {/* Jack-o'-lanterns lined up just above the bottom nav, out of the products' way */}
      <div className="pointer-events-none fixed inset-x-0 z-20" style={{ bottom: "4.5rem" }}>
        {PUMPKINS.map((p, i) => (
          <Pumpkin key={i} {...p} />
        ))}
      </div>

      {/* Bat silhouettes + witches on broomsticks */}
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {witches?.map((w, i) => (
          <span
            key={`w${i}`}
            className="absolute left-0"
            style={{
              top: `${w.top}%`,
              width: w.size,
              height: w.size * 0.55,
              animation: `mode-fly ${w.duration}s linear ${w.delay}s infinite`,
            }}
          >
            <WitchSilhouette />
          </span>
        ))}

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
    </>
  );
}
