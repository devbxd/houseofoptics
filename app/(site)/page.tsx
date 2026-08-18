import Link from "next/link";
import Image from "next/image";
import { listProducts } from "@/lib/products";
import { getCategories, getSiteSettings, localizedHeroTitle, localizedHeroEyebrow, localizedHeroSubtitle } from "@/lib/settings";
import { getBrands, getActiveTestimonials, getFeedbackProducts, getModelPhotos, getHeroData, getCategoryPhotoMap } from "@/lib/homepage";
import { NewsletterForm } from "@/components/NewsletterForm";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { FeedbackForm } from "@/components/FeedbackForm";
import { HeroCarousel } from "@/components/HeroCarousel";
import { BrandStrip } from "@/components/BrandStrip";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { ModelPhotosStrip } from "@/components/ModelPhotosStrip";
import { ProductGrid } from "@/components/ProductGrid";
import { getServerDict } from "@/lib/locale-server";

export default async function HomePage() {
  const [heroPool, categories, brands, { locale, t }, testimonials, feedbackProducts, settings, normalizedModelPhotos] =
    await Promise.all([
      listProducts({}, 1, 12),
      getCategories(),
      getBrands(),
      getServerDict(),
      getActiveTestimonials(),
      getFeedbackProducts(),
      getSiteSettings(),
      getModelPhotos(),
    ]);

  const heroTitle = localizedHeroTitle(settings, locale) ?? `${t["home.title1"]}\n${t["home.title2"]}`;
  const heroEyebrow = localizedHeroEyebrow(settings, locale) ?? t["home.eyebrow"];
  const heroSubtitle = localizedHeroSubtitle(settings, locale) ?? t["home.subtitle"];

  // Full-bleed "shop the brand" blocks — one banner photo plus a small
  // product grid per brand — shown lower on the homepage, for whichever
  // brands the client ticks "Featured on homepage" for (Admin > Brands).
  // Capped so ticking many brands can't turn the homepage into an endless
  // page of extra product queries.
  const featuredBrands = (brands ?? []).filter((b: any) => b.featured_on_homepage).slice(0, 6);
  const brandShowcases = (
    await Promise.all(
      featuredBrands.map(async (b: any) => {
        const { products } = await listProducts({ brandSlug: b.slug }, 1, 4);
        return { brand: b, products, banner: b.homepage_banner_url || products[0]?.images[0]?.url || null };
      })
    )
  ).filter((s) => s.banner);

  const topCategories = categories.filter((c) => !c.parent_id && c.slug !== "events");

  // One representative photo per category tile, best quality first per
  // category so the tile isn't stuck with whatever product was added last.
  const { imageById: categoryImageById, countById: categoryCountById } = await getCategoryPhotoMap(
    topCategories.map((c) => c.id)
  );

  // Custom uploaded images (not tied to any product) come first, then
  // manually curated product photos; if the client hasn't picked either,
  // fall back to the sharpest recent product photos.
  const { customHeroImages, manualHeroImages } = await getHeroData();

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
              image: categoryImageById[c.id] ?? null,
              count: categoryCountById[c.id] ?? 0,
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
          <Link
            href={`/marque/${brand.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden bg-neutral-100 sm:mx-auto sm:aspect-[4/3] sm:max-w-4xl"
          >
            <Image
              src={banner!}
              alt={brand.name}
              fill
              quality={90}
              sizes="(min-width: 640px) 896px, 100vw"
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
            {products.length > 0 ? (
              <ProductGrid products={products} t={t} />
            ) : (
              <p className="py-16 text-center text-sm uppercase tracking-widest text-neutral-400">
                {t["home.brandComingSoon"]}
              </p>
            )}
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
