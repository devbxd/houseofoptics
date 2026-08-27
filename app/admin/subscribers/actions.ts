"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { renderEmail, textToHtml } from "@/lib/email-template";
import { SITE_URL } from "@/lib/site";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const BATCH_SIZE = 10;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
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
  // Sent in batches of 10 via Resend's own /emails/batch endpoint (one
  // request per batch) instead of one request per subscriber — a list of
  // a few hundred used to mean a few hundred sequential requests with a
  // 550ms pause between each, easily exceeding a serverless function's
  // timeout with no way to know who'd actually been sent to if it did.
  for (const batch of chunk(emails, BATCH_SIZE)) {
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(
          batch.map((email) => ({
            from: "House of Optics <orders@houseofoptics.net>",
            to: [email],
            subject,
            html,
          }))
        ),
      });
      if (res.ok) {
        sent += batch.length;
      } else {
        failed += batch.length;
        console.error(`Broadcast batch failed (${res.status}): ${await res.text()}`);
      }
    } catch (err) {
      failed += batch.length;
      console.error("Broadcast batch threw:", err);
    }
    await sleep(600); // a short pause between batches, comfortably under Resend's rate limit
  }

  return {
    sent,
    error: failed > 0 ? `${failed} email${failed === 1 ? "" : "s"} failed to send — check the server logs` : null,
  };
}
