"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale } from "@/lib/locale-client";
import { useCart } from "@/components/CartProvider";
import { useGiftCard } from "@/components/GiftCardProvider";
import { GiftCardVisual } from "@/components/GiftCardVisual";
import { previewGiftCard, type GiftCardPreview } from "./actions";

export default function GiftCardPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { addItem } = useCart();
  const { claim } = useGiftCard();

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

  async function goRedeemAtCheckout() {
    if (!revealed || revealed.type === "product") return;
    await claim(revealed.code);
    router.push("/checkout");
  }

  async function addFreeProduct() {
    if (!revealed || revealed.type !== "product") return;
    await claim(revealed.code);
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
        <div className="mt-8">
          <GiftCardVisual>
            <p className="text-xs uppercase tracking-widest text-neutral-500">{t["giftCard.congrats"]}</p>
            <p className="mt-1 font-serif text-lg text-brand-black">{t["giftCard.forName"].replace("{name}", revealed.recipientName)}</p>

            {revealed.type === "product" && (
              <div className="mt-6">
                <p className="mb-3 text-sm text-neutral-600">{t["giftCard.typeProductLabel"]}</p>
                <div className="mx-auto flex max-w-xs items-center gap-3 rounded-md border border-brand-black/10 bg-white p-3 text-left">
                  {revealed.product.image && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-100">
                      <Image
                        src={revealed.product.image}
                        alt={revealed.product.name}
                        fill
                        unoptimized
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm text-brand-black">{revealed.product.name}</p>
                    {revealed.product.price != null && (
                      <p className="text-xs text-neutral-400 line-through">${revealed.product.price.toFixed(2)}</p>
                    )}
                    <p className="text-sm font-medium text-brand-red">$0.00</p>
                  </div>
                </div>

                {revealed.product.stock != null && revealed.product.stock <= 0 ? (
                  <p className="mt-4 text-sm text-neutral-500">{t["product.outOfStock"]}</p>
                ) : added ? (
                  <button
                    onClick={() => router.push("/panier")}
                    className="mt-6 w-full rounded border border-brand-black py-3 text-sm uppercase tracking-widest text-brand-black hover:bg-brand-black hover:text-white"
                  >
                    {t["cart.checkout"]}
                  </button>
                ) : (
                  <button
                    onClick={addFreeProduct}
                    className="mt-6 w-full bg-brand-black py-3 text-sm uppercase tracking-widest text-white hover:opacity-90"
                  >
                    {t["giftCard.useOnProduct"]}
                  </button>
                )}
              </div>
            )}

            {revealed.type === "discount" && (
              <div className="mt-6">
                <p className="font-serif text-2xl text-brand-black">
                  {t["giftCard.typeDiscountLabel"].replace("{percent}", String(revealed.discountPercent))}
                </p>
                <button
                  onClick={goRedeemAtCheckout}
                  className="mt-6 w-full bg-brand-black py-3 text-sm uppercase tracking-widest text-white hover:opacity-90"
                >
                  {t["giftCard.useOnCheckout"]}
                </button>
              </div>
            )}

            {revealed.type === "credit" && (
              <div className="mt-6">
                <p className="font-serif text-2xl text-brand-black">
                  {t["giftCard.typeCreditLabel"].replace("{amount}", revealed.creditAmount.toFixed(2))}
                </p>
                <button
                  onClick={goRedeemAtCheckout}
                  className="mt-6 w-full bg-brand-black py-3 text-sm uppercase tracking-widest text-white hover:opacity-90"
                >
                  {t["giftCard.useOnCheckout"]}
                </button>
              </div>
            )}

            {revealed.message && <p className="mt-6 text-sm italic text-neutral-500">"{revealed.message}"</p>}

            <button
              onClick={tryAnother}
              className="mt-6 text-xs uppercase tracking-wide text-neutral-400 underline underline-offset-2 hover:text-brand-black"
            >
              {t["giftCard.tryAnother"]}
            </button>
          </GiftCardVisual>
        </div>
      )}
    </main>
  );
}
