"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { normalizeGiftCardCode } from "@/lib/gift-cards";

export type GiftCardPreview =
  | { valid: false }
  | {
      valid: true;
      code: string;
      type: "product";
      recipientName: string;
      message: string | null;
      product: {
        id: string;
        name: string;
        slug: string;
        image: string | null;
        price: number | null;
        discountPercent: number | null;
        stock: number | null;
      };
    }
  | { valid: true; code: string; type: "discount"; recipientName: string; message: string | null; discountPercent: number }
  | { valid: true; code: string; type: "credit"; recipientName: string; message: string | null; creditAmount: number };

// Read-only lookup — never throws, never mutates. The code is only ever
// actually claimed (redeemed_at set) atomically at checkout, exactly like
// the spin-wheel promo code — this just answers "what would this code give
// me right now", safe to call as many times as the customer retypes it.
export async function previewGiftCard(rawCode: string): Promise<GiftCardPreview> {
  const code = normalizeGiftCardCode(rawCode);
  if (!code) return { valid: false };

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("gift_cards")
    .select(
      "code, type, discount_percent, credit_amount, recipient_name, message, redeemed_at, product:products(id, name, slug, price, discount_percent, stock, images:product_images(url, sort_order))"
    )
    .eq("code", code)
    .maybeSingle();

  if (!data || data.redeemed_at) return { valid: false };

  if (data.type === "product") {
    const p = (Array.isArray(data.product) ? data.product[0] : data.product) as
      | { id: string; name: string; slug: string; price: number | null; discount_percent: number | null; stock: number | null; images: { url: string; sort_order: number }[] }
      | null;
    // The gifted product was deleted since this card was issued — nothing
    // safe to hand over, so this reads as "invalid" rather than crashing
    // on a null product.
    if (!p) return { valid: false };
    const images = (p.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    return {
      valid: true,
      code: data.code,
      type: "product",
      recipientName: data.recipient_name,
      message: data.message,
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: images[0]?.url ?? null,
        price: p.price,
        discountPercent: p.discount_percent,
        stock: p.stock,
      },
    };
  }

  if (data.type === "discount") {
    return {
      valid: true,
      code: data.code,
      type: "discount",
      recipientName: data.recipient_name,
      message: data.message,
      discountPercent: data.discount_percent!,
    };
  }

  return {
    valid: true,
    code: data.code,
    type: "credit",
    recipientName: data.recipient_name,
    message: data.message,
    creditAmount: Number(data.credit_amount),
  };
}
