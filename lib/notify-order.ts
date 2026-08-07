// Emails sent by Resend when a new order comes in: one to the shop owner,
// one confirming the order to the customer. Requires RESEND_API_KEY (see
// .env.example). If not configured, this silently no-ops — checkout must
// never fail because a notification couldn't be sent.
//
// Note: automatic WhatsApp alerts to the owner aren't handled here — the
// customer taps "Send it via WhatsApp too" on the order confirmation screen
// instead, which opens WhatsApp from their own phone with the order
// pre-filled (see app/(site)/checkout/page.tsx).

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

export async function notifyNewOrder(order: OrderNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const itemsHtml = order.items
    .map((i) => `<li>${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ""} — $${i.price.toFixed(2)}</li>`)
    .join("");

  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
  if (ownerEmail) {
    await sendEmail(
      apiKey,
      ownerEmail,
      `New order — $${order.total.toFixed(2)}`,
      `
        <h2>New order</h2>
        <p><strong>${order.name}</strong> — ${order.phone} — ${order.email}</p>
        <p>${order.address}, ${order.city} (${order.shippingZone})</p>
        <p>Payment: ${order.paymentMethod === "cod" ? "Cash on delivery" : "Card"}</p>
        <ul>${itemsHtml}</ul>
        <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
        <p>Order ref: ${order.orderId.slice(0, 8)}</p>
      `
    );
  }

  await sendEmail(
    apiKey,
    order.email,
    `Order confirmed — thank you, ${order.name}!`,
    `
      <h2>Thanks for your order, ${order.name}!</h2>
      <p>We've received it and will be in touch shortly to confirm.</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
      <p>Shipping to: ${order.address}, ${order.city}</p>
      <p>Payment: ${order.paymentMethod === "cod" ? "Cash on delivery" : "Card"}</p>
      <p>Order ref: ${order.orderId.slice(0, 8)}</p>
    `
  );
}

export async function sendWelcomeEmail(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await sendEmail(
    apiKey,
    email,
    "Welcome to House of Optics!",
    `
      <h2>Thanks for subscribing!</h2>
      <p>You're on the list — you'll be the first to hear about new arrivals, exclusive discounts, and updates from House of Optics.</p>
      <p>Talk soon,<br/>House of Optics</p>
    `
  );
}
