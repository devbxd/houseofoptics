import { createServiceClient } from "@/lib/supabase/server";
import { uploadModelPhoto } from "./actions";
import { ModelPhotosGrid } from "./ModelPhotosGrid";
import { SubmitButton } from "@/components/SubmitButton";

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

      <form
        action={uploadModelPhoto}
        encType="multipart/form-data"
        className="mb-8 max-w-md space-y-3 rounded-md border border-neutral-200 bg-white p-4"
      >
        <p className="text-sm font-medium">Add a photo</p>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Photo</label>
          <input name="image" type="file" accept="image/*" required className="w-full text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Links to product</label>
          <select
            name="product_id"
            required
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          >
            <option value="">Select a product...</option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white">
          Add
        </SubmitButton>
      </form>

      <ModelPhotosGrid photos={rows} />
      {rows.length === 0 && <p className="text-sm text-neutral-500">No photos yet.</p>}
    </div>
  );
}
