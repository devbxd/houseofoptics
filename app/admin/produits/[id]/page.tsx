import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductForm } from "../ProductForm";
import { ProductImageGrid } from "../ProductImageGrid";
import { updateProduct } from "../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: product }, { data: categories }, { data: brands }] = await Promise.all([
    supabase
      .from("products")
      .select("*, images:product_images(id, url, sort_order), variants:product_variants(*)")
      .eq("id", id)
      .single(),
    supabase.from("categories").select("id, name, parent_id").order("sort_order"),
    supabase.from("brands").select("id, name").order("sort_order"),
  ]);

  if (!product) notFound();

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
    </div>
  );
}
