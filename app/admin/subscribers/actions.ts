"use server";

import { createServiceClient } from "@/lib/supabase/server";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendBroadcast(formData: FormData) {
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!subject || !message) return { sent: 0, error: "Subject and message are required" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: 0, error: "RESEND_API_KEY is not configured" };

  const supabase = createServiceClient();
  const { data: subscribers } = await supabase.from("newsletter_subscribers").select("email");
  const emails = (subscribers ?? []).map((s: any) => s.email as string);

  let sent = 0;
  for (const email of emails) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "House of Optics <orders@resend.dev>",
        to: [email],
        subject,
        html: `<div style="white-space:pre-line">${message}</div>`,
      }),
    });
    sent += 1;
    await sleep(550); // stay comfortably under Resend's free-tier rate limit
  }

  return { sent, error: null };
}
