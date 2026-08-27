import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/lib/products";
import { WishlistButton } from "./WishlistButton";
import { AddToCartButton } from "./AddToCartButton";

// The single product card used everywhere a product is shown as a tile —
// grids (ProductGrid) and horizontal auto-scrolling rows (ProductCarousel)
// alike — so every listing on the site looks and behaves the same way.
export function ProductCardTile({
  product: p,
  t,
  style,
  reveal = false,
}: {
  product: ProductCard;
  t: Record<string, string>;
  style?: React.CSSProperties;
  // Opt-in: only set this when the card is rendered inside a <ScrollReveal>
  // wrapper (see ProductGrid) — that's what actually flips data-reveal
  // elements visible on scroll. Without a ScrollReveal ancestor watching for
  // it, a data-reveal element just stays invisible forever (see
  // ProductCarousel, which doesn't use ScrollReveal and must leave this off).
  reveal?: boolean;
}) {
  const hasDiscount = !!p.discount_percent && p.discount_percent > 0 && p.price != null;
  const discountedPrice = hasDiscount ? Number(p.price) * (1 - p.discount_percent! / 100) : null;
  // A per-color search result card still opens the same product page —
  // just pre-selected to that color, dropdown still fully usable there.
  const href = p.variantColor ? `/produit/${p.slug}?color=${encodeURIComponent(p.variantColor)}` : `/produit/${p.slug}`;
  const displayName = p.variantColor ? `${p.name} — ${p.variantColor}` : p.name;

  return (
    <Link href={href} className="group" data-reveal={reveal ? true : undefined} style={style}>
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {p.images[0] && (
          <Image
            src={p.images[0].url}
            alt={displayName}
            fill
            // Product photos are already resized/compressed server-side at
            // upload (see lib/process-image.ts) and served from Supabase
            // with a long cache lifetime — routing them through Next's
            // image optimizer too just adds a redundant fetch+resize hop
            // (and extra Supabase egress) on every first view.
            unoptimized
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {p.category && (
          <span className="absolute left-3 top-3 bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-wide text-neutral-700">
            {p.category.name}
          </span>
        )}
        {hasDiscount && (
          <span className="absolute right-3 top-3 rounded-full bg-brand-red px-2.5 py-1 text-[11px] font-semibold text-white shadow">
            -{p.discount_percent}%
          </span>
        )}
        <WishlistButton
          item={{ productId: p.id, variant: p.variantColor ?? null, slug: p.slug, name: displayName, price: p.price, image: p.images[0]?.url ?? null, stock: p.stock }}
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow transition-colors hover:text-brand-red"
          iconClassName="h-4 w-4"
        />
      </div>
      <div className="mt-3 text-center">
        <p className="text-sm text-neutral-800 group-hover:text-brand-red">{displayName}</p>
        {hasDiscount ? (
          <p className="mt-1 space-x-2 text-sm">
            <span className="text-neutral-400 line-through">${Number(p.price).toFixed(2)}</span>
            <span className="font-medium text-brand-red">${discountedPrice!.toFixed(2)}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">
            {p.price != null ? `$${Number(p.price).toFixed(2)}` : t["product.priceOnRequest"]}
          </p>
        )}
      </div>
      <AddToCartButton
        product={{
          id: p.id,
          name: displayName,
          price: hasDiscount ? discountedPrice : p.price,
          stock: p.stock,
          image: p.images[0]?.url ?? null,
          variant: p.variantColor ?? null,
        }}
        t={t}
        className="mt-2 block w-full border border-neutral-300 py-2 text-center text-[11px] uppercase tracking-wide text-neutral-700 transition-colors hover:border-brand-black hover:bg-brand-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      />
    </Link>
  );
}
