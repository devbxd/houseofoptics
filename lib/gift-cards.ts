export type GiftCardType = "product" | "discount" | "credit";

// No 0/O/1/I/L — a code that gets read aloud or handwritten to a customer
// (this is a "the boss hands it over" flow, not an emailed link) shouldn't
// have characters that are easy to mix up.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateGiftCardCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  // ALPHABET.length (32) evenly divides 256, so `% length` on a random byte
  // introduces no modulo bias.
  const raw = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function normalizeGiftCardCode(code: string): string {
  return code.trim().toUpperCase();
}
