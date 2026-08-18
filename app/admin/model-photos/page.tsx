import { createServiceClient } from "@/lib/supabase/server";
import { ModelPhotosGrid } from "./ModelPhotosGrid";
import { AddModelPhotoForm } from "./AddModelPhotoForm";

export default async function ModelPhotosPage() {
  const supabase = createServiceClient();

  const [{ data: photos }, { data: products }] = await Promise.all([
    supabase
      .from("model_photos")
      .select("id, image_url, product:products(name)")
      .order("sort_order", { ascending: true }),
    supabase.from("products").select("id, name").eq("is_active", true).order("name", { ascending: true }),
  ]);

  const rows = (photos ?? []).map((p: any) => ({
    id: p.id,
    image_url: p.image_url,
    productName: (Array.isArray(p.product) ? p.product[0]?.name : p.product?.name) ?? "Deleted product",
  }));

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Photos of models</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Shown as a row on the homepage below the brands, right under "Photos of models" — tap a photo on the
        site to jump straight to the linked product.
      </p>

      <AddModelPhotoForm products={products ?? []} />

      <ModelPhotosGrid photos={rows} />
      {rows.length === 0 && <p className="text-sm text-neutral-500">No photos yet.</p>}
    </div>
  );
}
