import { createServiceClient } from "@/lib/supabase/server";
import { BulkPhotoUploader } from "./BulkPhotoUploader";

export default async function BulkPhotosPage() {
  const supabase = createServiceClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku, images:product_images(url, sort_order)")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const pickerProducts = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    image:
      (p.images ?? []).slice().sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0]
        ?.url ?? null,
  }));

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Bulk Photo Upload</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Pick all your photos at once, then match each one to a product with a quick search — no need to open each
        product's page one by one. Photos are added to that product's existing photos, nothing gets replaced.
      </p>

      <BulkPhotoUploader products={pickerProducts} />
    </div>
  );
}
