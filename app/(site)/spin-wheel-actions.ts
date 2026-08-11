"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { subscribeToNewsletter } from "./newsletter-actions";

// Heavily weighted toward "no luck" — real discounts should be a rare,
// exciting exception, not something most visitors walk away with.
const PRIZES: { percent: number; weight: number }[] = [
  { percent: 0, weight: 75 },
  { percent: 10, weight: 17 },
  { percent: 15, weight: 8 },
];

function pickWeighted(): number {
  const total = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * total;
  for (const p of PRIZES) {
    if (r < p.weight) return p.percent;
    r -= p.weight;
  }
  return PRIZES[0].percent;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous-looking characters
  let code = "SPIN-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // one spin per email every 24h

export type SpinResult =
  | { ok: true; discountPercent: number; code: string | null }
  | { ok: false; error: string };

// Returns a result object instead of throwing — Next.js replaces any
// thrown Server Action error with a generic "Server Components render"
// message in production builds, which was showing up in the popup instead
// of the actual "try again in Xh" text.
export async function spinWheel(email: string): Promise<SpinResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return { ok: false, error: "A valid email is required" };
  }

  const supabase = createServiceClient();

  // Gate every attempt (win or not) by email — otherwise "no luck" spins
  // are free and someone can just keep spinning with the same address.
  const { data: lastAttempt } = await supabase
    .from("spin_wheel_attempts")
    .select("created_at")
    .eq("email", trimmed)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastAttempt) {
    const elapsed = Date.now() - new Date(lastAttempt.created_at).getTime();
    if (elapsed < SPIN_COOLDOWN_MS) {
      const hoursLeft = Math.max(1, Math.ceil((SPIN_COOLDOWN_MS - elapsed) / (60 * 60 * 1000)));
      return { ok: false, error: `You've already spun with this email — try again in ${hoursLeft}h.` };
    }
  }

  // spin_wheel_attempts comes from a migration that may not have run yet —
  // if the insert silently fails the spin still works, just without the
  // cooldown being enforced until the migration is applied.
  await supabase.from("spin_wheel_attempts").insert({ email: trimmed });

  const discountPercent = pickWeighted();

  let code: string | null = null;
  if (discountPercent > 0) {
    // Retry on the astronomically unlikely chance of a code collision.
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = generateCode();
      const { error } = await supabase
        .from("spin_wheel_wins")
        .insert({ email: trimmed, discount_percent: discountPercent, code: candidate });
      if (!error) code = candidate;
    }
  }

  // Best-effort — spinning also opts them into the newsletter, matching the
  // "you agree to receive updates" disclaimer shown on the wheel.
  subscribeToNewsletter(trimmed).catch(() => {});

  return { ok: true, discountPercent, code };
}

const CODE_LIFETIME_MS = 60 * 60 * 1000; // codes expire 1 hour after being won

export async function validatePromoCode(code: string): Promise<{ valid: boolean; discountPercent: number | null }> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { valid: false, discountPercent: null };

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("spin_wheel_wins")
    .select("discount_percent, created_at")
    .eq("code", trimmed)
    .is("used_at", null)
    .maybeSingle();

  if (!data) return { valid: false, discountPercent: null };
  if (Date.now() - new Date(data.created_at).getTime() > CODE_LIFETIME_MS) {
    return { valid: false, discountPercent: null };
  }
  return { valid: true, discountPercent: data.discount_percent };
}
