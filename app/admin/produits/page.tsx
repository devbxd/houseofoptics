import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { deleteProduct, updateGlobalProductInfo, uploadPackagingImage, removePackagingImage } from "./actions";
import { Pagination } from "@/components/Pagination";
import { getSiteSettings } from "@/lib/settings";
import { SubmitButton } from "@/components/SubmitButton";

const PAGE_SIZE = 30;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = (q ?? "").trim();

  const supabase = createServiceClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("products")
    .select("id, name, price, is_active, discount_percent, category:categories(name), images:product_images(url, sort_order)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("name", `%${search}%`);

  const [{ data: products, count }, settings] = await Promise.all([query, getSiteSettings()]);
  const basePath = search ? `/admin/produits?q=${encodeURIComponent(search)}` : "/admin/produits";

  return (
    <div>
      <div className="mb-8 max-w-lg rounded-md border border-neutral-200 bg-white p-4">
        <p className="mb-1 text-sm font-medium">Additional information &amp; Shipping (all products)</p>
        <p className="mb-3 text-xs text-neutral-500">
          These two apply to every product at once — only the description is set per product, in each product's
          own edit page.
        </p>
        <form action={updateGlobalProductInfo} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Additional information</label>
            <textarea
              name="global_additional_info"
              rows={3}
              defaultValue={settings.global_additional_info}
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Shipping &amp; delivery</label>
            <textarea
              name="global_shipping_info"
              rows={3}
              defaultValue={settings.global_shipping_info}
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Returns</label>
            <textarea
              name="returns_info"
              rows={3}
              defaultValue={settings.returns_info}
              placeholder="Leave empty to use the default returns text"
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Warranty</label>
            <textarea
              name="warranty_info"
              rows={3}
              defaultValue={settings.warranty_info}
              placeholder="Leave empty to use the default warranty text"
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <SubmitButton className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white">
            Save
          </SubmitButton>
        </form>
      </div>

      <div className="mb-8 max-w-lg rounded-md border border-neutral-200 bg-white p-4">
        <p className="mb-1 text-sm font-medium">Packaging photo (all products)</p>
        <p className="mb-3 text-xs text-neutral-500">
          Shown on every product page after the description, as an "Included With Every Pair" section — e.g. a
          photo of the box, pouch and cleaning cloth.
        </p>
        {settings.packaging_image_url && (
          <div className="mb-3 flex items-center gap-3">
            <Image
              src={settings.packaging_image_url}
              alt="Packaging"
              width={96}
              height={96}
              className="h-24 w-24 rounded object-cover"
            />
            <form action={removePackagingImage}>
              <SubmitButton className="text-xs text-neutral-400 hover:text-red-600">Remove</SubmitButton>
            </form>
          </div>
        )}
        <form action={uploadPackagingImage} encType="multipart/form-data" className="flex items-center gap-3">
          <input name="image" type="file" accept="image/*" required className="text-sm" />
          <SubmitButton className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white">
            Upload
          </SubmitButton>
        </form>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-2xl">Products {count != null && <span className="text-sm font-normal text-neutral-400">({count})</span>}</h1>
          <Link
            href="/admin/produits/nouveau"
            className="shrink-0 bg-brand-black px-4 py-2 text-xs uppercase tracking-wide text-white hover:opacity-90 sm:px-5 sm:text-sm"
          >
            New product
          </Link>
        </div>
        <form>
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name..."
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none sm:max-w-xs"
          />
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(products as any[] ?? []).map((p) => {
          const img = (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
          const category = Array.isArray(p.category) ? p.category[0] : p.category;
          return (
            <div key={p.id} className="rounded-md border border-neutral-200 bg-white p-3">
              <div className="relative mb-2 aspect-square overflow-hidden rounded bg-neutral-100">
                {img && <Image src={img.url} alt={p.name} fill sizes="300px" className="object-cover" />}
                {!p.is_active && (
                  <span className="absolute left-2 top-2 rounded bg-neutral-900/80 px-2 py-0.5 text-xs text-white">Hidden</span>
                )}
                {!!p.discount_percent && (
                  <span className="absolute right-2 top-2 rounded-full bg-brand-red px-2 py-0.5 text-xs font-semibold text-white">
                    -{p.discount_percent}%
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-neutral-500">{category?.name ?? "No category"}</p>
              <p className="text-sm text-neutral-700">{p.price != null ? `$${Number(p.price).toFixed(2)}` : "Price to set"}</p>
              <div className="mt-2 flex gap-3 text-sm">
                <Link href={`/admin/produits/${p.id}`} className="text-neutral-600 hover:text-brand-black">
                  Edit
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteProduct(p.id);
                  }}
                >
                  <button className="text-neutral-600 hover:text-red-600">Delete</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath={basePath} />
    </div>
  );
}
