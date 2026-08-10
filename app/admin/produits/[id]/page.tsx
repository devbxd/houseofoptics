import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductForm } from "../ProductForm";
import { ProductImageGrid } from "../ProductImageGrid";
import { RelatedProductsEditor } from "../RelatedProductsEditor";
import { updateProduct } from "../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: product }, { data: categories }, { data: brands }, { data: relatedRows }, { data: allProducts }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*, images:product_images(id, url, sort_order), variants:product_variants(*)")
        .eq("id", id)
        .single(),
      supabase.from("categories").select("id, name, parent_id").order("sort_order"),
      supabase.from("brands").select("id, name").order("sort_order"),
      // product_related_products comes from a migration that may not have
      // run yet — a missing table just yields null data here.
      supabase
        .from("product_related_products")
        .select("id, related_product_id, related:products!product_related_products_related_product_id_fkey(name)")
        .eq("product_id", id)
        .order("sort_order", { ascending: true }),
      supabase.from("products").select("id, name").eq("is_active", true).order("name", { ascending: true }),
    ]);

  if (!product) notFound();

  const relatedPicks = (relatedRows ?? []).map((r: any) => ({
    rowId: r.id,
    productId: r.related_product_id,
    name: (Array.isArray(r.related) ? r.related[0]?.name : r.related?.name) ?? "Deleted product",
  }));

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
        action={updateWithId}
        categories={categories ?? []}
        brands={brands ?? []}
        product={{ ...product, variants }}
        submitLabel="Save"
      />

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
