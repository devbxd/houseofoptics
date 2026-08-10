"use client";

import { useEffect, useState } from "react";
import { spinWheel } from "@/app/(site)/spin-wheel-actions";

const RED = "#7a1224";
const GOLD = "#d9a86c";

const SEGMENTS = [
  { percent: 0, label: "No luck" },
  { percent: 10, label: "10% off" },
  { percent: 15, label: "15% off" },
  { percent: 0, label: "No luck" },
  { percent: 10, label: "10% off" },
  { percent: 15, label: "15% off" },
];
const SEGMENT_ANGLE = 360 / SEGMENTS.length;

const WHEEL_BACKGROUND = `conic-gradient(${SEGMENTS.map((_, i) => {
  const color = i % 2 === 0 ? RED : GOLD;
  const from = i * SEGMENT_ANGLE;
  const to = from + SEGMENT_ANGLE;
  return `${color} ${from}deg ${to}deg`;
}).join(", ")})`;

const DISMISS_KEY = "house-of-optics-spin-wheel-dismissed";

export function SpinWheelPopup({ brandName }: { brandName: string }) {
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ discountPercent: number; code: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const already = !!localStorage.getItem(DISMISS_KEY);
    setDismissed(already);
    if (already) return;
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  function close() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function handleSpin(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "idle" || !email.trim().includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setError(null);
    setPhase("spinning");

    try {
      const res = await spinWheel(email);
      const matchingIndexes = SEGMENTS.map((s, i) => (s.percent === res.discountPercent ? i : -1)).filter((i) => i >= 0);
      const targetIndex = matchingIndexes[Math.floor(Math.random() * matchingIndexes.length)];
      const segmentCenter = targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.5);
      const spins = 6;
      const target = spins * 360 - (segmentCenter + jitter);

      setRotation(target);
      setResult(res);
      setTimeout(() => setPhase("result"), 4600);
    } catch {
      setError("Something went wrong, please try again.");
      setPhase("idle");
    }
  }

  if (dismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-[75] flex items-center justify-center bg-black/60 px-4 transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={phase === "idle" ? close : undefined}
    >
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl transition-transform duration-500 sm:p-8 ${
          visible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-neutral-400 hover:text-brand-black"
        >
          ×
        </button>

        {/* Pointer */}
        <div className="relative mx-auto mb-4 h-[220px] w-[220px] sm:h-[250px] sm:w-[250px]">
          <div
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
            style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "14px solid #1a1a1a" }}
          />

          <div
            className="h-full w-full rounded-full border-4 border-white shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-transform ease-out"
            style={{
              background: WHEEL_BACKGROUND,
              transform: `rotate(${rotation}deg)`,
              transitionDuration: phase === "spinning" ? "4500ms" : "0ms",
            }}
          >
            {SEGMENTS.map((s, i) => {
              const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
              return (
                <div key={i} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: `rotate(${angle}deg)` }}>
                  <span
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide sm:text-xs"
                    style={{ top: -100, color: i % 2 === 0 ? "#fdf1e2" : "#4a1414" }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-center text-[9px] font-bold uppercase leading-tight text-brand-black shadow-md">
            {brandName}
          </div>
        </div>

        {phase !== "result" ? (
          <>
            <h2 className="font-serif text-xl text-brand-black">Lucky Spin Awaits</h2>
            <p className="mt-1 text-sm text-neutral-600">Spin the wheel and unlock exclusive rewards instantly.</p>
            <form onSubmit={handleSpin} className="mt-4 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={phase === "spinning"}
                placeholder="Enter your email"
                className="w-full border border-neutral-300 px-4 py-2.5 text-sm focus:border-brand-black focus:outline-none disabled:opacity-60"
              />
              {error && <p className="text-xs text-brand-red">{error}</p>}
              <button
                type="submit"
                disabled={phase === "spinning"}
                className="w-full bg-brand-black py-3 text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {phase === "spinning" ? "Spinning..." : "Spin Now"}
              </button>
            </form>
            <p className="mt-3 text-xs text-neutral-400">
              By entering, you agree to receive updates and offers from our store.
            </p>
          </>
        ) : (
          <>
            {result && result.discountPercent > 0 ? (
              <>
                <h2 className="font-serif text-2xl text-brand-red">You won {result.discountPercent}% off!</h2>
                <p className="mt-2 text-sm text-neutral-600">Use this code at checkout:</p>
                <p className="mt-2 rounded border border-dashed border-brand-black px-4 py-2 font-mono text-lg tracking-wider">
                  {result.code}
                </p>
                <p className="mt-1 text-xs text-neutral-400">Valid for 1 hour, single use only.</p>
              </>
            ) : (
              <>
                <h2 className="font-serif text-xl text-brand-black">So close!</h2>
                <p className="mt-2 text-sm text-neutral-600">No luck this time — check back again soon.</p>
              </>
            )}
            <button
              type="button"
              onClick={close}
              className="mt-6 w-full border border-brand-black py-3 text-sm uppercase tracking-widest text-brand-black transition-colors hover:bg-brand-black hover:text-white"
            >
              Continue shopping
            </button>
          </>
        )}
      </div>
    </div>
  );
}
