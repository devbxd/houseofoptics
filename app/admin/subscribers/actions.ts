"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { renderEmail, textToHtml } from "@/lib/email-template";
import { SITE_URL } from "@/lib/site";

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

  const html = renderEmail({
    heading: subject,
    bodyHtml: textToHtml(message),
    ctaLabel: "Découvrir la collection",
    ctaUrl: `${SITE_URL}/produits`,
  });

  let sent = 0;
  let failed = 0;
  for (const email of emails) {
    // One bad recipient (typo'd address, transient Resend error) must not
    // stop the rest of the list from getting the email.
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "House of Optics <orders@resend.dev>",
          to: [email],
          subject,
          html,
        }),
      });
      if (res.ok) {
        sent += 1;
      } else {
        failed += 1;
        console.error(`Broadcast to ${email} failed (${res.status}): ${await res.text()}`);
      }
    } catch (err) {
      failed += 1;
      console.error(`Broadcast to ${email} threw:`, err);
    }
    await sleep(550); // stay comfortably under Resend's free-tier rate limit
  }

  return {
    sent,
    error: failed > 0 ? `${failed} email${failed === 1 ? "" : "s"} failed to send — check the server logs` : null,
  };
}
