"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { SubmitButton } from "@/components/SubmitButton";
import { VariantsEditor } from "./VariantsEditor";
import { NewDropToggle } from "./NewDropToggle";

type Category = { id: string; name: string; parent_id?: string | null };
type Brand = { id: string; name: string };

function flattenCategories(categories: Category[]) {
  const childrenOf = (id: string | null) => categories.filter((c) => (c.parent_id ?? null) === id);
  function flatten(parentId: string | null, depth: number): { category: Category; depth: number }[] {
    return childrenOf(parentId).flatMap((c) => [{ category: c, depth }, ...flatten(c.id, depth + 1)]);
  }
  return flatten(null, 0);
}

type Product = {
  id?: string;
  name: string;
  description: string;
  additional_info?: string | null;
  price: number | null;
  discount_percent?: number | null;
  stock?: number | null;
  category_id: string | null;
  brand_id?: string | null;
  sku?: string | null;
  base_color?: string | null;
  base_size?: string | null;
  is_active?: boolean;
  packaging_image_url?: string | null;
  variants?: {
    color_label: string | null;
    size_label: string | null;
    stock: number | null;
    price: number | null;
    description: string | null;
    image_url: string | null;
  }[];
};

export function ProductForm({
  action,
  categories,
  brands,
  product,
  submitLabel,
  allProducts,
  newDropCategory,
}: {
  action: (formData: FormData) => Promise<unknown>;
  categories: Category[];
  brands: Brand[];
  product?: Product;
  submitLabel: string;
  allProducts: { id: string; name: string }[];
  newDropCategory?: { name: string; addedAt: string | null } | null;
}) {
  const flatCategories = flattenCategories(categories);
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  // create() still redirects on success, so this only ever resolves to true
  // for update() — which now stays on the page instead of navigating away.
  // create() still redirects on success, so this counter only ever moves
  // for update() — which now stays on the page instead of navigating away.
  // A counter (not a boolean) so every successful save is a distinct value
  // the effect below can react to, including the 2nd/3rd/... save in the
  // same visit, not just the very first.
  const [saveCount, dispatch] = useActionState(async (prev: number, formData: FormData) => {
    await action(formData);
    return prev + 1;
  }, 0);
  // "Saved ✓" used to stay glued next to the button for the rest of the
  // visit once shown, including after further unsaved edits — looking like
  // confirmation that changes made afterward were saved too, when they
  // weren't. Auto-clears instead, same pattern as the discount row's own
  // save flash (DiscountRow.tsx).
  const [showSaved, setShowSaved] = useState(false);
  useEffect(() => {
    if (saveCount === 0) return;
    setShowSaved(true);
    const timeout = setTimeout(() => setShowSaved(false), 2500);
    return () => clearTimeout(timeout);
  }, [saveCount]);

  return (
    <form action={dispatch} className="max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm text-neutral-600">Product name</label>
        <input
          name="name"
          required
          defaultValue={product?.name}
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Category</label>
          <select
            name="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          >
            <option value="">No category</option>
            {flatCategories.map(({ category: c, depth }) => (
              <option key={c.id} value={c.id}>
                {"—  ".repeat(depth)}
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Brand</label>
          <select
            name="brand_id"
            defaultValue={product?.brand_id ?? ""}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          >
            <option value="">No brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {newDropCategory && product?.id && (
        <NewDropToggle productId={product.id} categoryName={newDropCategory.name} addedAt={newDropCategory.addedAt} />
      )}

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
          Stock (only used if this product has no color/size options below)
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">SKU (optional, shown on the product page)</label>
          <input
            name="sku"
            defaultValue={product?.sku ?? ""}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">
            Base color (the color already shown in the main photos)
          </label>
          <input
            name="base_color"
            defaultValue={product?.base_color ?? ""}
            placeholder="e.g. Black"
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">
          Base size (the size already shown in the main photos)
        </label>
        <input
          name="base_size"
          defaultValue={product?.base_size ?? ""}
          placeholder="e.g. 52mm"
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </div>

      <VariantsEditor initial={product?.variants ?? []} allProducts={allProducts} />

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
        <label className="mb-1 block text-sm text-neutral-600">Additional information (specific to this product)</label>
        <textarea
          name="additional_info"
          rows={3}
          defaultValue={product?.additional_info ?? ""}
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">
          {product ? "Add more photos" : "Photos"}
        </label>
        <input name="images" type="file" accept="image/*" multiple className="w-full text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">Packaging photo (optional)</label>
        <p className="mb-1.5 text-xs text-neutral-500">
          Shown on this product's page after the description, as an "Included With Every Pair" section — e.g. a
          photo of the box, pouch and cleaning cloth.
        </p>
        {product?.packaging_image_url && (
          <div className="mb-2 flex items-center gap-3">
            <Image
              src={product.packaging_image_url}
              alt="Packaging"
              width={80}
              height={80}
              className="h-20 w-20 rounded object-cover"
            />
            <label className="flex items-center gap-1.5 text-xs text-neutral-500">
              <input type="checkbox" name="remove_packaging_image" /> Remove this photo
            </label>
          </div>
        )}
        <input name="packaging_image" type="file" accept="image/*" className="w-full text-sm" />
      </div>

      {product && (
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input type="checkbox" name="is_active" defaultChecked={product.is_active ?? true} />
          Visible on the site
        </label>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton className="bg-brand-black px-6 py-2.5 text-sm uppercase tracking-wide text-white hover:opacity-90">
          {submitLabel}
        </SubmitButton>
        {showSaved && <span className="text-sm text-emerald-700">Saved ✓</span>}
      </div>
    </form>
  );
}
