import Link from "next/link";
import Image from "next/image";
import type { BrandCard } from "@/lib/homepage";

export function BrandGrid({
  brands,
  shopNowLabel,
  productsLabel,
}: {
  brands: BrandCard[];
  shopNowLabel: string;
  productsLabel: string;
}) {
  if (brands.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {brands.map((b) => (
        <Link
          key={b.id}
          href={`/marque/${b.slug}`}
          className="group relative aspect-[4/5] overflow-hidden rounded-sm bg-neutral-100"
        >
          {b.image ? (
            <Image
              src={b.image}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-200" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-center text-white">
            <p className="font-serif text-lg tracking-wide">{b.name}</p>
            <span className="mt-2 inline-block border border-white px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors group-hover:bg-white group-hover:text-brand-black">
              {shopNowLabel}
            </span>
            <p className="mt-2 text-xs italic text-white/80">
              {b.count} {productsLabel}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
