import { notFound } from "next/navigation";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductForm } from "../ProductForm";
import { updateProduct, deleteProductImage } from "../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: product }, { data: categories }, { data: brands }] = await Promise.all([
    supabase
      .from("products")
      .select("*, images:product_images(id, url, sort_order), variants:product_variants(label, stock, sort_order)")
      .eq("id", id)
      .single(),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("brands").select("id, name").order("sort_order"),
  ]);

  if (!product) notFound();

  const images = (product.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const variants = (product.variants ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const updateWithId = updateProduct.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Edit product</h1>

      {images.length > 0 && (
        <div className="mb-6 flex max-w-lg flex-wrap gap-3">
          {images.map((img: any) => (
            <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded border border-neutral-200">
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
              <form
                action={async () => {
                  "use server";
                  await deleteProductImage(img.id);
                }}
              >
                <button className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white">✕</button>
              </form>
            </div>
          ))}
        </div>
      )}

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
