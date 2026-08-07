import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/settings";
import { ProductActions } from "@/components/ProductActions";
import { getServerDict } from "@/lib/locale-server";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings, { t }] = await Promise.all([getProductBySlug(slug), getSiteSettings(), getServerDict()]);
  if (!product) notFound();

  const orderMessage = `Bonjour, je suis intéressé(e) par : ${product.name}`;
  const hasPrice = product.price != null;
  const hasDiscount = hasPrice && !!product.discount_percent && product.discount_percent > 0;
  const finalPrice = hasDiscount ? Number(product.price) * (1 - product.discount_percent! / 100) : product.price;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          {product.images.length > 0 ? (
            product.images.map((img: { url: string }, i: number) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-neutral-100">
                <Image src={img.url} alt={product.name} fill quality={95} sizes="50vw" className="object-cover" priority={i === 0} />
              </div>
            ))
          ) : (
            <div className="aspect-square rounded-md bg-neutral-100" />
          )}
        </div>

        <div>
          {product.category && (
            <p className="text-sm uppercase tracking-wide text-neutral-500">{product.category.name}</p>
          )}
          <h1 className="mt-1 font-serif text-2xl">{product.name}</h1>
          {hasDiscount && (
            <span className="mt-3 inline-block rounded-full bg-brand-red px-3 py-1 text-xs font-semibold text-white">
              -{product.discount_percent}%
            </span>
          )}
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
              t["product.priceOnRequest"]
            )}
          </p>
          {product.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{product.description}</p>
          )}

          {hasPrice && (
            <ProductActions
              productId={product.id}
              name={product.name}
              price={finalPrice!}
              image={product.images[0]?.url ?? null}
              stock={product.stock ?? null}
              variants={product.variants ?? []}
              t={t}
            />
          )}

          <a
            href={settings.whatsapp_number ? whatsappLink(settings.whatsapp_number, orderMessage) : "/contact"}
            target="_blank"
            rel="noopener noreferrer"
            className={`block w-full border py-3 text-center text-sm uppercase tracking-widest transition-colors ${
              hasPrice
                ? "mt-3 border-neutral-300 text-neutral-700 hover:border-brand-black"
                : "mt-8 border-green-600 bg-green-600 text-white hover:opacity-90"
            }`}
          >
            {hasPrice ? t["product.askWhatsapp"] : t["product.orderWhatsapp"]}
          </a>
        </div>
      </div>
    </main>
  );
}
