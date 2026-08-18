"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { setBuyNowItem } from "@/lib/buy-now";
import { ProductGallery } from "./ProductGallery";
import { WishlistButton } from "./WishlistButton";
import { ShareButtons } from "./ShareButtons";
import { Accordion } from "./Accordion";

type VariantDetail = {
  color_label: string | null;
  size_label: string | null;
  stock: number | null;
  price: number | null;
  description: string | null;
  image_url: string | null;
};

function variantLabel(v: { color_label: string | null; size_label: string | null }) {
  if (v.color_label && v.size_label) return `${v.color_label} — ${v.size_label}`;
  return v.color_label || v.size_label || "";
}

function VariantDropdown({
  placeholder,
  options,
  selected,
  disabledOptions,
  onSelect,
}: {
  placeholder: string;
  options: string[];
  selected: string | null;
  disabledOptions: Set<string>;
  onSelect: (v: string) => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  return (
    <details ref={detailsRef} className="group relative mt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between border border-neutral-300 px-4 py-3 text-sm hover:border-brand-black">
        <span className={selected ? "" : "text-neutral-500"}>{selected ?? placeholder}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0 transition-transform group-open:rotate-180">
          <path d="M5 7l5 5 5-5H5z" />
        </svg>
      </summary>
      <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto border border-neutral-300 bg-white shadow-lg">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabledOptions.has(opt)}
            onClick={() => {
              onSelect(opt);
              if (detailsRef.current) detailsRef.current.open = false;
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="w-4 shrink-0">{selected === opt ? "✓" : ""}</span>
            {opt}
          </button>
        ))}
      </div>
    </details>
  );
}

