"use client";

import { useState } from "react";
import { generateProductGiftCard, generateDiscountGiftCard, generateCreditGiftCard } from "./actions";
import { ProductGiftPicker, type GiftableProduct } from "./ProductGiftPicker";
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
      <div className="max-w-md rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-700 p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-widest text-neutral-300">House of Optics — Gift Card</p>
        <p className="mt-3 text-sm text-neutral-200">For {recipientName}</p>
        <p className="mt-1 text-lg font-medium">{generated.summary}</p>
        <div className="mt-4 flex items-center justify-between rounded-md bg-white/10 px-4 py-3">
          <span className="font-mono text-xl tracking-wider">{generated.code}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(generated.code).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="shrink-0 rounded border border-white/30 px-3 py-1 text-xs uppercase tracking-wide hover:bg-white/10"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        {message && <p className="mt-3 text-sm italic text-neutral-300">"{message}"</p>}
        <button
          type="button"
          onClick={reset}
          className="mt-6 w-full rounded border border-white/30 py-2 text-xs uppercase tracking-wide hover:bg-white/10"
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
