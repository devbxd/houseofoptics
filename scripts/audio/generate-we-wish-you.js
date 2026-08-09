// Synthesizes a looping instrumental rendering of "We Wish You a Merry
// Christmas" (traditional English carol, public domain) as a WAV file. Four
// synthesized layers — bell-like melody, a soft sustained pad for warmth,
// a root/fifth bass, and light chime percussion — mixed and written as
// 16-bit PCM. Re-run with `node scripts/audio/generate-we-wish-you.js` if
// the arrangement ever needs to change.

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;

const NOTE_FREQ = {
  G3: 196.0,
  D4: 293.66,
  E4: 329.63,
  Fs4: 369.99,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
};

// One phrase = "We wish you a merry Christmas" (6/8 feel). E = eighth,
// Q. = dotted quarter (3 eighths), H. = dotted half (6 eighths, phrase end).
const E = 0.2;
const Qd = 0.6;
const Hd = 1.3;

const PHRASE = [
  ["D4", E],
  ["G4", Qd], ["G4", E], ["A4", E], ["G4", E], ["Fs4", E],
  ["E4", Qd], ["E4", E], ["E4", E],
  ["A4", Qd], ["A4", E], ["B4", E], ["A4", E], ["G4", E], ["Fs4", E],
  ["D4", Qd], ["D4", E], ["B4", E], ["B4", E], ["C5", E], ["B4", E], ["A4", E], ["G4", E], ["Fs4", E],
  ["D4", Hd],
];

const TAG = [
  ["A4", Qd], ["A4", E], ["B4", E], ["A4", E], ["G4", E], ["Fs4", E],
  ["G4", 1.5],
];

// Two verses, then the "and a happy New Year" resolution.
const MELODY = [...PHRASE, ...PHRASE, ...TAG];

const totalDuration = MELODY.reduce((sum, [, dur]) => sum + dur, 0);
const totalSamples = Math.ceil(totalDuration * SAMPLE_RATE);
const buffer = new Float32Array(totalSamples);

function addBellNote(freq, startSample, durationSamples, gain) {
  for (let i = 0; i < durationSamples; i++) {
    const idx = startSample + i;
    if (idx >= buffer.length) break;
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 4.5) * (t < 0.006 ? t / 0.006 : 1);
    const tone =
      Math.sin(2 * Math.PI * freq * t) * 0.6 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.22 +
      Math.sin(2 * Math.PI * freq * 3 * t) * 0.08;
    buffer[idx] += tone * envelope * gain;
  }
}

// Soft chorused pad — two slightly detuned sines with a slow attack, for a
// warm string/music-box wash under the melody instead of dead silence.
function addPad(freq, startSample, durationSamples, gain) {
  for (let i = 0; i < durationSamples; i++) {
    const idx = startSample + i;
    if (idx >= buffer.length) break;
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.4);
    const release = Math.min(1, (durationSamples / SAMPLE_RATE - t) / 0.3);
    const envelope = Math.max(0, Math.min(attack, release));
    const tone =
      Math.sin(2 * Math.PI * freq * t) * 0.5 +
      Math.sin(2 * Math.PI * freq * 1.003 * t) * 0.5;
    buffer[idx] += tone * envelope * gain;
  }
}

function addChime(freq, startSample, gain) {
  const durationSamples = Math.round(0.5 * SAMPLE_RATE);
  for (let i = 0; i < durationSamples; i++) {
    const idx = startSample + i;
    if (idx >= buffer.length) break;
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 9);
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.7 + Math.sin(2 * Math.PI * freq * 2.76 * t) * 0.3;
    buffer[idx] += tone * envelope * gain;
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

// Bass + pad, one chord per phrase: G major under most of the phrase, D
// major (dominant) under the "merry Christmas" cadence, back to G to land.
const phraseDuration = PHRASE.reduce((s, [, d]) => s + d, 0);
const chordPlan = [
  { start: 0, dur: phraseDuration, root: "G3", pad: "D4" },
  { start: phraseDuration, dur: phraseDuration, root: "G3", pad: "D4" },
  { start: phraseDuration * 2, dur: TAG.reduce((s, [, d]) => s + d, 0), root: "G3", pad: "D4" },
];
for (const c of chordPlan) {
  const startSample = Math.round(c.start * SAMPLE_RATE);
  const durSamples = Math.round(c.dur * SAMPLE_RATE);
  addPad(NOTE_FREQ[c.root], startSample, durSamples, 0.1);
  addPad(NOTE_FREQ[c.pad], startSample, durSamples, 0.06);
}

// Light chime accents on the first beat of every bar-ish group (every 1.4s).
for (let t = 0.2; t < totalDuration; t += 1.4) {
  addChime(NOTE_FREQ.D5, Math.round(t * SAMPLE_RATE), 0.07);
}

// Normalize and fade the very end to zero so the loop point doesn't click.
let peak = 0;
for (let i = 0; i < buffer.length; i++) peak = Math.max(peak, Math.abs(buffer[i]));
const norm = peak > 0 ? 0.9 / peak : 1;
const fadeSamples = Math.round(0.03 * SAMPLE_RATE);
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

const outPath = path.join(__dirname, "..", "..", "public", "audio", "we-wish-you-a-merry-christmas.wav");
fs.writeFileSync(outPath, Buffer.concat([header, pcm]));
console.log(`Wrote ${outPath} (${(pcm.length / 1024).toFixed(0)} KB, ${totalDuration.toFixed(1)}s)`);
