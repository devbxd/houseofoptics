import Link from "next/link";
import Image from "next/image";
import { listProducts } from "@/lib/products";
import { getCategories, getSiteSettings, localizedHeroTitle, localizedHeroEyebrow, localizedHeroSubtitle } from "@/lib/settings";
import { NewsletterForm } from "@/components/NewsletterForm";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { FeedbackForm } from "@/components/FeedbackForm";
import { HeroCarousel } from "@/components/HeroCarousel";
import { BrandStrip } from "@/components/BrandStrip";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { ModelPhotosStrip } from "@/components/ModelPhotosStrip";
import { ProductGrid } from "@/components/ProductGrid";
import { getServerDict } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const [heroPool, categories, { data: brands }, { locale, t }, { data: testimonials }, { data: feedbackProducts }, settings, { data: modelPhotos }] =
    await Promise.all([
      listProducts({}, 1, 12),
      getCategories(),
      supabase.from("brands").select("id, name, slug, logo_url").order("sort_order", { ascending: true }),
      getServerDict(),
      supabase
        .from("testimonials")
        .select("id, author_name, quote, rating, photo_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("products").select("id, name").eq("is_active", true).order("name", { ascending: true }),
      getSiteSettings(),
      supabase
        .from("model_photos")
        .select("id, image_url, product:products(name, slug)")
        .order("sort_order", { ascending: true }),
    ]);

  const heroTitle = localizedHeroTitle(settings, locale) ?? `${t["home.title1"]}\n${t["home.title2"]}`;
  const heroEyebrow = localizedHeroEyebrow(settings, locale) ?? t["home.eyebrow"];
  const heroSubtitle = localizedHeroSubtitle(settings, locale) ?? t["home.subtitle"];

  const normalizedModelPhotos = (modelPhotos ?? []).map((p: any) => ({
    id: p.id,
    image_url: p.image_url,
    product: Array.isArray(p.product) ? p.product[0] ?? null : p.product,
  }));

  // A handful of full-bleed "shop the brand" blocks — one lifestyle image
  // plus a small product grid per brand — shown lower on the homepage.
  // Capped to 4 brands so a small catalog doesn't turn into an endless page.
  const brandShowcases = (
    await Promise.all(
      (brands ?? []).slice(0, 4).map(async (b) => {
        const { products } = await listProducts({ brandSlug: b.slug }, 1, 4);
        return { brand: b, products, banner: products[0]?.images[0]?.url ?? null };
      })
    )
  ).filter((s) => s.products.length > 0 && s.banner);

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
  const categoryCountById = new Map<string, number>();
  for (const row of categoryPhotoRows ?? []) {
    const r = row as any;
    if (!r.category_id) continue;
    categoryCountById.set(r.category_id, (categoryCountById.get(r.category_id) ?? 0) + 1);
    if (categoryImageById.has(r.category_id)) continue;
    const img = (r.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
    if (img) categoryImageById.set(r.category_id, img.url);
  }

  // Custom uploaded images (not tied to any product) come first, then
  // manually curated product photos; if the client hasn't picked either,
  // fall back to the sharpest recent product photos.
  const [{ data: customSlides }, { data: manualHero }] = await Promise.all([
    supabase.from("hero_slides").select("id, image_url, sort_order").order("sort_order", { ascending: true }),
    supabase
      .from("product_images")
      .select("url, sort_order, hero_order, products(name)")
      .eq("is_hero", true)
      .order("hero_order", { ascending: true }),
  ]);

  const customHeroImages = (customSlides ?? []).map((s) => ({ id: s.id, name: "", url: s.image_url }));
  const manualHeroImages =
    manualHero?.map((img: any, i: number) => ({
      id: `${img.url}-${i}`,
      name: img.products?.name ?? "",
      url: img.url,
    })) ?? [];

  const heroImages =
    customHeroImages.length > 0 || manualHeroImages.length > 0
      ? [...customHeroImages, ...manualHeroImages]
      : heroPool.products
          .filter((p) => p.images[0])
          .slice(0, 6)
          .map((p) => ({ id: p.id, name: p.name, url: p.images[0].url }));

  return (
    <main>
      <section className="relative flex h-[85vh] min-h-[560px] items-end overflow-hidden bg-brand-black text-white">
        <HeroCarousel slides={heroImages} />
        <div className="relative z-10 w-full px-6 pb-16 md:px-16 md:pb-24">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">{heroEyebrow}</p>
          <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-[1.05] tracking-wide md:text-7xl">
            {heroTitle.split("\n").map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-md text-sm text-white/80">{heroSubtitle}</p>
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
          <h2 className="text-center font-serif text-2xl tracking-wide">{t["home.categories"]}</h2>
          <p className="mx-auto mb-8 mt-3 max-w-lg text-center text-sm text-neutral-500 md:mb-10">
            {t["home.categoriesSubtitle"]}
          </p>
          <CategoryCarousel
            categories={topCategories.map((c) => ({
              id: c.id,
              slug: c.slug,
              name: c.name,
              image: categoryImageById.get(c.id) ?? null,
              count: categoryCountById.get(c.id) ?? 0,
            }))}
            shopNowLabel={t["home.shopNow"]}
            productsLabel={t["home.productsCount"]}
          />
        </section>
      )}

      <BrandStrip brands={brands ?? []} title={t["home.shopByBrand"]} />

      <ModelPhotosStrip photos={normalizedModelPhotos} title={t["home.modelPhotos"]} />

      {brandShowcases.map(({ brand, products, banner }) => (
        <section key={brand.id}>
          <Link href={`/marque/${brand.slug}`} className="group relative block h-[70vh] min-h-[420px] overflow-hidden bg-neutral-100">
            <Image
              src={banner!}
              alt={brand.name}
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute bottom-6 left-6 bg-white px-4 py-2 font-serif text-lg tracking-wide text-brand-black md:bottom-10 md:left-10 md:text-2xl">
              {brand.name}
            </span>
          </Link>

          <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
            <div className="mb-8 flex items-center justify-between md:mb-10">
              <h2 className="font-serif text-2xl tracking-wide">{brand.name}</h2>
              <Link href={`/marque/${brand.slug}`} className="text-xs uppercase tracking-[0.2em] text-neutral-600 hover:text-brand-black">
                {t["home.shopCollection"]}
              </Link>
            </div>
            <ProductGrid products={products} t={t} />
          </div>
        </section>
      ))}

      <section className="bg-brand-black px-6 py-16 text-center text-white">
        <h2 className="font-serif text-2xl tracking-wide">{t["home.newArrivals"]}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/70">{t["home.newArrivalsSubtitle"]}</p>
        <Link
          href="/produits"
          className="mt-8 inline-block border border-white px-10 py-3 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-white hover:text-brand-black"
        >
          {t["home.viewAll"]}
        </Link>
      </section>

      <TestimonialsCarousel testimonials={testimonials ?? []} title={t["home.testimonialsTitle"]}>
        <FeedbackForm t={t} products={feedbackProducts ?? []} />
      </TestimonialsCarousel>

      <section className="bg-neutral-100 px-6 py-20 text-center">
        <h2 className="font-serif text-2xl tracking-wide">{t["home.stayInTouch"]}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-neutral-600">{t["home.newsletterText"]}</p>
        <NewsletterForm t={t} />
      </section>
    </main>
  );
}
