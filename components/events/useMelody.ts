"use client";

import { useEffect, useRef, useState } from "react";

type Note = number | null;

export function useMelody(notes: Note[], noteMs: number, waveform: OscillatorType = "sine") {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      ctxRef.current?.close();
    };
  }, []);

  function playNote(ctx: AudioContext, freq: Note) {
    if (!freq) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveform;
    osc.frequency.value = freq;
    const t = ctx.currentTime;
    const dur = noteMs / 1000;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
    gain.gain.linearRampToValueAtTime(0, t + dur * 0.9);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  function toggle() {
    if (playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setPlaying(false);
      return;
    }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();
    indexRef.current = 0;
    playNote(ctx, notes[0]);
    intervalRef.current = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % notes.length;
      playNote(ctx, notes[indexRef.current]);
    }, noteMs);
    setPlaying(true);
  }

  return { playing, toggle };
}
