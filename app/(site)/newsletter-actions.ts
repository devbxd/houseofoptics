"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/notify-order";

export async function subscribeToNewsletter(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return { error: "Email is required" };

  const supabase = createServiceClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email: trimmed });

  if (error && !error.message.includes("duplicate")) {
    return { error: error.message };
  }

  try {
    await sendWelcomeEmail(trimmed);
  } catch {
    // the subscription itself succeeded — a welcome-email hiccup must never
    // make the signup form look like it failed
  }
  return { error: null };
}
