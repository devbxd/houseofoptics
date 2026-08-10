import Link from "next/link";
import Image from "next/image";

type ModelPhoto = { id: string; image_url: string; product: { name: string; slug: string } | null };

export function ModelPhotosStrip({ photos, title }: { photos: ModelPhoto[]; title?: string }) {
  const linked = photos.filter((p) => p.product);
  if (linked.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      {title && <h2 className="mb-8 text-center font-serif text-2xl tracking-wide">{title}</h2>}
      <div className="flex gap-4 overflow-x-auto px-1 pb-2">
        {linked.map((p) => (
          <Link
            key={p.id}
            href={`/produit/${p.product!.slug}`}
            className="group relative aspect-[3/4] w-48 shrink-0 overflow-hidden rounded-sm bg-neutral-100 sm:w-56"
          >
            <Image
              src={p.image_url}
              alt={p.product!.name}
              fill
              sizes="224px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-black shadow transition-transform group-hover:scale-110">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M6 18 18 6M9 6h9v9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
