import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts, getColorSiblings, getProductReviews } from "@/lib/products";
import { getSiteSettings, whatsappLink, phoneLink } from "@/lib/settings";
import { ProductDetailInteractive } from "@/components/ProductDetailInteractive";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductReviews } from "@/components/ProductReviews";
import { getServerDict } from "@/lib/locale-server";

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
  const waHref = settings.whatsapp_number ? whatsappLink(settings.whatsapp_number, orderMessage) : "/contact";
  const callHref = settings.whatsapp_number ? phoneLink(settings.whatsapp_number) : "/contact";

  const [related, colorSiblings, reviews] = await Promise.all([
    getRelatedProducts(product),
    getColorSiblings(product),
    getProductReviews(product.id),
  ]);

  const ratedReviews = (reviews ?? []).filter((r) => r.rating != null);
  const ratingSummary =
    ratedReviews.length > 0
      ? {
          average: ratedReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedReviews.length,
          count: ratedReviews.length,
        }
      : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <ProductDetailInteractive
        productId={product.id}
        slug={product.slug}
        name={product.name}
        images={product.images}
        price={product.price}
        discountPercent={product.discount_percent}
        description={product.description ?? ""}
        stock={product.stock ?? null}
        sku={product.sku ?? null}
        baseColor={product.base_color ?? null}
        baseSize={product.base_size ?? null}
        additionalInfo={product.additional_info ?? null}
        shippingInfo={settings.global_shipping_info || null}
        returnsInfo={settings.returns_info || null}
        packagingImageUrl={product.packaging_image_url || null}
        ratingSummary={ratingSummary}
        variants={product.variants ?? []}
        colorSiblings={colorSiblings}
        brand={product.brand}
        category={product.category}
        waHref={waHref}
        callHref={callHref}
        instagramHandle={settings.instagram_handle}
        t={t}
      />

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
