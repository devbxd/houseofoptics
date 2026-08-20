"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/lib/locale-client";
import { createClient } from "@/lib/supabase/client";
import { createOrder } from "./actions";
import { getBuyNowItem, clearBuyNowItem, type BuyNowItem } from "@/lib/buy-now";
import { addOrderToHistory } from "@/lib/order-history";
import { validatePromoCode } from "../spin-wheel-actions";
import { useGiftCard } from "@/components/GiftCardProvider";
import { useCustomerAuth } from "@/components/CustomerAuthProvider";

const SHIPPING_COST = { beirut: 4, outside_beirut: 6 } as const;
const EXPRESS_WHATSAPP_NUMBER = "96181701556";

type ConfirmedOrder = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  coords: { lat: number; lng: number } | null;
  paymentMethod: "card" | "cod";
  shippingZone: "beirut" | "outside_beirut";
  shippingCost: number;
  promoCode: string | null;
  discountAmount: number;
  giftCardCode: string | null;
  giftCardAmount: number;
  items: { name: string; variant: string | null; quantity: number; price: number }[];
  subtotal: number;
  total: number;
};

function buildWhatsAppOrderMessage(orderId: string, o: ConfirmedOrder) {
  const itemsText = o.items
    .map(
      (i) =>
        `${i.quantity}x ${i.name}${i.variant ? ` (${i.variant})` : ""} — $${(i.price * i.quantity).toFixed(2)}${
          i.price === 0 ? " (Gift — Free)" : ""
        }`
    )
    .join("\n");
  const mapsLink = o.coords ? `https://www.google.com/maps?q=${o.coords.lat},${o.coords.lng}` : null;

  const lines = [
    `Hi! I just placed an order (#${orderId.slice(0, 8)}) on the website:`,
    "",
    `Name: ${o.name}`,
    `Phone: ${o.phone}`,
    `Email: ${o.email}`,
    `Address: ${o.address}, ${o.city}`,
    mapsLink ? `GPS location: ${mapsLink}` : null,
    "",
    itemsText,
    "",
    `Subtotal: $${o.subtotal.toFixed(2)}`,
    o.promoCode ? `Promo code ${o.promoCode}: -$${o.discountAmount.toFixed(2)}` : null,
    o.giftCardCode
      ? `🎁 Gift card ${o.giftCardCode}${o.giftCardAmount > 0 ? `: -$${o.giftCardAmount.toFixed(2)}` : " (Free item)"}`
      : null,
    `Shipping (${o.shippingZone === "beirut" ? "Beirut" : "Outside Beirut"}): $${o.shippingCost.toFixed(2)}`,
    `Total: $${o.total.toFixed(2)}`,
    `Payment: ${o.paymentMethod === "cod" ? "Cash on delivery" : "Card"}`,
  ];

  return lines.filter((l) => l !== null).join("\n");
}

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const { t } = useLocale();
  const { giftCard, clearGiftCard, refreshGiftCard } = useGiftCard();

  const [buyNowItem, setBuyNowItemState] = useState<BuyNowItem | null>(null);
  const [buyNowChecked, setBuyNowChecked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("buyNow") === "1") {
      setBuyNowItemState(getBuyNowItem());
    }
    setBuyNowChecked(true);
  }, []);

  const items = buyNowItem ? [buyNowItem] : cart.items;
  const subtotal = buyNowItem ? buyNowItem.price * buyNowItem.quantity : cart.subtotal;
  const totalQuantity = items.reduce((a, i) => a + i.quantity, 0);
  const { user, name: customerName, loading: authLoading } = useCustomerAuth();

  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [shippingZone, setShippingZone] = useState<"beirut" | "outside_beirut">("beirut");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedSnapshot, setConfirmedSnapshot] = useState<ConfirmedOrder | null>(null);
  const [ownerWhatsapp, setOwnerWhatsapp] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("site_settings")
      .select("whatsapp_number")
      .single()
      .then(({ data }) => setOwnerWhatsapp(data?.whatsapp_number || null));
  }, []);

  // Ordering more than one item at once requires an account — waits for
  // both the cart and the auth check to be settled first so this can't
  // fire on the brief "don't know yet" state and bounce someone who's
  // actually already logged in.
  useEffect(() => {
    if (!buyNowChecked || authLoading || confirmedOrderId) return;
    if (totalQuantity > 1 && !user) {
      router.replace(`/compte/connexion?next=${encodeURIComponent("/checkout")}`);
    }
  }, [buyNowChecked, authLoading, user, totalQuantity, confirmedOrderId, router]);

  // Prefills from the account instead of asking a logged-in customer to
  // retype what's already on file — only fills fields still empty, so it
  // never clobbers something they've already started typing.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || customerName || "",
      email: f.email || user.email || "",
    }));
  }, [user, customerName]);

  // Re-checks against the database on arrival rather than trusting
  // whatever GiftCardProvider last fetched (possibly on a much earlier
  // page load) — it could have been redeemed elsewhere (another tab,
  // another device) since then. Still just a refresh of the displayed
  // preview; the actual claim happens atomically inside createOrder below
  // regardless of what's shown here.
  useEffect(() => {
    refreshGiftCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A "free item" gift card is tied to one specific cart line, not the
  // order as a whole — if the customer removes that line from their cart
  // (changed their mind, or was just browsing), the applied indicator
  // needs to disappear too, otherwise checkout would still try to claim
  // the code for a gift they no longer have in their cart.
  useEffect(() => {
    if (giftCard?.valid && giftCard.type === "product") {
      const stillPresent = items.some((i) => i.productId === giftCard.product.id && i.price === 0);
      if (!stillPresent) clearGiftCard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, giftCard]);

  const shippingCost = SHIPPING_COST[shippingZone];
  const discountAmount = appliedPromo ? subtotal * (appliedPromo.discountPercent / 100) : 0;
  const giftCardDiscountAmount =
    giftCard?.valid && giftCard.type === "discount" ? subtotal * (giftCard.discountPercent / 100) : 0;
  const giftCardCreditAmount =
    giftCard?.valid && giftCard.type === "credit" ? Math.min(giftCard.creditAmount, subtotal + shippingCost) : 0;
  const total = Math.max(0, subtotal - discountAmount - giftCardDiscountAmount - giftCardCreditAmount + shippingCost);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function applyPromoCode() {
    if (!promoInput.trim()) return;
    setPromoChecking(true);
    setPromoError(null);
    try {
      const res = await validatePromoCode(promoInput);
      if (res.valid && res.discountPercent != null) {
        setAppliedPromo({ code: promoInput.trim().toUpperCase(), discountPercent: res.discountPercent });
      } else {
        setAppliedPromo(null);
        setPromoError(t["checkout.promoInvalid"]);
      }
    } catch {
      setPromoError(t["checkout.genericError"]);
    } finally {
      setPromoChecking(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError(t["checkout.geoUnavailable"]);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setForm((f) => ({ ...f, address: data.address || f.address, city: data.city || f.city }));
        } catch {
          // reverse geocoding failed silently — user can still fill address manually
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError(t["checkout.geoError"]);
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // The gift card is only ever actually consumed by createOrder below —
    // nothing before this point touches the database — but that's not
    // obvious just from seeing "applied ✓" on screen, so this is the one
    // explicit, unmistakable "yes, use it now" moment before it happens.
    if (giftCard?.valid) {
      const confirmMessage =
        giftCard.type === "credit" ? t["checkout.giftCardConfirmCredit"] : t["checkout.giftCardConfirm"];
      if (!confirm(confirmMessage)) return;
    }
    setSubmitting(true);
    setError(null);
    // Belt-and-braces mirror of the effect above — a product-type gift
    // card only ever gets sent to the server if its free item is still
    // actually in the cart being submitted.
    const giftCardStillClaimable =
      giftCard?.valid &&
      (giftCard.type !== "product" || items.some((i) => i.productId === giftCard.product.id && i.price === 0));
    try {
      const { orderId, giftCardRemainingAmount } = await createOrder({
        ...form,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        paymentMethod,
        shippingZone,
        shippingCost,
        promoCode: appliedPromo?.code ?? null,
        giftCardCode: giftCardStillClaimable && giftCard?.valid ? giftCard.code : null,
        items: items.map((i) => ({
          productId: i.productId,
          variant: i.variant,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
      });
      addOrderToHistory(orderId);
      // A credit gift card with money still on it stays active — refresh
      // from the account so both this page and the site-wide reminder pill
      // pick up the new, lower balance instead of the gift just
      // disappearing or showing a stale amount elsewhere on the site.
      if (giftCardRemainingAmount != null && giftCard) {
        refreshGiftCard();
      } else {
        clearGiftCard();
      }
      setConfirmedOrderId(orderId);
      setConfirmedSnapshot({
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        coords,
        paymentMethod,
        shippingZone,
        shippingCost,
        promoCode: appliedPromo?.code ?? null,
        discountAmount,
        giftCardCode: giftCardStillClaimable && giftCard?.valid ? giftCard.code : null,
        giftCardAmount: giftCardDiscountAmount + giftCardCreditAmount,
        items: items.map((i) => ({ name: i.name, variant: i.variant, quantity: i.quantity, price: i.price })),
        subtotal,
        total,
      });
      if (buyNowItem) {
        clearBuyNowItem();
      } else {
        cart.clear();
      }
    } catch (err) {
      if (err instanceof Error && err.message === "GIFT_CARD_INVALID") {
        clearGiftCard();
      }
      if (err instanceof Error && err.message === "ACCOUNT_REQUIRED") {
        router.replace(`/compte/connexion?next=${encodeURIComponent("/checkout")}`);
        return;
      }
      setError(
        err instanceof Error && err.message === "OUT_OF_STOCK"
          ? t["checkout.outOfStockError"]
          : err instanceof Error && err.message === "GIFT_CARD_INVALID"
            ? t["checkout.giftCardInvalid"]
            : t["checkout.genericError"]
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (buyNowChecked && items.length === 0 && !confirmedOrderId) {
    router.replace("/panier");
    return null;
  }

  if (confirmedOrderId) {
    return (
      <main className="bg-brand-beige px-4 py-20 text-center">
        <div className="mx-auto max-w-lg">
        <h1 className="font-serif text-2xl">{t["checkout.orderConfirmedTitle"]}</h1>
        <p className="mt-4 text-sm text-neutral-600">
          {t["checkout.reference"]} : <span className="font-mono">{confirmedOrderId.slice(0, 8)}</span>
        </p>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          {paymentMethod === "cod" ? t["checkout.codMessage"] : t["checkout.confirmedMessage"]}
        </p>

        {ownerWhatsapp && confirmedSnapshot && (
          <a
            href={`https://wa.me/${ownerWhatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
              buildWhatsAppOrderMessage(confirmedOrderId, confirmedSnapshot)
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 block w-full bg-green-600 py-3 text-center text-sm uppercase tracking-widest text-white hover:opacity-90"
          >
            {t["checkout.sendWhatsappToo"]}
          </a>
        )}
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-beige px-4 py-12">
      <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 font-serif text-2xl">{t["checkout.title"]}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">{t["checkout.fullName"]}</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">{t["checkout.email"]}</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">{t["checkout.phone"]}</label>
          <input
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="block text-sm text-neutral-600">{t["checkout.location"]}</label>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="text-sm font-bold uppercase tracking-wide text-brand-black underline underline-offset-2 hover:text-brand-red disabled:opacity-50"
          >
            {locating ? t["checkout.locating"] : t["checkout.useMyLocation"]}
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">{t["checkout.address"]}</label>
          <input
            required
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">{t["checkout.city"]}</label>
          <input
            required
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-neutral-600">{t["checkout.shipping"]}</label>
          <div className="space-y-2">
            {(
              [
                { value: "beirut", label: t["checkout.beirut"], cost: SHIPPING_COST.beirut },
                { value: "outside_beirut", label: t["checkout.outsideBeirut"], cost: SHIPPING_COST.outside_beirut },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center justify-between border px-4 py-3 text-sm ${
                  shippingZone === opt.value ? "border-brand-black" : "border-neutral-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shippingZone"
                    checked={shippingZone === opt.value}
                    onChange={() => setShippingZone(opt.value)}
                  />
                  {opt.label}
                </span>
                <span>${opt.cost.toFixed(2)}</span>
              </label>
            ))}
          </div>
          <a
            href={`https://wa.me/${EXPRESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(t["checkout.expressMessage"])}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs uppercase tracking-wide text-green-700 hover:underline"
          >
            {t["checkout.expressCta"]}
          </a>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">{t["checkout.promoCode"]}</label>
          {appliedPromo ? (
            <div className="flex items-center justify-between border border-brand-black px-4 py-2.5 text-sm">
              <span>
                {appliedPromo.code} — {t["checkout.promoApplied"].replace("{percent}", String(appliedPromo.discountPercent))}
              </span>
              <button
                type="button"
                onClick={() => {
                  // Leaves the typed code in the input — clearing it too
                  // meant "remove" (meant to un-apply the discount) also
                  // wiped out the code itself, so re-applying the same one
                  // required retyping it from scratch.
                  setAppliedPromo(null);
                }}
                className="text-xs uppercase text-neutral-400 hover:text-red-600"
              >
                {t["cart.remove"]}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="SPIN-XXXXXX"
                className="flex-1 border border-neutral-300 px-3 py-2 text-sm uppercase focus:border-brand-black focus:outline-none"
              />
              <button
                type="button"
                onClick={applyPromoCode}
                disabled={promoChecking || !promoInput.trim()}
                className="shrink-0 border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {promoChecking ? t["checkout.processing"] : t["checkout.promoApply"]}
              </button>
            </div>
          )}
          {promoError && <p className="mt-1 text-xs text-brand-red">{promoError}</p>}
        </div>

        {giftCard?.valid && (
          <div>
            <label className="mb-1 block text-sm text-neutral-600">{t["checkout.giftCardCode"]}</label>
            <div className="flex items-center justify-between border border-brand-black px-4 py-2.5 text-sm">
              <span>
                {giftCard.code} — {t["giftCard.alreadyApplied"]}
              </span>
              <button
                type="button"
                onClick={() => clearGiftCard()}
                className="text-xs uppercase text-neutral-400 hover:text-red-600"
              >
                {t["cart.remove"]}
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{t["checkout.giftCardPendingNote"]}</p>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm text-neutral-600">{t["checkout.payment"]}</label>
          <div className="space-y-2">
            {(
              [
                { value: "card", label: t["checkout.payByCard"] },
                { value: "cod", label: t["checkout.cashOnDelivery"] },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 border px-4 py-3 text-sm ${
                  paymentMethod === opt.value ? "border-brand-black" : "border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-1 border-t border-neutral-200 pt-4">
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <p>{t["cart.subtotal"]}</p>
            <p>${subtotal.toFixed(2)}</p>
          </div>
          {appliedPromo && (
            <div className="flex items-center justify-between text-sm text-brand-red">
              <p>{t["checkout.promoDiscount"]}</p>
              <p>-${discountAmount.toFixed(2)}</p>
            </div>
          )}
          {(giftCardDiscountAmount > 0 || giftCardCreditAmount > 0) && (
            <div className="flex items-center justify-between text-sm text-brand-red">
              <p>{t["checkout.giftCardCredit"]}</p>
              <p>-${(giftCardDiscountAmount + giftCardCreditAmount).toFixed(2)}</p>
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <p>{t["checkout.shipping"]}</p>
            <p>${shippingCost.toFixed(2)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-wide text-neutral-500">{t["checkout.total"]}</p>
            <p className="text-lg">${total.toFixed(2)}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-black py-3 text-center text-sm uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? t["checkout.processing"] : paymentMethod === "cod" ? t["checkout.placeOrder"] : t["checkout.payByCard"]}
        </button>
        {paymentMethod === "card" && (
          <p className="text-center text-xs text-neutral-400">{t["checkout.securePayment"]}</p>
        )}
      </form>
      </div>
    </main>
  );
}
