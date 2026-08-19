"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "@/lib/locale-client";
import { useCart } from "@/components/CartProvider";
import { previewGiftCard, type GiftCardPreview } from "./actions";
import { setActiveGiftCard } from "@/lib/gift-card-client";

export default function GiftCardPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { addItem } = useCart();

  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GiftCardPreview | null>(null);
  const [added, setAdded] = useState(false);

  const revealed = preview && preview.valid ? preview : null;

  async function handleReveal(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    setError(null);
    try {
      const result = await previewGiftCard(code);
      if (!result.valid) {
        setError(t["giftCard.invalidCode"]);
        setPreview(null);
      } else {
        setPreview(result);
      }
    } catch {
      setError(t["checkout.genericError"]);
    } finally {
      setChecking(false);
    }
  }

  function goRedeemAtCheckout() {
    if (!revealed || revealed.type === "product") return;
    setActiveGiftCard({ code: revealed.code, type: revealed.type });
    router.push("/checkout");
  }

  function addFreeProduct() {
    if (!revealed || revealed.type !== "product") return;
    setActiveGiftCard({ code: revealed.code, type: "product" });
    addItem(
      { productId: revealed.product.id, variant: null, name: revealed.product.name, price: 0, image: revealed.product.image },
      1
    );
    setAdded(true);
  }

  function tryAnother() {
    setPreview(null);
    setCode("");
    setAdded(false);
    setError(null);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-center font-serif text-2xl">{t["giftCard.title"]}</h1>
      <p className="mt-2 text-center text-sm text-neutral-600">{t["giftCard.subtitle"]}</p>

      {!revealed && (
        <form onSubmit={handleReveal} className="mt-8 flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder={t["giftCard.codePlaceholder"]}
            className="flex-1 border border-neutral-300 px-4 py-3 text-center font-mono uppercase tracking-widest focus:border-brand-black focus:outline-none"
          />
          <button
            type="submit"
            disabled={checking || !code.trim()}
            className="shrink-0 bg-brand-black px-6 py-3 text-sm uppercase tracking-widest text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? t["giftCard.checking"] : t["giftCard.reveal"]}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-center text-sm text-brand-red">{error}</p>}

      {revealed && (
        <div className="mt-8 rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-700 p-8 text-center text-white shadow-lg">
          <p className="text-xs uppercase tracking-widest text-neutral-300">{t["giftCard.congrats"]}</p>
          <p className="mt-1 text-lg">{t["giftCard.forName"].replace("{name}", revealed.recipientName)}</p>

          {revealed.type === "product" && (
            <div className="mt-6">
              <p className="mb-3 text-sm text-neutral-200">{t["giftCard.typeProductLabel"]}</p>
              <div className="mx-auto flex max-w-xs items-center gap-3 rounded-md bg-white/10 p-3 text-left">
                {revealed.product.image && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-white/10">
                    <Image src={revealed.product.image} alt={revealed.product.name} fill unoptimized sizes="64px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm">{revealed.product.name}</p>
                  {revealed.product.price != null && (
                    <p className="text-xs text-neutral-300 line-through">${revealed.product.price.toFixed(2)}</p>
                  )}
                  <p className="text-sm font-medium text-emerald-300">$0.00</p>
                </div>
              </div>

              {revealed.product.stock != null && revealed.product.stock <= 0 ? (
                <p className="mt-4 text-sm text-neutral-300">{t["product.outOfStock"]}</p>
              ) : added ? (
                <button
                  onClick={() => router.push("/panier")}
                  className="mt-6 w-full rounded border border-white/40 py-3 text-sm uppercase tracking-widest hover:bg-white/10"
                >
                  {t["cart.checkout"]}
                </button>
              ) : (
                <button
                  onClick={addFreeProduct}
                  className="mt-6 w-full bg-white py-3 text-sm uppercase tracking-widest text-brand-black hover:opacity-90"
                >
                  {t["giftCard.useOnProduct"]}
                </button>
              )}
            </div>
          )}

          {revealed.type === "discount" && (
            <div className="mt-6">
              <p className="text-2xl font-medium">{t["giftCard.typeDiscountLabel"].replace("{percent}", String(revealed.discountPercent))}</p>
              <button
                onClick={goRedeemAtCheckout}
                className="mt-6 w-full bg-white py-3 text-sm uppercase tracking-widest text-brand-black hover:opacity-90"
              >
                {t["giftCard.useOnCheckout"]}
              </button>
            </div>
          )}

          {revealed.type === "credit" && (
            <div className="mt-6">
              <p className="text-2xl font-medium">{t["giftCard.typeCreditLabel"].replace("{amount}", revealed.creditAmount.toFixed(2))}</p>
              <button
                onClick={goRedeemAtCheckout}
                className="mt-6 w-full bg-white py-3 text-sm uppercase tracking-widest text-brand-black hover:opacity-90"
              >
                {t["giftCard.useOnCheckout"]}
              </button>
            </div>
          )}

          {revealed.message && <p className="mt-6 text-sm italic text-neutral-300">"{revealed.message}"</p>}

          <button
            onClick={tryAnother}
            className="mt-6 text-xs uppercase tracking-wide text-neutral-300 underline underline-offset-2 hover:text-white"
          >
            {t["giftCard.tryAnother"]}
          </button>
        </div>
      )}
    </main>
  );
}
