"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { subscribeToNewsletter } from "./newsletter-actions";

// Weighted so most spins land on "no luck" — protects margins while still
// giving real winners plenty of the time.
const PRIZES: { percent: number; weight: number }[] = [
  { percent: 0, weight: 45 },
  { percent: 10, weight: 35 },
  { percent: 15, weight: 20 },
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

export async function spinWheel(email: string): Promise<{ discountPercent: number; code: string | null }> {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) {
    throw new Error("A valid email is required");
  }

  const discountPercent = pickWeighted();
  const supabase = createServiceClient();

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

  return { discountPercent, code };
}

export async function validatePromoCode(code: string): Promise<{ valid: boolean; discountPercent: number | null }> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { valid: false, discountPercent: null };

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("spin_wheel_wins")
    .select("discount_percent")
    .eq("code", trimmed)
    .is("used_at", null)
    .maybeSingle();

  if (!data) return { valid: false, discountPercent: null };
  return { valid: true, discountPercent: data.discount_percent };
}
