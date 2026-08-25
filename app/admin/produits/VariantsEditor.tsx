"use client";

import { useMemo, useRef, useState } from "react";
import { getProductImages } from "./actions";

type VariantRow = {
  key: string;
  color: string;
  size: string;
  stock: string;
  price: string;
  description: string;
  existingImageUrl: string;
  previewUrl: string | null;
};

type VariantData = {
  color_label?: string | null;
  size_label?: string | null;
  stock: number | null;
  price?: number | null;
  description?: string | null;
  image_url?: string | null;
};

function emptyRow(): VariantRow {
  return {
    key: crypto.randomUUID(),
    color: "",
    size: "",
    stock: "",
    price: "",
    description: "",
    existingImageUrl: "",
    previewUrl: null,
  };
}

export function VariantsEditor({
  initial,
  allProducts,
}: {
  initial: VariantData[];
  allProducts: { id: string; name: string }[];
}) {
  const [rows, setRows] = useState<VariantRow[]>(
    initial.length > 0
      ? initial.map((v) => ({
          key: crypto.randomUUID(),
          color: v.color_label ?? "",
          size: v.size_label ?? "",
          stock: v.stock?.toString() ?? "",
          price: v.price?.toString() ?? "",
          description: v.description ?? "",
          existingImageUrl: v.image_url ?? "",
          previewUrl: v.image_url ?? null,
        }))
      : []
  );

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [pickerRowKey, setPickerRowKey] = useState<string | null>(null);
  const [galleryRowKey, setGalleryRowKey] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [galleryProduct, setGalleryProduct] = useState<{ id: string; name: string } | null>(null);
  const [productImages, setProductImages] = useState<string[] | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return allProducts.slice(0, 20);
    return allProducts.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 20);
  }, [allProducts, productQuery]);

  function update(key: string, patch: Partial<VariantRow>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function openGallery(rowKey: string) {
    setPickerRowKey(null);
    setGalleryRowKey(rowKey);
    setGalleryProduct(null);
    setProductImages(null);
    setProductQuery("");
  }

  function closeGallery() {
    setGalleryRowKey(null);
    setGalleryProduct(null);
    setProductImages(null);
  }

  async function pickGalleryProduct(product: { id: string; name: string }) {
    setGalleryProduct(product);
    setLoadingGallery(true);
    const urls = await getProductImages(product.id);
    setProductImages(urls);
    setLoadingGallery(false);
  }

  function chooseFromGallery(url: string) {
    if (!galleryRowKey) return;
    const input = fileInputRefs.current[galleryRowKey];
    if (input) input.value = "";
    update(galleryRowKey, { existingImageUrl: url, previewUrl: url });
    setGalleryRowKey(null);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm text-neutral-600">
          Other versions of this product (leave empty if this product has none)
        </label>
        <button
          type="button"
          onClick={() => setRows((r) => [...r, emptyRow()])}
          className="text-xs uppercase tracking-wide text-brand-red hover:underline"
        >
          + Add version
        </button>
      </div>
      <p className="mb-2 text-xs text-neutral-500">
        Each entry below is a distinct, purchasable version of this product — its own price, stock, photo and
        description. If this product only comes in different colors (no sizes), just fill in Color on each row
        and leave Size blank. If it only comes in different sizes, do the reverse. <strong>If it has both</strong>{" "}
        (e.g. Black in 52mm and 56mm, Red in 52mm and 56mm), fill in <strong>both</strong> Color and Size on every
        row — otherwise that row's own price/description won't be tied to a specific size. Also: don&apos;t
        re-enter the color already set above as &quot;Base color&quot; — that one is the main photo already, it
        doesn&apos;t need its own row here unless you want to give it a different price or description from the
        others.
      </p>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="space-y-2 border border-neutral-200 p-3">
            <div className="flex gap-2">
              <input
                name="variant_color"
                value={row.color}
                onChange={(e) => update(row.key, { color: e.target.value })}
                placeholder="Color (e.g. Black)"
                className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <input
                name="variant_size"
                value={row.size}
                onChange={(e) => update(row.key, { size: e.target.value })}
                placeholder="Size (e.g. 52mm)"
                className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((r2) => r2.key !== row.key))}
                className="px-2 text-neutral-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2">
              <input
                name="variant_stock"
                type="number"
                min={0}
                value={row.stock}
                onChange={(e) => update(row.key, { stock: e.target.value })}
                placeholder="Stock"
                className="w-24 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <input
                name="variant_price"
                type="number"
                step="0.01"
                value={row.price}
                onChange={(e) => update(row.key, { price: e.target.value })}
                placeholder="Price (optional)"
                className="w-32 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <div className="shrink-0">
                <input type="hidden" name="variant_existing_image" value={row.existingImageUrl} />
                <button
                  type="button"
                  onClick={() => setPickerRowKey(row.key)}
                  className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border border-dashed border-neutral-300 text-center text-[10px] leading-tight text-neutral-400 hover:border-brand-black"
                >
                  {row.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small local preview, next/image's fill sizing isn't worth it here
                    <img src={row.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "Photo"
                  )}
                </button>
                <input
                  ref={(el) => {
                    fileInputRefs.current[row.key] = el;
                  }}
                  name="variant_image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    update(row.key, { previewUrl: file ? URL.createObjectURL(file) : row.existingImageUrl || null });
                  }}
                />
              </div>
              <textarea
                name="variant_description"
                value={row.description}
                onChange={(e) => update(row.key, { description: e.target.value })}
                rows={2}
                placeholder="Description shown when this version is selected (optional)"
                className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      {pickerRowKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setPickerRowKey(null)}
        >
          <div className="w-72 rounded-md bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-medium">Choose a photo</p>
            <button
              type="button"
              onClick={() => {
                fileInputRefs.current[pickerRowKey]?.click();
                setPickerRowKey(null);
              }}
              className="mb-2 block w-full border border-neutral-300 px-3 py-2.5 text-left text-sm hover:border-brand-black"
            >
              Upload from device
            </button>
            <button
              type="button"
              onClick={() => openGallery(pickerRowKey)}
              className="block w-full border border-neutral-300 px-3 py-2.5 text-left text-sm hover:border-brand-black"
            >
              Choose from a product's photos on the site
            </button>
            <button
              type="button"
              onClick={() => setPickerRowKey(null)}
              className="mt-3 block w-full text-center text-xs text-neutral-400 hover:text-neutral-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {galleryRowKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeGallery}>
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-md bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">
                {galleryProduct ? `${galleryProduct.name}'s photos` : "Choose a product"}
              </p>
              <button type="button" onClick={closeGallery} className="text-xl leading-none text-neutral-400 hover:text-brand-black">
                ×
              </button>
            </div>

            {!galleryProduct && (
              <div>
                <input
                  type="text"
                  autoFocus
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search a product by name..."
                  className="mb-3 w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
                <ul className="max-h-64 divide-y divide-neutral-100 overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => pickGalleryProduct(p)}
                        className="block w-full px-2 py-2 text-left text-sm hover:bg-neutral-100"
                      >
                        {p.name}
                      </button>
                    </li>
                  ))}
                  {filteredProducts.length === 0 && (
                    <li className="py-2 text-sm text-neutral-500">No products match.</li>
                  )}
                </ul>
              </div>
            )}

            {galleryProduct && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setGalleryProduct(null);
                    setProductImages(null);
                  }}
                  className="mb-3 text-xs uppercase tracking-wide text-neutral-500 hover:text-brand-black"
                >
                  ← Choose a different product
                </button>
                {loadingGallery && <p className="text-sm text-neutral-500">Loading...</p>}
                {!loadingGallery && productImages && productImages.length === 0 && (
                  <p className="text-sm text-neutral-500">This product has no photos yet.</p>
                )}
                {!loadingGallery && productImages && productImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {productImages.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => chooseFromGallery(url)}
                        className="relative aspect-square overflow-hidden rounded border border-neutral-200 hover:border-brand-black"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- small gallery thumbnail, next/image's fill sizing isn't worth it here */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
