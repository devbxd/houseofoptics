// Emails sent by Resend when a new order comes in: one to the shop owner,
// one confirming the order to the customer. Requires RESEND_API_KEY (see
// .env.example). If not configured, this silently no-ops — checkout must
// never fail because a notification couldn't be sent.
//
// Note: automatic WhatsApp alerts to the owner aren't handled here — the
// customer taps "Send it via WhatsApp too" on the order confirmation screen
// instead, which opens WhatsApp from their own phone with the order
// pre-filled (see app/(site)/checkout/page.tsx).

import { renderEmail } from "./email-template";
import { SITE_URL } from "./site";

type OrderNotification = {
  orderId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: string;
  shippingZone: string;
  shippingCost: number;
  total: number;
  subtotal: number;
  promoCode: string | null;
  discountAmount: number;
  giftCardCode: string | null;
  giftCardType: "product" | "discount" | "credit" | null;
  giftCardAmount: number;
  giftCardProductName: string | null;
  items: { name: string; variant: string | null; price: number; quantity: number }[];
};

const FROM = "House of Optics <orders@houseofoptics.net>";

// Never throws — a hiccup sending one email (network blip, Resend rate
// limit, etc.) must never take down the checkout/newsletter form that
// triggered it. Failures are logged so they're visible in the server logs
// instead of silently vanishing. Returns whether it actually went out —
// callers that need to tell the admin "sent" vs "failed" (e.g. emailing a
// gift card) use this; fire-and-forget callers just ignore it.
export async function sendEmail(apiKey: string, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error(`Resend email to ${to} failed (${res.status}): ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Resend email to ${to} threw:`, err);
    return false;
  }
}

function itemsList(items: OrderNotification["items"]) {
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ""}${
            i.price === 0 ? ' <span style="color:#c8102e;">(Gift — Free)</span>' : ""
          }</td>
          <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;text-align:right;">$${i.price.toFixed(2)}</td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0;">${rows}</table>`;
}

// So a discounted/gifted total is never shown as just a smaller number
// with no explanation — every line that changed it (promo code, gift
// card, shipping) is spelled out, right down to which specific gift card
// code was used.
function totalsBreakdown(o: OrderNotification) {
  const lines = [`<tr><td style="padding:3px 0;">Subtotal</td><td style="padding:3px 0;text-align:right;">$${o.subtotal.toFixed(2)}</td></tr>`];

  if (o.promoCode) {
    lines.push(
      `<tr><td style="padding:3px 0;color:#c8102e;">Promo code ${o.promoCode}</td><td style="padding:3px 0;text-align:right;color:#c8102e;">-$${o.discountAmount.toFixed(2)}</td></tr>`
    );
  }

  if (o.giftCardCode && o.giftCardType === "product") {
    lines.push(
      `<tr><td style="padding:3px 0;color:#c8102e;">🎁 Gift card ${o.giftCardCode}</td><td style="padding:3px 0;text-align:right;color:#c8102e;">${o.giftCardProductName ?? "Free item"} — FREE</td></tr>`
    );
  } else if (o.giftCardCode) {
    lines.push(
      `<tr><td style="padding:3px 0;color:#c8102e;">🎁 Gift card ${o.giftCardCode} (${o.giftCardType})</td><td style="padding:3px 0;text-align:right;color:#c8102e;">-$${o.giftCardAmount.toFixed(2)}</td></tr>`
    );
  }

  lines.push(`<tr><td style="padding:3px 0;">Shipping (${o.shippingZone === "beirut" ? "Beirut" : "Outside Beirut"})</td><td style="padding:3px 0;text-align:right;">$${o.shippingCost.toFixed(2)}</td></tr>`);
  lines.push(`<tr><td style="padding:6px 0 0;font-size:16px;"><strong>Total</strong></td><td style="padding:6px 0 0;text-align:right;font-size:16px;"><strong>$${o.total.toFixed(2)}</strong></td></tr>`);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0 0;">${lines.join("")}</table>`;
}

export async function notifyNewOrder(order: OrderNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const paymentLabel = order.paymentMethod === "cod" ? "Cash on delivery" : "Card";

  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
  if (ownerEmail) {
    await sendEmail(
      apiKey,
      ownerEmail,
      `New order — $${order.total.toFixed(2)}`,
      renderEmail({
        heading: "New order received",
        bodyHtml: `
          <p style="margin:0 0 4px;"><strong>${order.name}</strong> — ${order.phone} — ${order.email}</p>
          <p style="margin:0 0 4px;">${order.address}, ${order.city} (${order.shippingZone})</p>
          <p style="margin:0;">Payment: ${paymentLabel}</p>
          ${itemsList(order.items)}
          ${totalsBreakdown(order)}
          <p style="margin:8px 0 0;font-size:12px;color:#999;">Order ref: ${order.orderId.slice(0, 8)}</p>
        `,
        ctaLabel: "Open dashboard",
        ctaUrl: `${SITE_URL}/admin/orders`,
      })
    );
  }

  await sendEmail(
    apiKey,
    order.email,
    `Order confirmed — thank you, ${order.name}!`,
    renderEmail({
      heading: `Thank you, ${order.name}!`,
      bodyHtml: `
        <p>We've received your order and will be in touch shortly to confirm.</p>
        ${itemsList(order.items)}
        ${totalsBreakdown(order)}
        <p style="margin:16px 0 0;">Shipping to: ${order.address}, ${order.city}</p>
        <p style="margin:4px 0 0;">Payment: ${paymentLabel}</p>
        <p style="margin:12px 0 0;font-size:12px;color:#999;">Order ref: ${order.orderId.slice(0, 8)}</p>
      `,
      ctaLabel: "Continue shopping",
      ctaUrl: `${SITE_URL}/produits`,
    })
  );
}

export async function sendWelcomeEmail(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await sendEmail(
    apiKey,
    email,
    "Welcome to House of Optics!",
    renderEmail({
      heading: "Thanks for subscribing!",
      bodyHtml: `
        <p>You're on the list — you'll be the first to hear about new arrivals, exclusive discounts, and
        updates from House of Optics.</p>
        <p style="margin-top:16px;">Talk soon,<br/>House of Optics</p>
      `,
      ctaLabel: "Discover the collection",
      ctaUrl: `${SITE_URL}/produits`,
    })
  );
}
