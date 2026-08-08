// Synthesizes a looping instrumental rendering of "Jingle Bells" (the tune
// is public domain, composed in 1857) as a WAV file. No samples, no external
// audio — three synthesized layers (bell-like melody, soft bass, sleigh-bell
// percussion) mixed and written as 16-bit PCM. Re-run with `node
// scripts/audio/generate-jingle-bells.js` if the tune ever needs to change.

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;

const NOTE_FREQ = {
  C3: 130.81,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
};

// Classic simplified "Jingle Bells" chorus, quarter note = 0.4s (~150bpm feel).
const MELODY = [
  ["E4", 0.4], ["E4", 0.4], ["E4", 0.8],
  ["E4", 0.4], ["E4", 0.4], ["E4", 0.8],
  ["E4", 0.4], ["G4", 0.4], ["C4", 0.4], ["D4", 0.4],
  ["E4", 1.6],

  ["F4", 0.4], ["F4", 0.4], ["F4", 0.4], ["F4", 0.4],
  ["F4", 0.4], ["E4", 0.4], ["E4", 0.4], ["E4", 0.2], ["E4", 0.2],
  ["G4", 0.4], ["G4", 0.4], ["F4", 0.4], ["D4", 0.4],
  ["C4", 1.6],
];

const totalDuration = MELODY.reduce((sum, [, dur]) => sum + dur, 0);
const totalSamples = Math.ceil(totalDuration * SAMPLE_RATE);
const buffer = new Float32Array(totalSamples);

function addBellNote(freq, startSample, durationSamples, gain) {
  for (let i = 0; i < durationSamples; i++) {
    const idx = startSample + i;
    if (idx >= buffer.length) break;
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 5.5) * (t < 0.005 ? t / 0.005 : 1);
    const tone =
      Math.sin(2 * Math.PI * freq * t) * 0.6 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.25 +
      Math.sin(2 * Math.PI * freq * 3 * t) * 0.1;
    buffer[idx] += tone * envelope * gain;
  }
}

function addNoiseBurst(startSample, durationSamples, gain) {
  for (let i = 0; i < durationSamples; i++) {
    const idx = startSample + i;
    if (idx >= buffer.length) break;
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 40);
    buffer[idx] += (Math.random() * 2 - 1) * envelope * gain;
  }
}

// Melody layer (bell timbre).
let cursor = 0;
for (const [note, dur] of MELODY) {
  const startSample = Math.round(cursor * SAMPLE_RATE);
  const durSamples = Math.round(dur * SAMPLE_RATE);
  addBellNote(NOTE_FREQ[note], startSample, durSamples, 0.5);
  cursor += dur;
}

// Soft bass on the downbeat of every bar (~every 1.6s).
for (let t = 0; t < totalDuration; t += 1.6) {
  addBellNote(NOTE_FREQ.C3, Math.round(t * SAMPLE_RATE), Math.round(1.4 * SAMPLE_RATE), 0.18);
}

// Sleigh-bell percussion on every eighth note.
for (let t = 0; t < totalDuration; t += 0.2) {
  addNoiseBurst(Math.round(t * SAMPLE_RATE), Math.round(0.08 * SAMPLE_RATE), 0.12);
}

// Normalize and fade the very end to zero so the loop point doesn't click.
let peak = 0;
for (let i = 0; i < buffer.length; i++) peak = Math.max(peak, Math.abs(buffer[i]));
const norm = peak > 0 ? 0.9 / peak : 1;
const fadeSamples = Math.round(0.02 * SAMPLE_RATE);
for (let i = 0; i < buffer.length; i++) {
  let s = buffer[i] * norm;
  if (i >= buffer.length - fadeSamples) {
    s *= (buffer.length - i) / fadeSamples;
  }
  buffer[i] = s;
}

// Encode as 16-bit PCM mono WAV.
const dataSize = buffer.length * 2;
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + dataSize, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
header.writeUInt16LE(2, 32); // block align
header.writeUInt16LE(16, 34); // bits per sample
header.write("data", 36);
header.writeUInt32LE(dataSize, 40);

const pcm = Buffer.alloc(dataSize);
for (let i = 0; i < buffer.length; i++) {
  const s = Math.max(-1, Math.min(1, buffer[i]));
  pcm.writeInt16LE(Math.round(s * 32767), i * 2);
}

const outPath = path.join(__dirname, "..", "..", "public", "audio", "jingle-bells.wav");
fs.writeFileSync(outPath, Buffer.concat([header, pcm]));
console.log(`Wrote ${outPath} (${(pcm.length / 1024).toFixed(0)} KB, ${totalDuration.toFixed(1)}s)`);
