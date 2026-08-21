"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { restoreOrderStock } from "@/lib/order-stock";
import { renderEmail } from "@/lib/email-template";
import { sendEmail } from "@/lib/notify-order";
import { SITE_URL } from "@/lib/site";

// Lets a customer cancel their own order from /compte or /historique — the
// admin is notified by email, the customer isn't sent one (they already
// know, they're the one who just clicked cancel).
export async function cancelOrderAsCustomer(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, customer_id, customer_name, total")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status === "cancelled") return { ok: true };

  // An order tied to an account can only be cancelled by that same
  // account — a guest order (customer_id null) has no login to check
  // against, so knowing its exact (unguessable) id is the access boundary,
  // same as /historique already relies on to even display it.
  if (order.customer_id) {
    const cookieClient = await createClient();
    const {
      data: { user },
    } = await cookieClient.auth.getUser();
    if (!user || user.id !== order.customer_id) return { ok: false, error: "Not your order" };
  }

  await restoreOrderStock(supabase, orderId);
  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);

  revalidatePath("/compte");
  revalidatePath("/historique");
  revalidateTag("products");

  const apiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
  if (apiKey && ownerEmail) {
    await sendEmail(
      apiKey,
      ownerEmail,
      `Order cancelled by customer — #${orderId.slice(0, 8)}`,
      renderEmail({
        heading: "A customer cancelled their order",
        bodyHtml: `
          <p style="margin:0 0 4px;"><strong>${order.customer_name}</strong></p>
          <p style="margin:0 0 4px;">Order ref: ${orderId.slice(0, 8)}</p>
          <p style="margin:0;">Total: $${Number(order.total).toFixed(2)}</p>
          <p style="margin:16px 0 0;">Stock for its items has already been given back automatically.</p>
        `,
        ctaLabel: "Open dashboard",
        ctaUrl: `${SITE_URL}/admin/orders`,
      })
    );
  }

  return { ok: true };
}
