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
      .select("*, images:product_images(id, url, sort_order), variants:product_variants(label, stock, sort_order)")
      .eq("id", id)
      .single(),
    supabase.from("categories").select("id, name, parent_id").order("sort_order"),
    supabase.from("brands").select("id, name").order("sort_order"),
  ]);

  if (!product) notFound();

  const images = (product.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const variants = (product.variants ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
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
