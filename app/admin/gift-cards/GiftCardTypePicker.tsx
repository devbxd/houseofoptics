"use client";

import { useState } from "react";
import { generateProductGiftCard, generateDiscountGiftCard, generateCreditGiftCard } from "./actions";
import { ProductGiftPicker, type GiftableProduct } from "./ProductGiftPicker";
import { SendGiftCardPanel } from "./SendGiftCardPanel";
import { GiftCardVisual } from "@/components/GiftCardVisual";
import type { GiftCardType } from "@/lib/gift-cards";

const TYPE_OPTIONS: { value: GiftCardType; label: string; emoji: string; activeClass: string }[] = [
  { value: "product", label: "Free Item", emoji: "🎁", activeClass: "bg-brand-black text-white border-brand-black" },
  { value: "discount", label: "Discount", emoji: "🏷️", activeClass: "bg-brand-red text-white border-brand-red" },
  { value: "credit", label: "Store Credit", emoji: "💳", activeClass: "bg-[#0e3b28] text-white border-[#0e3b28]" },
];

export function GiftCardTypePicker({ products }: { products: GiftableProduct[] }) {
  const [type, setType] = useState<GiftCardType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<GiftableProduct | null>(null);
  const [discountPercent, setDiscountPercent] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ code: string; type: GiftCardType; summary: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setType(null);
    setSelectedProduct(null);
    setDiscountPercent("");
    setCreditAmount("");
    setRecipientName("");
    setMessage("");
    setError(null);
    setGenerated(null);
  }

  async function handleGenerate() {
    setError(null);
    setPending(true);
    try {
      if (type === "product") {
        if (!selectedProduct) throw new Error("Pick a product first");
        const { code } = await generateProductGiftCard({ productId: selectedProduct.id, recipientName, message });
        setGenerated({ code, type: "product", summary: selectedProduct.name });
      } else if (type === "discount") {
        const percent = Number(discountPercent);
        const { code } = await generateDiscountGiftCard({ discountPercent: percent, recipientName, message });
        setGenerated({ code, type: "discount", summary: `${percent}% off` });
      } else if (type === "credit") {
        const amount = Number(creditAmount);
        const { code } = await generateCreditGiftCard({ creditAmount: amount, recipientName, message });
        setGenerated({ code, type: "credit", summary: `$${amount.toFixed(2)} credit` });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — try again.");
    } finally {
      setPending(false);
    }
  }

  const canGenerate =
    !pending &&
    recipientName.trim().length > 0 &&
    ((type === "product" && !!selectedProduct) ||
      (type === "discount" && Number(discountPercent) > 0 && Number(discountPercent) <= 100) ||
      (type === "credit" && Number(creditAmount) > 0));

  if (generated) {
    return (
      <div className="max-w-md">
        {/* Deliberately not the browser-history "Back" button at the top of
            every admin page — that goes wherever the admin happened to
            come from (often the Products page), not back to a fresh Gift
            Cards screen. This always lands right here, ready to generate
            another one. */}
        <button
          type="button"
          onClick={reset}
          className="mb-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-black"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Gift Cards
        </button>

        <GiftCardVisual>
          <p className="text-sm text-neutral-600">For {recipientName}</p>
          <p className="mt-1 font-serif text-xl text-brand-black">{generated.summary}</p>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-brand-black/20 bg-white px-4 py-3">
            <span className="font-mono text-lg tracking-widest text-brand-black">{generated.code}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generated.code).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="shrink-0 rounded border border-brand-black px-3 py-1.5 text-xs uppercase tracking-wide text-brand-black hover:bg-brand-black hover:text-white"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          {message && <p className="mt-4 text-sm italic text-neutral-500">"{message}"</p>}
        </GiftCardVisual>

        <SendGiftCardPanel code={generated.code} summary={generated.summary} />

        <button
          type="button"
          onClick={reset}
          className="mt-4 w-full border border-brand-black py-3 text-center text-xs uppercase tracking-wide text-brand-black hover:bg-brand-black hover:text-white"
        >
          Generate another
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        {TYPE_OPTIONS.map((opt) => {
          const active = type === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setType(opt.value);
                setError(null);
              }}
              className={`flex flex-col items-center gap-2 rounded-md border px-4 py-6 text-sm transition-colors ${
                active ? opt.activeClass : "border-neutral-300 text-neutral-600 hover:border-brand-black"
              }`}
            >
              <span className="text-3xl">{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {type && (
        <div className="mt-6 max-w-md space-y-4 rounded-md border border-neutral-200 bg-white p-4">
          {type === "product" && (
            <div>
              <label className="mb-1 block text-sm text-neutral-600">Which product?</label>
              <ProductGiftPicker products={products} selectedId={selectedProduct?.id ?? null} onSelect={setSelectedProduct} />
            </div>
          )}

          {type === "discount" && (
            <div>
              <label className="mb-1 block text-sm text-neutral-600">Discount percentage</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="15"
                  className="w-24 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
                <span className="text-sm text-neutral-500">% off the whole order</span>
              </div>
            </div>
          )}

          {type === "credit" && (
            <div>
              <label className="mb-1 block text-sm text-neutral-600">Credit amount</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">$</span>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="30"
                  className="w-28 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-neutral-600">Recipient's name</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Jad"
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-600">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={!canGenerate}
            onClick={handleGenerate}
            className="w-full bg-brand-black py-3 text-center text-sm uppercase tracking-widest text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {pending ? "Generating..." : "Generate gift card"}
          </button>
        </div>
      )}
    </div>
  );
}
