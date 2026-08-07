// Emails sent by Resend when a new order comes in: one to the shop owner,
// one confirming the order to the customer. Requires RESEND_API_KEY (see
// .env.example). If not configured, this silently no-ops — checkout must
// never fail because a notification couldn't be sent.
//
// WhatsApp alert to the owner via CallMeBot (callmebot.com) — a free
// third-party service for *personal* WhatsApp notifications, not the
// official WhatsApp Business API. It works by messaging their bot number
// once from the owner's own phone to get a personal API key, then a simple
// HTTP request triggers a WhatsApp message to that same number. Requires
// CALLMEBOT_PHONE + CALLMEBOT_APIKEY env vars — see README for setup.

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

async function sendWhatsAppOwnerAlert(order: OrderNotification) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return;

  const summary = order.items.map((i) => `${i.quantity}x ${i.name}${i.variant ? ` (${i.variant})` : ""}`).join(", ");
  const text = `New order! ${order.name} (${order.phone})\n${summary}\nTotal: $${order.total.toFixed(2)} - ${order.paymentMethod === "cod" ? "Cash on delivery" : "Card"}\n${order.address}, ${order.city}`;

  await fetch(
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`
  ).catch(() => {});
}

export async function notifyNewOrder(order: OrderNotification) {
  const itemsHtml = order.items
    .map((i) => `<li>${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ""} — $${i.price.toFixed(2)}</li>`)
    .join("");

  await sendWhatsAppOwnerAlert(order);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

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
