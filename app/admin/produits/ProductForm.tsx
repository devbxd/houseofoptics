import { SubmitButton } from "@/components/SubmitButton";
import { VariantsEditor } from "./VariantsEditor";

type Category = { id: string; name: string };

type Product = {
  id?: string;
  name: string;
  description: string;
  price: number | null;
  discount_percent?: number | null;
  stock?: number | null;
  category_id: string | null;
  is_active?: boolean;
  variants?: { label: string; stock: number | null }[];
};

export function ProductForm({
  action,
  categories,
  product,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  categories: Category[];
  product?: Product;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm text-neutral-600">Product name</label>
        <input
          name="name"
          required
          defaultValue={product?.name}
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">Category</label>
        <select
          name="category_id"
          defaultValue={product?.category_id ?? ""}
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Price (USD, leave empty if not set yet)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={product?.price ?? ""}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Discount %</label>
          <input
            name="discount_percent"
            type="number"
            min={0}
            max={95}
            defaultValue={product?.discount_percent ?? ""}
            placeholder="e.g. 50"
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">
          Stock (only used if this product has no color options below)
        </label>
        <input
          name="stock"
          type="number"
          min={0}
          defaultValue={product?.stock ?? ""}
          placeholder="Leave empty for unlimited"
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </div>

      <VariantsEditor initial={product?.variants ?? []} />

      <div>
        <label className="mb-1 block text-sm text-neutral-600">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description}
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">
          {product ? "Add more photos" : "Photos"}
        </label>
        <input name="images" type="file" accept="image/*" multiple className="w-full text-sm" />
      </div>

      {product && (
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input type="checkbox" name="is_active" defaultChecked={product.is_active ?? true} />
          Visible on the site
        </label>
      )}

      <SubmitButton className="bg-brand-black px-6 py-2.5 text-sm uppercase tracking-wide text-white hover:opacity-90">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
