"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { setBuyNowItem } from "@/lib/buy-now";
import { ProductGallery } from "./ProductGallery";
import { WishlistButton } from "./WishlistButton";
import { ShareButtons } from "./ShareButtons";
import { Accordion } from "./Accordion";

type VariantDetail = {
  label: string;
  stock: number | null;
  price: number | null;
  description: string | null;
  image_url: string | null;
};

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
  colorVariants,
  sizeVariants,
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
  colorVariants: VariantDetail[];
  sizeVariants: VariantDetail[];
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  waHref: string;
  callHref: string;
  instagramHandle: string;
  t: Record<string, string>;
}) {
  const { addItem } = useCart();
  const router = useRouter();

  // Color and size are two independent, optional selectors — tapping either
  // again deselects it. Whichever was tapped most recently "wins" when both
  // carry their own photo/price/description, so the last thing the visitor
  // interacted with is what they see reflected.
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [lastKind, setLastKind] = useState<"color" | "size" | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function pickColor(v: string) {
    setSelectedColor((sel) => (sel === v ? null : v));
    setLastKind("color");
  }
  function pickSize(v: string) {
    setSelectedSize((sel) => (sel === v ? null : v));
    setLastKind("size");
  }

  const activeColor = selectedColor ? colorVariants.find((v) => v.label === selectedColor) ?? null : null;
  const activeSize = selectedSize ? sizeVariants.find((v) => v.label === selectedSize) ?? null : null;
  const primary = lastKind === "size" ? activeSize : activeColor;
  const secondary = lastKind === "size" ? activeColor : activeSize;

  const displayImageUrl = primary?.image_url ?? secondary?.image_url ?? null;
  const displayImages = displayImageUrl ? [{ url: displayImageUrl }] : images;

  const variantPrice = primary?.price ?? secondary?.price ?? null;
  const hasVariantPrice = variantPrice != null;
  const effectivePrice = hasVariantPrice ? variantPrice : price;
  const hasPrice = effectivePrice != null;
  // A variant's own price is a flat override — the base product's discount
  // only makes sense against the base price.
  const hasDiscount = !hasVariantPrice && hasPrice && !!discountPercent && discountPercent > 0;
  const finalPrice = hasDiscount ? effectivePrice! * (1 - discountPercent! / 100) : effectivePrice;

  const displayDescription = primary?.description ?? secondary?.description ?? description;

  const activeStock = primary?.stock ?? secondary?.stock ?? stock;
  const outOfStock = activeStock != null && activeStock <= 0;
  const noPrice = finalPrice == null;

  const variantLabel = [selectedColor, selectedSize].filter(Boolean).join(" / ") || null;
  const cartImage = displayImageUrl ?? images[0]?.url ?? null;

  function handleAdd() {
    if (finalPrice == null) return;
    addItem(
      { productId, variant: variantLabel, name: variantLabel ? `${name} — ${variantLabel}` : name, price: finalPrice, image: cartImage },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    if (finalPrice == null || outOfStock) return;
    setBuyNowItem({
      productId,
      variant: variantLabel,
      name: variantLabel ? `${name} — ${variantLabel}` : name,
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
        <ProductGallery images={displayImages} alt={name} discountPercent={hasDiscount ? discountPercent : null} zoomLabel={t["product.zoom"]} />

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

        {colorVariants.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-neutral-600">{t["product.colorOptional"]}</p>
            <div className="flex flex-wrap gap-2">
              {colorVariants.map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => pickColor(v.label)}
                  disabled={v.stock != null && v.stock <= 0}
                  className={`border px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    selectedColor === v.label ? "border-brand-black bg-brand-black text-white" : "border-neutral-300 hover:border-brand-black"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {sizeVariants.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-neutral-600">{t["product.sizeOptional"]}</p>
            <div className="flex flex-wrap gap-2">
              {sizeVariants.map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => pickSize(v.label)}
                  disabled={v.stock != null && v.stock <= 0}
                  className={`border px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    selectedSize === v.label ? "border-brand-black bg-brand-black text-white" : "border-neutral-300 hover:border-brand-black"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
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
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-12 w-10 items-center justify-center text-lg text-neutral-600 hover:text-brand-black"
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
          item={{ productId, slug, name, price: hasPrice ? finalPrice! : null, image: images[0]?.url ?? null }}
          className="mt-4 flex items-center gap-2 text-sm text-neutral-600 hover:text-brand-black"
          iconClassName="h-4 w-4"
        />

        {sku && <p className="mt-6 text-xs text-neutral-500">SKU: {sku}</p>}

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-neutral-500">{t["product.share"]}</span>
          <ShareButtons title={name} instagramHandle={instagramHandle} />
        </div>

        <div className="mt-6 border-t border-neutral-200">
          <Accordion title={t["product.description"]} defaultOpen>
            {description || "—"}
          </Accordion>
          <Accordion title={t["product.additionalInfo"]}>
            <ul className="space-y-1">
              {brand && <li>Brand: {brand.name}</li>}
              {category && <li>Category: {category.name}</li>}
              {colorVariants.length > 0 && <li>Colors: {colorVariants.map((v) => v.label).join(", ")}</li>}
              {sizeVariants.length > 0 && <li>Sizes: {sizeVariants.map((v) => v.label).join(", ")}</li>}
            </ul>
          </Accordion>
          <Accordion title={t["product.shippingDelivery"]}>
            <p>{t["product.shippingBeirut"]}</p>
            <p>{t["product.shippingOutside"]}</p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
