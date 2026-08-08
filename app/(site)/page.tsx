import Link from "next/link";
import { listProducts } from "@/lib/products";
import { getCategories } from "@/lib/settings";
import { NewsletterForm } from "@/components/NewsletterForm";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { HeroCarousel } from "@/components/HeroCarousel";
import { getServerDict } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const [heroPool, categories, { data: brands }, { t }, { data: testimonials }] = await Promise.all([
    listProducts({}, 1, 12),
    getCategories(),
    supabase.from("brands").select("id, name, slug").order("sort_order", { ascending: true }),
    getServerDict(),
    supabase
      .from("testimonials")
      .select("id, author_name, quote, rating")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

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

  const topCategories = categories.filter((c) => !c.parent_id);

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
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-10 text-center font-serif text-2xl tracking-wide">{t["home.categories"]}</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {topCategories.map((c) => (
              <Link
                key={c.id}
                href={`/categorie/${c.slug}`}
                className="rounded-full border border-neutral-300 px-6 py-2.5 text-xs uppercase tracking-wide transition-colors hover:border-brand-black hover:bg-brand-black hover:text-white"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {brands && brands.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="mb-10 text-center font-serif text-2xl tracking-wide">Shop by Brand</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/marque/${b.slug}`}
                className="border border-neutral-300 px-6 py-2.5 text-xs uppercase tracking-wide transition-colors hover:border-brand-black hover:bg-brand-black hover:text-white"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}

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