export function ProductDetailInteractive({
  productId,
  slug,
  name,
  images,
  price,
  discountPercent,
  description,
  stock,
  sku,
  baseColor,
  baseSize,
  additionalInfo,
  shippingInfo,
  returnsInfo,
  packagingImageUrl,
  ratingSummary,
  variants,
  colorSiblings,
  brand,
  category,
  waHref,
  callHref,
  instagramHandle,
  t,
}: {
  productId: string;
  slug: string;
  name: string;
  images: { url: string }[];
  price: number | null;
  discountPercent: number | null;
  description: string;
  stock: number | null;
  sku: string | null;
  baseColor: string | null;
  baseSize: string | null;
  additionalInfo: string | null;
  shippingInfo: string | null;
  returnsInfo: string | null;
  packagingImageUrl: string | null;
  ratingSummary: { average: number; count: number } | null;
  variants: VariantDetail[];
  colorSiblings: { id: string; name: string; slug: string; image: string | null; base_color: string | null }[];
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  waHref: string;
  callHref: string;
  instagramHandle: string;
  t: Record<string, string>;
}) {
  const { addItem } = useCart();
  const router = useRouter();

  // The product's own photo/color (e.g. "Yellow") isn't a row in `variants`
  // — it's just what's already showing. Giving it a label here lets it sit
  // in the dropdown as a normal, always-clickable option alongside the real
  // variants, so switching to "Black" and back to "Yellow" is one tap each,
  // not a special "tap the same option again to remove it" gesture.
  const baseLabel = variantLabel({ color_label: baseColor, size_label: baseSize }) || null;

  // Each entry in `variants` is a full version of the product (its own
  // color/size combo, photo, price, stock) — picking one from the dropdown
  // is optional, the base product info shows until something is picked.
  // Only default to the base label when there's an actual dropdown/choice
  // to show (variants.length > 0) — otherwise every product that merely
  // has a base color set (most of them) would get a redundant "— Yellow"
  // appended to its cart/wishlist name despite offering no real variant.
  const [selected, setSelected] = useState<string | null>(variants.length > 0 ? baseLabel : null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const active = selected && selected !== baseLabel ? variants.find((v) => variantLabel(v) === selected) ?? null : null;

  const displayImages = active?.image_url ? [{ url: active.image_url }] : images;

  const hasVariantPrice = active?.price != null;
  const effectivePrice = hasVariantPrice ? active!.price : price;
  const hasPrice = effectivePrice != null;
  // A variant's own price is a flat override — the base product's discount
  // only makes sense against the base price.
  const hasDiscount = !hasVariantPrice && hasPrice && !!discountPercent && discountPercent > 0;
  const finalPrice = hasDiscount ? effectivePrice! * (1 - discountPercent! / 100) : effectivePrice;

  const displayDescription = active?.description ?? description;

  const activeStock = active?.stock ?? stock;
  const outOfStock = activeStock != null && activeStock <= 0;
  const noPrice = finalPrice == null;

  // Switching to a variant with less stock than the quantity already
  // dialed in (e.g. picked 5, then switched to a color with only 2 left)
  // used to leave the quantity stepper past the real limit — "Added ✓"
  // would still flash and the mismatch only ever surfaced much later, as a
  // generic out-of-stock error at the very end of checkout.
  useEffect(() => {
    if (activeStock != null && quantity > activeStock) setQuantity(Math.max(1, activeStock));
  }, [activeStock, quantity]);

  const cartImage = active?.image_url ?? images[0]?.url ?? null;

  function handleAdd() {
    if (finalPrice == null) return;
    addItem(
      { productId, variant: selected, name: selected ? `${name} — ${selected}` : name, price: finalPrice, image: cartImage },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    if (finalPrice == null || outOfStock) return;
    setBuyNowItem({
      productId,
      variant: selected,
      name: selected ? `${name} — ${selected}` : name,
      price: finalPrice,
      image: cartImage,
      quantity,
    });
    router.push("/checkout?buyNow=1");
  }

  const addLabel = added
    ? t["product.added"]
    : noPrice
      ? t["product.priceOnRequest"]
      : outOfStock
        ? t["product.outOfStock"]
        : t["product.addToCart"];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <ProductGallery
          // Remounts the gallery whenever the selected variant's photo
          // changes — without this, its internal "which photo is showing"
          // index survives the swap (it also drifts on its own from the
          // auto-advance carousel), so picking a color could keep showing
          // whatever photo happened to be active instead of that variant's.
          key={active?.image_url ?? "base"}
          images={displayImages}
          alt={name}
          discountPercent={hasDiscount ? discountPercent : null}
          zoomLabel={t["product.zoom"]}
        />

        <nav className="mt-4 text-xs text-neutral-500">
          <Link href="/" className="hover:text-brand-black">
            {t["nav.home"]}
          </Link>
          {category && (
            <>
              {" / "}
              <Link href={`/categorie/${category.slug}`} className="hover:text-brand-black">
                {category.name}
              </Link>
            </>
          )}
        </nav>
      </div>

      <div>
        {brand && (
          <Link href={`/marque/${brand.slug}`} className="text-sm font-medium text-brand-red hover:underline">
            {brand.name}
          </Link>
        )}
        <h1 className="mt-1 font-serif text-2xl">{name}</h1>

        {ratingSummary && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-600">
            <span className="text-amber-500" aria-hidden>
              {"★".repeat(Math.round(ratingSummary.average))}
              {"☆".repeat(5 - Math.round(ratingSummary.average))}
            </span>
            {t["product.ratingSummary"]
              .replace("{rating}", ratingSummary.average.toFixed(1))
              .replace("{count}", String(ratingSummary.count))}
          </p>
        )}

        <p className="mt-3 text-lg">
          {hasPrice ? (
            hasDiscount ? (
              <>
                <span className="mr-2 text-neutral-400 line-through">${effectivePrice!.toFixed(2)}</span>
                <span className="text-brand-red">${finalPrice!.toFixed(2)}</span>
              </>
            ) : (
              `$${finalPrice!.toFixed(2)}`
            )
          ) : (
            <span className="text-neutral-500">{t["product.priceOnRequest"]}</span>
          )}
        </p>

        {displayDescription && (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{displayDescription}</p>
        )}

        <p className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${outOfStock ? "text-neutral-500" : "text-emerald-700"}`}>
          {!outOfStock && (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" />
            </svg>
          )}
          {outOfStock ? t["product.outOfStock"] : t["product.available"]}
        </p>

        {(baseColor || baseSize) && (
          <p className="mt-3 flex flex-wrap gap-x-4 text-sm text-neutral-600">
            {baseColor && (
              <span>
                {t["product.baseColor"]} <span className="font-medium text-brand-black">{baseColor}</span>
              </span>
            )}
            {baseSize && (
              <span>
                {t["product.baseSize"]} <span className="font-medium text-brand-black">{baseSize}</span>
              </span>
            )}
          </p>
        )}

        {colorSiblings.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-neutral-600">{t["product.otherColors"]}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/produit/${slug}`}
                aria-current="true"
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded border-2 border-brand-black"
              >
                {images[0] && <Image src={images[0].url} alt={name} fill unoptimized sizes="56px" className="object-cover" />}
              </Link>
              {colorSiblings.map((c) => (
                <Link
                  key={c.id}
                  href={`/produit/${c.slug}`}
                  title={c.base_color ?? c.name}
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-neutral-300 hover:border-brand-black"
                >
                  {c.image && <Image src={c.image} alt={c.base_color ?? c.name} fill unoptimized sizes="56px" className="object-cover" />}
                </Link>
              ))}
            </div>
          </div>
        )}

        {variants.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-neutral-600">
              {t["product.variantOptional"]}
              {selected && <span className="ml-1 font-medium text-brand-black">{selected}</span>}
            </p>
            <VariantDropdown
              placeholder={t["product.chooseOption"]}
              // The base product's own color/size sits in the list as a
              // normal option too (when set), not just the extra variants
              // — every color the admin adds shows up here the same way,
              // each with its own price/stock/photo already wired below.
              options={[...(baseLabel ? [baseLabel] : []), ...variants.map((v) => variantLabel(v)).filter((l) => l !== baseLabel)]}
              selected={selected}
              disabledOptions={
                new Set([
                  ...(baseLabel && stock != null && stock <= 0 ? [baseLabel] : []),
                  ...variants.filter((v) => v.stock != null && v.stock <= 0).map((v) => variantLabel(v)),
                ])
              }
              // Tapping the already-selected option always reverts to the
              // base state (the base color/size when the product has one,
              // otherwise no selection) — this has to stay true for EVERY
              // product, not just ones without a base color/size, because
              // the on-screen instruction above ("tap again to remove")
              // makes that same promise unconditionally.
              onSelect={(opt) => setSelected((prev) => (prev === opt ? baseLabel : opt))}
            />
          </div>
        )}

        {!noPrice && activeStock != null && activeStock > 0 && activeStock <= 5 && (
          <p className="mt-3 text-sm font-medium text-brand-red">{t["product.onlyLeft"].replace("{count}", String(activeStock))}</p>
        )}

        <div className="mt-4 flex gap-3">
          <div className="flex items-center border border-neutral-300">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-12 w-10 items-center justify-center text-lg text-neutral-600 hover:text-brand-black"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{quantity}</span>
            <button
              type="button"
              disabled={activeStock != null && quantity >= activeStock}
              onClick={() => setQuantity((q) => (activeStock != null ? Math.min(activeStock, q + 1) : q + 1))}
              className="flex h-12 w-10 items-center justify-center text-lg text-neutral-600 hover:text-brand-black disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAdd}
            disabled={outOfStock || noPrice}
            className="flex-1 bg-brand-black py-3 text-center text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:opacity-100"
          >
            {addLabel}
          </button>
        </div>

        {!noPrice && (
          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="mt-3 block w-full border border-brand-black py-3 text-center text-sm uppercase tracking-widest text-brand-black transition-colors hover:bg-brand-black hover:text-white disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-300"
          >
            {t["product.buyNow"]}
          </button>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-neutral-300 py-3 text-center text-xs uppercase tracking-widest text-neutral-700 transition-colors hover:border-brand-black"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
              <path
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t["product.askWhatsapp"]}
          </a>
          <a
            href={callHref}
            className="flex items-center justify-center gap-2 border border-neutral-300 py-3 text-center text-xs uppercase tracking-widest text-neutral-700 transition-colors hover:border-brand-black"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
              <path
                d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t["product.callNow"]}
          </a>
        </div>

        <WishlistButton
          item={{
            productId,
            variant: selected,
            slug,
            // Matches the cart's own naming (see handleAdd) so two
            // wishlisted variants of the same product show up as two
            // distinct, identifiable lines instead of duplicate entries.
            name: selected ? `${name} — ${selected}` : name,
            price: hasPrice ? finalPrice! : null,
            image: cartImage,
            stock: activeStock,
          }}
          className="mt-4 flex items-center gap-2 text-sm text-neutral-600 hover:text-brand-black"
          iconClassName="h-4 w-4"
        />

        {sku && <p className="mt-6 text-xs text-neutral-500">SKU: {sku}</p>}

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-neutral-500">{t["product.share"]}</span>
          <ShareButtons title={name} instagramHandle={instagramHandle} />
        </div>

        <div className="mt-6 border-t border-neutral-200">
          <Accordion title={t["product.description"]}>{description || "—"}</Accordion>
        </div>

        {packagingImageUrl && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide">{t["product.packagingTitle"]}</p>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
              <Image
                src={packagingImageUrl}
                alt={t["product.packagingTitle"]}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className={packagingImageUrl ? "" : "border-t border-neutral-200"}>
          <Accordion title={t["product.additionalInfo"]}>
            {additionalInfo ? (
              <p className="whitespace-pre-line">{additionalInfo}</p>
            ) : (
              <ul className="space-y-1">
                {brand && <li>Brand: {brand.name}</li>}
                {category && <li>Category: {category.name}</li>}
                {variants.length > 0 && <li>Available in: {variants.map((v) => variantLabel(v)).join(", ")}</li>}
              </ul>
            )}
          </Accordion>
          <Accordion title={t["product.returns"]}>
            <p className="whitespace-pre-line">{returnsInfo || t["product.returnsDefault"]}</p>
          </Accordion>
          <Accordion title={t["product.shippingDelivery"]}>
            {shippingInfo ? (
              <p className="whitespace-pre-line">{shippingInfo}</p>
            ) : (
              <>
                <p>{t["product.shippingBeirut"]}</p>
                <p>{t["product.shippingOutside"]}</p>
              </>
            )}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
