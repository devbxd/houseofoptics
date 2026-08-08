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
  total: number;
  items: { name: string; variant: string | null; price: number; quantity: number }[];
};

const FROM = "House of Optics <orders@resend.dev>";

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
}

function itemsList(items: OrderNotification["items"]) {
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ""}</td>
          <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;text-align:right;">$${i.price.toFixed(2)}</td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0;">${rows}</table>`;
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
          <p style="margin:0;font-size:16px;"><strong>Total: $${order.total.toFixed(2)}</strong></p>
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
        <p style="margin:0;font-size:16px;"><strong>Total: $${order.total.toFixed(2)}</strong></p>
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
