import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, listProducts } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/settings";
import { ProductActions } from "@/components/ProductActions";
import { ProductGallery } from "@/components/ProductGallery";
import { WishlistButton } from "@/components/WishlistButton";
import { ShareButtons } from "@/components/ShareButtons";
import { Accordion } from "@/components/Accordion";
import { ProductGrid } from "@/components/ProductGrid";
import { getServerDict } from "@/lib/locale-server";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings, { t }] = await Promise.all([getProductBySlug(slug), getSiteSettings(), getServerDict()]);
  if (!product) notFound();

  const orderMessage = `Bonjour, je suis intéressé(e) par : ${product.name}`;
  const hasPrice = product.price != null;
  const hasDiscount = hasPrice && !!product.discount_percent && product.discount_percent > 0;
  const finalPrice = hasDiscount ? Number(product.price) * (1 - product.discount_percent! / 100) : product.price;
  const outOfStock = product.stock != null && product.stock <= 0;

  const related = product.category
    ? (await listProducts({ categorySlug: product.category.slug }, 1, 9)).products.filter((p) => p.id !== product.id).slice(0, 8)
    : [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <ProductGallery images={product.images} alt={product.name} discountPercent={product.discount_percent} />

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

          <a
            href={settings.whatsapp_number ? whatsappLink(settings.whatsapp_number, orderMessage) : "/contact"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block w-full border border-neutral-300 py-3 text-center text-sm uppercase tracking-widest text-neutral-700 transition-colors hover:border-brand-black"
          >
            {t["product.askWhatsapp"]}
          </a>

          <WishlistButton
            item={{ productId: product.id, slug: product.slug, name: product.name, price: hasPrice ? finalPrice! : null, image: product.images[0]?.url ?? null }}
            className="mt-4 flex items-center gap-2 text-sm text-neutral-600 hover:text-brand-black"
            iconClassName="h-4 w-4"
          />

          {product.sku && <p className="mt-6 text-xs text-neutral-500">SKU: {product.sku}</p>}

          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-neutral-500">{t["product.share"]}</span>
            <ShareButtons title={product.name} />
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

      {related.length > 0 && (
        <section className="mt-16 border-t border-neutral-200 pt-10">
          <h2 className="mb-8 text-center font-serif text-2xl">{t["product.relatedProducts"]}</h2>
          <ProductGrid products={related} t={t} />
        </section>
      )}
    </main>
  );
}
