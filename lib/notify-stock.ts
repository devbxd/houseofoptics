import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "./notify-order";
import { renderEmail } from "./email-template";
import { SITE_URL } from "./site";

// Called from the admin restock paths (app/admin/produits/actions.ts) right
// after a product's base stock, or one of its color/size variants, goes
// from "out" to "in stock". Emails everyone who asked to be notified for
// that exact product/variant, then clears their subscription — never
// throws, since a restock save must never fail because an email hiccuped.
export async function notifyStockRestocked(productId: string, colorLabel: string | null, sizeLabel: string | null) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const supabase = createServiceClient();
    let query = supabase.from("stock_notifications").select("id, email").eq("product_id", productId);
    query = colorLabel ? query.eq("variant_color_label", colorLabel) : query.is("variant_color_label", null);
    query = sizeLabel ? query.eq("variant_size_label", sizeLabel) : query.is("variant_size_label", null);
    const { data: subs } = await query;
    if (!subs || subs.length === 0) return;

    const { data: product } = await supabase.from("products").select("name, slug").eq("id", productId).single();
    if (!product) return;

    const variantLabel = [colorLabel, sizeLabel].filter(Boolean).join(" / ");

    await Promise.all(
      subs.map((s) =>
        sendEmail(
          apiKey,
          s.email,
          `Back in stock — ${product.name}`,
          renderEmail({
            heading: "It's back!",
            bodyHtml: `
              <p>Good news — <strong>${product.name}</strong>${variantLabel ? ` (${variantLabel})` : ""} is back in stock.</p>
              <p>Get it before it sells out again.</p>
            `,
            ctaLabel: "Shop now",
            ctaUrl: `${SITE_URL}/produit/${product.slug}`,
          })
        )
      )
    );

    await supabase.from("stock_notifications").delete().in("id", subs.map((s) => s.id));
  } catch (err) {
    console.error("notifyStockRestocked failed:", err);
  }
}
