"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { generateGiftCardCode } from "@/lib/gift-cards";
import { renderEmail } from "@/lib/email-template";
import { sendEmail } from "@/lib/notify-order";
import { SITE_URL } from "@/lib/site";

type ServiceClient = ReturnType<typeof createServiceClient>;

// Retries with a fresh code on the astronomically unlikely chance of a
// collision (32^12 possible codes) rather than ever failing generation
// outright over it.
async function insertWithUniqueCode(supabase: ServiceClient, row: Record<string, unknown>): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateGiftCardCode();
    const { data, error } = await supabase.from("gift_cards").insert({ ...row, code }).select("code").single();
    if (!error && data) return data.code as string;
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Couldn't generate a unique code — please try again.");
}

export async function generateProductGiftCard(input: { productId: string; recipientName: string; message: string }) {
  const recipientName = input.recipientName.trim();
  if (!recipientName) throw new Error("Recipient name is required");
  if (!input.productId) throw new Error("Pick a product first");

  const supabase = createServiceClient();
  const code = await insertWithUniqueCode(supabase, {
    type: "product",
    product_id: input.productId,
    recipient_name: recipientName,
    message: input.message.trim() || null,
  });
  revalidatePath("/admin/gift-cards");
  return { code };
}

export async function generateDiscountGiftCard(input: { discountPercent: number; recipientName: string; message: string }) {
  const recipientName = input.recipientName.trim();
  if (!recipientName) throw new Error("Recipient name is required");
  if (!Number.isFinite(input.discountPercent) || input.discountPercent <= 0 || input.discountPercent > 100) {
    throw new Error("Discount must be between 1 and 100");
  }

  const supabase = createServiceClient();
  const code = await insertWithUniqueCode(supabase, {
    type: "discount",
    discount_percent: Math.round(input.discountPercent),
    recipient_name: recipientName,
    message: input.message.trim() || null,
  });
  revalidatePath("/admin/gift-cards");
  return { code };
}

export async function generateCreditGiftCard(input: { creditAmount: number; recipientName: string; message: string }) {
  const recipientName = input.recipientName.trim();
  if (!recipientName) throw new Error("Recipient name is required");
  if (!Number.isFinite(input.creditAmount) || input.creditAmount <= 0) {
    throw new Error("Credit amount must be greater than 0");
  }

  const supabase = createServiceClient();
  const amount = Math.round(input.creditAmount * 100) / 100;
  const code = await insertWithUniqueCode(supabase, {
    type: "credit",
    credit_amount: amount,
    // Starts equal to the full amount — decremented order by order as the
    // customer spends it, so a card doesn't have to be used up in one go.
    remaining_amount: amount,
    recipient_name: recipientName,
    message: input.message.trim() || null,
  });
  revalidatePath("/admin/gift-cards");
  return { code };
}

export async function deleteGiftCard(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("gift_cards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/gift-cards");
}

export type CustomerOption = { id: string; name: string; email: string; phone: string | null };

// customer_profiles doesn't hold the email itself (that lives on the
// protected auth.users table) — the admin API is the supported way to read
// it, only ever from server code with the service-role key.
export async function listCustomersForPicker(): Promise<CustomerOption[]> {
  const supabase = createServiceClient();
  const { data: profiles } = await supabase.from("customer_profiles").select("id, name, phone");
  if (!profiles || profiles.length === 0) return [];

  const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((usersPage?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  return profiles
    .map((p) => ({ id: p.id, name: p.name, phone: p.phone, email: emailById.get(p.id) ?? "" }))
    .filter((c) => c.email);
}

function giftCardSummary(card: {
  type: string;
  discount_percent: number | null;
  credit_amount: number | null;
  productName: string | null;
}): string {
  if (card.type === "product") return card.productName ?? "a free item";
  if (card.type === "discount") return `${card.discount_percent}% off`;
  return `$${Number(card.credit_amount).toFixed(2)} credit`;
}

// Emails the code straight to the recipient with a short explainer of what
// they've been given and how to redeem it — an alternative to the admin
// copying the code and sending it themselves.
export async function sendGiftCardByEmail(code: string, recipientEmail: string): Promise<{ ok: boolean; error?: string }> {
  const email = recipientEmail.trim();
  if (!email || !email.includes("@")) return { ok: false, error: "Invalid email address" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Email sending isn't configured (missing RESEND_API_KEY)" };

  const supabase = createServiceClient();
  const { data: card } = (await supabase
    .from("gift_cards")
    .select("code, type, discount_percent, credit_amount, recipient_name, message, product:products(name)")
    .eq("code", code)
    .maybeSingle()) as { data: any };
  if (!card) return { ok: false, error: "Gift card not found" };

  const productName = Array.isArray(card.product) ? card.product[0]?.name : card.product?.name;
  const summary = giftCardSummary({ type: card.type, discount_percent: card.discount_percent, credit_amount: card.credit_amount, productName: productName ?? null });

  const sent = await sendEmail(
    apiKey,
    email,
    `🎁 You've received a gift — House of Optics`,
    renderEmail({
      heading: `A gift for ${card.recipient_name}`,
      bodyHtml: `
        <p style="margin:0 0 16px;">You've received: <strong>${summary}</strong></p>
        ${card.message ? `<p style="margin:0 0 16px;font-style:italic;">"${card.message}"</p>` : ""}
        <p style="margin:0 0 8px;">To use it, sign in (or create a free account) on our site, then enter this code:</p>
        <p style="margin:12px 0;padding:14px 18px;background:#f2f0ec;font-family:monospace;font-size:18px;letter-spacing:2px;text-align:center;">${card.code}</p>
      `,
      ctaLabel: "Use my gift",
      ctaUrl: `${SITE_URL}/carte-cadeau`,
    })
  );

  return sent ? { ok: true } : { ok: false, error: "Sending failed — try again in a moment." };
}
