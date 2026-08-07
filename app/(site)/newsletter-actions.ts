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

  await sendWelcomeEmail(trimmed);
  return { error: null };
}
