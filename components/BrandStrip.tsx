import Link from "next/link";
import Image from "next/image";

type Brand = { id: string; name: string; slug: string; logo_url?: string | null };

export function BrandStrip({ brands, title }: { brands: Brand[]; title?: string }) {
  if (brands.length === 0) return null;

  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-10">
      {title && <h2 className="mb-8 text-center text-xs uppercase tracking-[0.35em] text-neutral-500">{title}</h2>}
      <div className="flex gap-x-10 gap-y-6 overflow-x-auto px-6 sm:flex-wrap sm:justify-center sm:overflow-visible">
        {brands.map((b) =>
          b.logo_url ? (
            <Link key={b.id} href={`/marque/${b.slug}`} className="relative h-14 w-28 shrink-0 grayscale transition-all hover:grayscale-0">
              <Image src={b.logo_url} alt={b.name} fill sizes="112px" className="object-contain" />
            </Link>
          ) : (
            <Link
              key={b.id}
              href={`/marque/${b.slug}`}
              className="shrink-0 whitespace-nowrap font-serif text-2xl italic tracking-wide text-neutral-500 transition-colors hover:text-brand-black md:text-3xl"
            >
              {b.name}
            </Link>
          )
        )}
      </div>
    </section>
  );
}
