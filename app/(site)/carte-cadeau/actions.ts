"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
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

type GiftCardRow = {
  code: string;
  type: string;
  discount_percent: number | null;
  credit_amount: number | null;
  remaining_amount: number | null;
  recipient_name: string;
  message: string | null;
  product:
    | { id: string; name: string; slug: string; price: number | null; discount_percent: number | null; stock: number | null; images: { url: string; sort_order: number }[] }
    | { id: string; name: string; slug: string; price: number | null; discount_percent: number | null; stock: number | null; images: { url: string; sort_order: number }[] }[]
    | null;
};

const GIFT_CARD_SELECT =
  "code, type, discount_percent, credit_amount, remaining_amount, recipient_name, message, redeemed_at, product:products(id, name, slug, price, discount_percent, stock, images:product_images(url, sort_order))";

function shapeGiftCardRow(data: GiftCardRow): GiftCardPreview {
  if (data.type === "product") {
    const p = Array.isArray(data.product) ? data.product[0] : data.product;
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
    // remaining_amount, not credit_amount — the current balance after any
    // earlier partial spend, not the card's original face value.
    creditAmount: Number(data.remaining_amount ?? data.credit_amount),
  };
}

// Read-only lookup — never throws, never mutates. The code is only ever
// actually claimed (redeemed_at set) atomically at checkout, exactly like
// the spin-wheel promo code — this just answers "what would this code give
// me right now", safe to call as many times as the customer retypes it.
export async function previewGiftCard(rawCode: string): Promise<GiftCardPreview> {
  const code = normalizeGiftCardCode(rawCode);
  if (!code) return { valid: false };

  const supabase = createServiceClient();
  const { data } = await supabase.from("gift_cards").select(GIFT_CARD_SELECT).eq("code", code).maybeSingle();

  if (!data || data.redeemed_at) return { valid: false };
  return shapeGiftCardRow(data as GiftCardRow);
}

// Ties a revealed-but-not-yet-spent gift card to the logged-in customer's
// account instead of the device it was revealed on — a code can change
// hands (re-claimed by a different account) until it's actually redeemed,
// same as a real gift card changing hands until it's spent.
export async function claimGiftCard(rawCode: string): Promise<GiftCardPreview> {
  const code = normalizeGiftCardCode(rawCode);
  if (!code) return { valid: false };

  const cookieClient = await createClient();
  const {
    data: { user },
  } = await cookieClient.auth.getUser();
  if (!user) return { valid: false };

  const supabase = createServiceClient();
  await supabase.from("gift_cards").update({ customer_id: user.id }).eq("code", code).is("redeemed_at", null);

  return previewGiftCard(code);
}

// "Remove" on the checkout page — lets go of this gift card without
// spending it, so it stops following the account around until they
// deliberately re-enter the code again.
export async function releaseGiftCard(rawCode: string): Promise<void> {
  const code = normalizeGiftCardCode(rawCode);
  if (!code) return;

  const cookieClient = await createClient();
  const {
    data: { user },
  } = await cookieClient.auth.getUser();
  if (!user) return;

  const supabase = createServiceClient();
  await supabase.from("gift_cards").update({ customer_id: null }).eq("code", code).eq("customer_id", user.id);
}

// Whatever unredeemed gift card the logged-in customer currently holds, if
// any — this is what makes the "you still have a gift" reminder (and the
// checkout page's applied gift card) follow the account across devices
// instead of living in one browser's local storage.
export async function getMyActiveGiftCard(): Promise<GiftCardPreview> {
  const cookieClient = await createClient();
  const {
    data: { user },
  } = await cookieClient.auth.getUser();
  if (!user) return { valid: false };

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("gift_cards")
    .select(GIFT_CARD_SELECT)
    .eq("customer_id", user.id)
    .is("redeemed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { valid: false };
  return shapeGiftCardRow(data as GiftCardRow);
}
