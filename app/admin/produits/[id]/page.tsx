import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductForm } from "../ProductForm";
import { ProductImageGrid } from "../ProductImageGrid";
import { RelatedProductsEditor } from "../RelatedProductsEditor";
import { ColorLinksEditor } from "../ColorLinksEditor";
import { updateProduct } from "../actions";

// Always fetch fresh from the DB — this page must never show a stale
// quick-add state (or stale product data) from Next's route cache.
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [
    { data: product },
    { data: categories },
    { data: brands },
    { data: relatedRows },
    { data: allProducts },
    { data: categoryLinkRows },
    { data: brandLinkRows },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*, images:product_images(id, url, sort_order), variants:product_variants(*)")
      .eq("id", id)
      .single(),
    supabase.from("categories").select("id, name, slug, parent_id").order("sort_order"),
    supabase.from("brands").select("id, name").order("sort_order"),
    // product_related_products comes from a migration that may not have
    // run yet — a missing table just yields null data here.
    supabase
      .from("product_related_products")
      .select("id, related_product_id, related:products!product_related_products_related_product_id_fkey(name)")
      .eq("product_id", id)
      .order("sort_order", { ascending: true }),
    supabase.from("products").select("id, name").eq("is_active", true).order("name", { ascending: true }),
    // product_category_links/product_brand_links come from a migration that
    // may not have run yet — a missing table just yields null data here.
    supabase
      .from("product_category_links")
      .select("id, added_at, category:categories(id, name, slug)")
      .eq("product_id", id),
    supabase.from("product_brand_links").select("id, added_at, brand:brands(id, name)").eq("product_id", id),
  ]);

  if (!product) notFound();

  const extraCategoryLinks = (categoryLinkRows ?? []).map((r: any) => {
    const cat = Array.isArray(r.category) ? r.category[0] : r.category;
    return { linkId: r.id, categoryId: cat?.id, categoryName: cat?.name ?? "Deleted category", categorySlug: cat?.slug ?? "", addedAt: r.added_at };
  });
  const extraBrandLinks = (brandLinkRows ?? []).map((r: any) => {
    const brand = Array.isArray(r.brand) ? r.brand[0] : r.brand;
    return { linkId: r.id, brandId: brand?.id, brandName: brand?.name ?? "Deleted brand" };
  });

  const relatedPicks = (relatedRows ?? []).map((r: any) => ({
    rowId: r.id,
    productId: r.related_product_id,
    name: (Array.isArray(r.related) ? r.related[0]?.name : r.related?.name) ?? "Deleted product",
  }));

  // color_group_id comes from a migration that may not have run yet — a
  // missing column just means product.color_group_id is undefined here.
  const { data: colorGroupRows } = product.color_group_id
    ? await supabase.from("products").select("id, name").eq("color_group_id", product.color_group_id).neq("id", id)
    : { data: [] as { id: string; name: string }[] };

  const images = (product.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  // Falls back to the older label/kind columns for rows saved before the
  // color_label/size_label migration ran, so nothing already entered is lost.
  const variants = (product.variants ?? [])
    .map((v: any) => ({
      ...v,
      color_label: v.color_label ?? (v.kind === "color" ? v.label : null),
      size_label: v.size_label ?? (v.kind === "size" ? v.label : null),
    }))
    .filter((v: any) => v.color_label || v.size_label)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);
  const updateWithId = updateProduct.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Edit product</h1>

      <ProductImageGrid productId={id} images={images} />

      <ProductForm
        // Forces a remount when navigating client-side from editing one
        // product straight to another — otherwise ProductForm's internal
        // category/variants state (seeded once from `product` on first
        // mount) keeps showing the previous product's values layered over
        // this one's data, risking a save that overwrites the wrong
        // category or variants. Same class of bug as the storefront
        // ProductGallery fix.
        key={id}
        action={updateWithId}
        categories={categories ?? []}
        brands={brands ?? []}
        product={{ ...product, variants }}
        allProducts={allProducts ?? []}
        submitLabel="Save"
        extraCategoryLinks={extraCategoryLinks}
        extraBrandLinks={extraBrandLinks}
      />

      <div className="mt-8 max-w-lg rounded-md border border-neutral-200 bg-white p-4">
        <p className="mb-1 text-sm font-medium">Other colors</p>
        <p className="mb-3 text-xs text-neutral-500">
          Tag other products as different colors of this same model — each keeps its own name, price, stock,
          photos and description. Linking works both ways: this product's page will show a color swatch for
          every product tagged here, and theirs will show this one back.
        </p>
        <ColorLinksEditor productId={id} current={colorGroupRows ?? []} candidates={allProducts ?? []} />
      </div>

      <div className="mt-8 max-w-lg rounded-md border border-neutral-200 bg-white p-4">
        <p className="mb-1 text-sm font-medium">Related sunglasses</p>
        <p className="mb-3 text-xs text-neutral-500">
          Pick specific products to show under "Related products" on this product's page. Leave empty to keep
          showing automatic matches (same category or brand).
        </p>
        <RelatedProductsEditor productId={id} current={relatedPicks} candidates={allProducts ?? []} />
      </div>
    </div>
  );
}
