import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { getSiteSettings, whatsappLink, phoneLink } from "@/lib/settings";
import { ProductActions } from "@/components/ProductActions";
import { ProductGallery } from "@/components/ProductGallery";
import { WishlistButton } from "@/components/WishlistButton";
import { ShareButtons } from "@/components/ShareButtons";
import { Accordion } from "@/components/Accordion";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductReviews } from "@/components/ProductReviews";
import { getServerDict } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const description = product.description?.trim()
    ? product.description.slice(0, 155)
    : `Découvrez ${product.name}${product.brand ? ` par ${product.brand.name}` : ""} chez House of Optics.`;
  const image = product.images[0]?.url;

  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: image ? [image] : undefined },
    twitter: { title: product.name, description, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings, { t }] = await Promise.all([getProductBySlug(slug), getSiteSettings(), getServerDict()]);
  if (!product) notFound();

  const orderMessage = `Bonjour, je suis intéressé(e) par : ${product.name}`;
  const hasPrice = product.price != null;
  const hasDiscount = hasPrice && !!product.discount_percent && product.discount_percent > 0;
  const finalPrice = hasDiscount ? Number(product.price) * (1 - product.discount_percent! / 100) : product.price;
  const outOfStock = product.stock != null && product.stock <= 0;

  const related = await getRelatedProducts(product);

  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("testimonials")
    .select("id, author_name, quote, rating, photo_url")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <ProductGallery
            images={product.images}
            alt={product.name}
            discountPercent={product.discount_percent}
            zoomLabel={t["product.zoom"]}
          />

          <nav className="mt-4 text-xs text-neutral-500">
            <Link href="/" className="hover:text-brand-black">
              {t["nav.home"]}
            </Link>
            {product.category && (
              <>
                {" / "}
                <Link href={`/categorie/${product.category.slug}`} className="hover:text-brand-black">
                  {product.category.name}
                </Link>
              </>
            )}
          </nav>
        </div>

        <div>
          {product.brand && (
            <Link
              href={`/marque/${product.brand.slug}`}
              className="text-sm font-medium text-brand-red hover:underline"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-1 font-serif text-2xl">{product.name}</h1>

          <p className="mt-3 text-lg">
            {hasPrice ? (
              hasDiscount ? (
                <>
                  <span className="mr-2 text-neutral-400 line-through">${Number(product.price).toFixed(2)}</span>
                  <span className="text-brand-red">${finalPrice!.toFixed(2)}</span>
                </>
              ) : (
                `$${Number(product.price).toFixed(2)}`
              )
            ) : (
              <span className="text-neutral-500">{t["product.priceOnRequest"]}</span>
            )}
          </p>

          {product.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{product.description}</p>
          )}

          <p className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${outOfStock ? "text-neutral-500" : "text-emerald-700"}`}>
            {!outOfStock && (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" />
              </svg>
            )}
            {outOfStock ? t["product.outOfStock"] : t["product.available"]}
          </p>

          <ProductActions
            productId={product.id}
            name={product.name}
            price={hasPrice ? finalPrice! : null}
            image={product.images[0]?.url ?? null}
            stock={product.stock ?? null}
            variants={product.variants ?? []}
            t={t}
          />

          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={settings.whatsapp_number ? whatsappLink(settings.whatsapp_number, orderMessage) : "/contact"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-neutral-300 py-3 text-center text-xs uppercase tracking-widest text-neutral-700 transition-colors hover:border-brand-black"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t["product.askWhatsapp"]}
            </a>
            <a
              href={settings.whatsapp_number ? phoneLink(settings.whatsapp_number) : "/contact"}
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
            item={{ productId: product.id, slug: product.slug, name: product.name, price: hasPrice ? finalPrice! : null, image: product.images[0]?.url ?? null }}
            className="mt-4 flex items-center gap-2 text-sm text-neutral-600 hover:text-brand-black"
            iconClassName="h-4 w-4"
          />

          {product.sku && <p className="mt-6 text-xs text-neutral-500">SKU: {product.sku}</p>}

          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-neutral-500">{t["product.share"]}</span>
            <ShareButtons title={product.name} instagramHandle={settings.instagram_handle} />
          </div>

          <div className="mt-6 border-t border-neutral-200">
            <Accordion title={t["product.description"]} defaultOpen>
              {product.description || "—"}
            </Accordion>
            <Accordion title={t["product.additionalInfo"]}>
              <ul className="space-y-1">
                {product.brand && <li>Brand: {product.brand.name}</li>}
                {product.category && <li>Category: {product.category.name}</li>}
                {product.variants && product.variants.length > 0 && (
                  <li>Colors: {product.variants.map((v: { label: string }) => v.label).join(", ")}</li>
                )}
              </ul>
            </Accordion>
            <Accordion title={t["product.shippingDelivery"]}>
              <p>{t["product.shippingBeirut"]}</p>
              <p>{t["product.shippingOutside"]}</p>
            </Accordion>
          </div>
        </div>
      </div>

      <ProductReviews reviews={reviews ?? []} title={t["product.reviews"]} />

      {related.length > 0 && (
        <section className="mt-16 border-t border-neutral-200 pt-10">
          <h2 className="mb-8 text-center font-serif text-2xl">{t["product.relatedProducts"]}</h2>
          <ProductGrid products={related} t={t} />
        </section>
      )}
    </main>
  );
}
