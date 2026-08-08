import Link from "next/link";
import Image from "next/image";

type Brand = { id: string; name: string; slug: string; logo_url?: string | null };

export function BrandStrip({ brands, title }: { brands: Brand[]; title?: string }) {
  // Logo-only strip — a brand without a logo yet just doesn't show here
  // rather than falling back to its name, so the client sees exactly the
  // "wall of logos" look they asked for once they've uploaded one.
  const withLogo = brands.filter((b) => b.logo_url);
  if (withLogo.length === 0) return null;

  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-10">
      {title && <h2 className="mb-8 text-center text-xs uppercase tracking-[0.35em] text-neutral-500">{title}</h2>}
      <div className="flex gap-x-10 gap-y-6 overflow-x-auto px-6 sm:flex-wrap sm:justify-center sm:overflow-visible">
        {withLogo.map((b) => (
          <Link
            key={b.id}
            href={`/marque/${b.slug}`}
            aria-label={b.name}
            className="relative h-14 w-28 shrink-0 grayscale transition-all hover:grayscale-0"
          >
            <Image src={b.logo_url!} alt={b.name} fill sizes="112px" className="object-contain" />
          </Link>
        ))}
      </div>
    </section>
  );
}
