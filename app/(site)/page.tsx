import Link from "next/link";
import Image from "next/image";
import { listProducts } from "@/lib/products";
import { getCategories } from "@/lib/settings";
import { NewsletterForm } from "@/components/NewsletterForm";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { HeroCarousel } from "@/components/HeroCarousel";
import { BrandStrip } from "@/components/BrandStrip";
import { getServerDict } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const [heroPool, categories, { data: brands }, { t }, { data: testimonials }] = await Promise.all([
    listProducts({}, 1, 12),
    getCategories(),
    supabase.from("brands").select("id, name, slug, logo_url").order("sort_order", { ascending: true }),
    getServerDict(),
    supabase
      .from("testimonials")
      .select("id, author_name, quote, rating")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const topCategories = categories.filter((c) => !c.parent_id && c.slug !== "events");

  // One representative photo per category tile, best quality first per
  // category so the tile isn't stuck with whatever product was added last.
  const { data: categoryPhotoRows } = topCategories.length
    ? await supabase
        .from("products")
        .select("category_id, images:product_images(url, sort_order)")
        .eq("is_active", true)
        .in(
          "category_id",
          topCategories.map((c) => c.id)
        )
        .order("image_bytes", { ascending: false, nullsFirst: false })
    : { data: [] as any[] };

  const categoryImageById = new Map<string, string>();
  for (const row of categoryPhotoRows ?? []) {
    const r = row as any;
    if (!r.category_id || categoryImageById.has(r.category_id)) continue;
    const img = (r.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
    if (img) categoryImageById.set(r.category_id, img.url);
  }

  // Manually curated hero images take priority; if the client hasn't picked
  // any yet, fall back to the sharpest recent product photos.
  const { data: manualHero } = await supabase
    .from("product_images")
    .select("url, sort_order, hero_order, products(name)")
    .eq("is_hero", true)
    .order("hero_order", { ascending: true });

  const heroImages =
    manualHero && manualHero.length > 0
      ? manualHero.map((img: any, i: number) => ({
          id: `${img.url}-${i}`,
          name: img.products?.name ?? "",
          url: img.url,
        }))
      : heroPool.products
          .filter((p) => p.images[0])
          .slice(0, 6)
          .map((p) => ({ id: p.id, name: p.name, url: p.images[0].url }));

  return (
    <main>
      <section className="relative flex h-[85vh] min-h-[560px] items-end overflow-hidden bg-brand-black text-white">
        <HeroCarousel slides={heroImages} />
        <div className="relative z-10 w-full px-6 pb-16 md:px-16 md:pb-24">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t["home.eyebrow"]}</p>
          <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-[1.05] tracking-wide md:text-7xl">
            {t["home.title1"]}
            <br />
            {t["home.title2"]}
          </h1>
          <p className="mt-5 max-w-md text-sm text-white/80">{t["home.subtitle"]}</p>
          <Link
            href="/produits"
            className="mt-8 inline-block border border-white px-10 py-3.5 text-xs uppercase tracking-[0.25em] transition-colors hover:bg-white hover:text-brand-black"
          >
            {t["home.shopNow"]}
          </Link>
        </div>
      </section>

      {topCategories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <h2 className="mb-8 text-center font-serif text-2xl tracking-wide md:mb-10">{t["home.categories"]}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {topCategories.map((c) => {
              const img = categoryImageById.get(c.id);
              return (
                <Link
                  key={c.id}
                  href={`/categorie/${c.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-sm bg-neutral-100"
                >
                  {img ? (
                    <Image
                      src={img}
                      alt=""
                      fill
                      quality={90}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 transition-opacity group-hover:from-black/70" />
                  <span className="absolute bottom-0 left-0 right-0 p-3 text-center font-serif text-sm tracking-wide text-white md:p-4 md:text-lg">
                    {c.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <BrandStrip brands={brands ?? []} title="Shop by Brand" />

      <section className="bg-brand-black px-6 py-16 text-center text-white">
        <h2 className="font-serif text-2xl tracking-wide">{t["home.newArrivals"]}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
          The full collection, organized and ready to browse.
        </p>
        <Link
          href="/produits"
          className="mt-8 inline-block border border-white px-10 py-3 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-white hover:text-brand-black"
        >
          {t["home.viewAll"]}
        </Link>
      </section>

      <TestimonialsCarousel testimonials={testimonials ?? []} />

      <section className="bg-neutral-100 px-6 py-20 text-center">
        <h2 className="font-serif text-2xl tracking-wide">{t["home.stayInTouch"]}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-neutral-600">{t["home.newsletterText"]}</p>
        <NewsletterForm t={t} />
      </section>
    </main>
  );
}
