"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { generateGiftCardCode } from "@/lib/gift-cards";

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
  const code = await insertWithUniqueCode(supabase, {
    type: "credit",
    credit_amount: Math.round(input.creditAmount * 100) / 100,
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
