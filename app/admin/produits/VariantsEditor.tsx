"use client";

import { useMemo, useRef, useState } from "react";
import { getProductImages } from "./actions";

type ColorRow = {
  key: string;
  color: string;
  stock: string;
  price: string;
  description: string;
  // Photos already saved (or just picked from another product's gallery) —
  // ready to submit as-is. Newly chosen local files are kept separately
  // below and only uploaded when the whole form is saved.
  existingImageUrls: string[];
  newFiles: { file: File; previewUrl: string }[];
};

type SizeRow = {
  key: string;
  size: string;
  stock: string;
  price: string;
};

type VariantData = {
  color_label?: string | null;
  size_label?: string | null;
  stock: number | null;
  price?: number | null;
  description?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
};

function emptyColorRow(): ColorRow {
  return { key: crypto.randomUUID(), color: "", stock: "", price: "", description: "", existingImageUrls: [], newFiles: [] };
}

function emptySizeRow(): SizeRow {
  return { key: crypto.randomUUID(), size: "", stock: "", price: "" };
}

export function VariantsEditor({
  initial,
  allProducts,
}: {
  initial: VariantData[];
  allProducts: { id: string; name: string }[];
}) {
  // Rows saved the old way (both color AND size filled on the same row)
  // still submit correctly as-is — they're kept exactly as they were,
  // just not editable as a combined row here anymore. New entries always
  // go into one list or the other.
  const legacyCombinedRows = initial.filter((v) => v.color_label && v.size_label);
  const [removedLegacyIndexes, setRemovedLegacyIndexes] = useState<Set<number>>(new Set());

  const [colorRows, setColorRows] = useState<ColorRow[]>(
    initial
      .filter((v) => v.color_label && !v.size_label)
      .map((v) => ({
        key: crypto.randomUUID(),
        color: v.color_label ?? "",
        stock: v.stock?.toString() ?? "",
        price: v.price?.toString() ?? "",
        description: v.description ?? "",
        // Prefer the real gallery column; fall back to the old single-photo
        // column for rows saved before this page supported more than one.
        existingImageUrls: v.image_urls && v.image_urls.length > 0 ? v.image_urls : v.image_url ? [v.image_url] : [],
        newFiles: [],
      }))
  );
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(
    initial
      .filter((v) => v.size_label && !v.color_label)
      .map((v) => ({
        key: crypto.randomUUID(),
        size: v.size_label ?? "",
        stock: v.stock?.toString() ?? "",
        price: v.price?.toString() ?? "",
      }))
  );

  const newFilesInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
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

  function updateColor(key: string, patch: Partial<ColorRow>) {
    setColorRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }
  function updateSize(key: string, patch: Partial<SizeRow>) {
    setSizeRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
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

  // Adds to the row's photos instead of replacing them — picking several
  // photos (from the device, or from another product's gallery, across as
  // many clicks as needed) is exactly how a color ends up with 15 photos
  // instead of being stuck at one.
  function addFromGallery(url: string) {
    if (!galleryRowKey) return;
    updateColor(galleryRowKey, {
      existingImageUrls: [...(colorRows.find((r) => r.key === galleryRowKey)?.existingImageUrls ?? []), url],
    });
  }

  return (
    <div className="space-y-6">
      {/* Colors */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm text-neutral-600">Colors (leave empty if this product comes in one color only)</label>
          <button
            type="button"
            onClick={() => setColorRows((r) => [...r, emptyColorRow()])}
            className="text-xs uppercase tracking-wide text-brand-red hover:underline"
          >
            + Add color
          </button>
        </div>
        <p className="mb-2 text-xs text-neutral-500">
          One row per color this product comes in. Price and stock are optional — leave them blank if that color
          costs the same and shares stock with the rest; only fill them in for a color that&apos;s priced or
          stocked differently. Add as many photos as you want per color — they replace the main photos when that
          color is picked on the site. Don&apos;t re-enter the color already set above as &quot;Base color&quot; —
          that one is the main photo already.
        </p>

        <div className="space-y-3">
          {colorRows.map((row) => (
            <div key={row.key} className="space-y-2 border border-neutral-200 p-3">
              <div className="flex gap-2">
                <input
                  name="variant_color"
                  value={row.color}
                  onChange={(e) => updateColor(row.key, { color: e.target.value })}
                  placeholder="Color (e.g. Black)"
                  className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
                <input type="hidden" name="variant_size" value="" />
                <button
                  type="button"
                  onClick={() => setColorRows((r) => r.filter((r2) => r2.key !== row.key))}
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
                  onChange={(e) => updateColor(row.key, { stock: e.target.value })}
                  placeholder="Stock (optional)"
                  className="w-32 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
                <input
                  name="variant_price"
                  type="number"
                  step="0.01"
                  value={row.price}
                  onChange={(e) => updateColor(row.key, { price: e.target.value })}
                  placeholder="Price (optional)"
                  className="w-32 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                />
              </div>

              <textarea
                name="variant_description"
                value={row.description}
                onChange={(e) => updateColor(row.key, { description: e.target.value })}
                rows={2}
                placeholder="Description shown for this color (optional)"
                className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />

              {/* Submitted fields for this row's photos — parallel to
                  variant_color/variant_size/etc above, one entry per row,
                  matched up by position in actions.ts. */}
              <input type="hidden" name="variant_row_key" value={row.key} />
              <input type="hidden" name="variant_existing_images" value={JSON.stringify(row.existingImageUrls)} />
              <input type="hidden" name="variant_existing_image" value="" />
              <input
                ref={(el) => {
                  newFilesInputRefs.current[row.key] = el;
                }}
                name={`variant_new_images_${row.key}`}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  updateColor(row.key, {
                    newFiles: [...row.newFiles, ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))],
                  });
                }}
              />
              {/* Kept empty — sizes/legacy rows still submit a real one of
                  these to keep every variant_* field lined up by position;
                  colors' actual photos go through the fields above instead. */}
              <input type="file" name="variant_image" className="hidden" />

              <div>
                <p className="mb-1 text-xs text-neutral-500">
                  Photos ({row.existingImageUrls.length + row.newFiles.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {row.existingImageUrls.map((url, i) => (
                    <div key={url + i} className="group relative h-16 w-16 shrink-0 overflow-hidden rounded border border-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element -- small local preview, next/image's fill sizing isn't worth it here */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          updateColor(row.key, { existingImageUrls: row.existingImageUrls.filter((_, x) => x !== i) })
                        }
                        className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] leading-none text-white opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {row.newFiles.map((f, i) => (
                    <div key={f.previewUrl} className="group relative h-16 w-16 shrink-0 overflow-hidden rounded border border-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element -- small local preview, next/image's fill sizing isn't worth it here */}
                      <img src={f.previewUrl} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => updateColor(row.key, { newFiles: row.newFiles.filter((_, x) => x !== i) })}
                        className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] leading-none text-white opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPickerRowKey(row.key)}
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-dashed border-neutral-300 text-center text-[10px] leading-tight text-neutral-400 hover:border-brand-black"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm text-neutral-600">Sizes (leave empty if this product comes in one size only)</label>
          <button
            type="button"
            onClick={() => setSizeRows((r) => [...r, emptySizeRow()])}
            className="text-xs uppercase tracking-wide text-brand-red hover:underline"
          >
            + Add size
          </button>
        </div>
        <p className="mb-2 text-xs text-neutral-500">
          One row per size — price and stock are optional here too, only set them for a size priced or stocked
          differently from the rest.
        </p>

        <div className="space-y-2">
          {sizeRows.map((row) => (
            <div key={row.key} className="flex gap-2 border border-neutral-200 p-3">
              <input
                name="variant_size"
                value={row.size}
                onChange={(e) => updateSize(row.key, { size: e.target.value })}
                placeholder="Size (e.g. 52mm)"
                className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <input type="hidden" name="variant_color" value="" />
              <input
                name="variant_stock"
                type="number"
                min={0}
                value={row.stock}
                onChange={(e) => updateSize(row.key, { stock: e.target.value })}
                placeholder="Stock (optional)"
                className="w-32 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <input
                name="variant_price"
                type="number"
                step="0.01"
                value={row.price}
                onChange={(e) => updateSize(row.key, { price: e.target.value })}
                placeholder="Price (optional)"
                className="w-32 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <input type="hidden" name="variant_description" value="" />
              <input type="hidden" name="variant_existing_image" value="" />
              <input type="hidden" name="variant_row_key" value={row.key} />
              <input type="hidden" name="variant_existing_images" value="" />
              {/* Keeps this row contributing one entry to every variant_*
                  field name — the save action matches all of them up by
                  position, so every row must line up across every field. */}
              <input type="file" name="variant_image" className="hidden" />
              <button
                type="button"
                onClick={() => setSizeRows((r) => r.filter((r2) => r2.key !== row.key))}
                className="px-2 text-neutral-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rows saved the old combined way, kept read-only so nothing already
          entered is lost — remove one here and re-add it above as a color
          or a size to migrate it. */}
      {legacyCombinedRows.length > 0 && (
        <div>
          <p className="mb-1 text-sm text-neutral-600">Saved combinations (older format)</p>
          <p className="mb-2 text-xs text-neutral-500">
            These rows have both a color and a size set from before this page changed. They still work as-is; to
            change one, remove it and re-add it as a color or a size above.
          </p>
          <div className="space-y-2">
            {legacyCombinedRows
              .map((v, i) => ({ v, i }))
              .filter(({ i }) => !removedLegacyIndexes.has(i))
              .map(({ v, i }) => {
                return (
                  <div key={i} className="flex items-center justify-between border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
                    <span>
                      {v.color_label} — {v.size_label}
                      {v.price != null && <span className="text-neutral-500"> · ${v.price}</span>}
                      {v.stock != null && <span className="text-neutral-500"> · {v.stock} in stock</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRemovedLegacyIndexes((s) => new Set(s).add(i))}
                      className="px-2 text-neutral-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                    <input type="hidden" name="variant_color" value={v.color_label ?? ""} />
                    <input type="hidden" name="variant_size" value={v.size_label ?? ""} />
                    <input type="hidden" name="variant_stock" value={v.stock?.toString() ?? ""} />
                    <input type="hidden" name="variant_price" value={v.price?.toString() ?? ""} />
                    <input type="hidden" name="variant_description" value={v.description ?? ""} />
                    <input type="hidden" name="variant_existing_image" value={v.image_url ?? ""} />
                    <input type="hidden" name="variant_row_key" value={`legacy-${i}`} />
                    <input type="hidden" name="variant_existing_images" value="" />
                    <input type="file" name="variant_image" className="hidden" />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {pickerRowKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setPickerRowKey(null)}
        >
          <div className="w-72 rounded-md bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-medium">Add photos</p>
            <button
              type="button"
              onClick={() => {
                newFilesInputRefs.current[pickerRowKey]?.click();
                setPickerRowKey(null);
              }}
              className="mb-2 block w-full border border-neutral-300 px-3 py-2.5 text-left text-sm hover:border-brand-black"
            >
              Upload from device (pick several at once)
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
                {galleryProduct ? `${galleryProduct.name}'s photos — tap any number of them` : "Choose a product"}
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
                    {productImages.map((url) => {
                      const picked = colorRows.find((r) => r.key === galleryRowKey)?.existingImageUrls.includes(url);
                      return (
                        <button
                          key={url}
                          type="button"
                          onClick={() => addFromGallery(url)}
                          disabled={picked}
                          className={`relative aspect-square overflow-hidden rounded border hover:border-brand-black ${picked ? "border-brand-black" : "border-neutral-200"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- small gallery thumbnail, next/image's fill sizing isn't worth it here */}
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          {picked && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-lg text-white">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={closeGallery}
                  className="mt-3 block w-full bg-brand-black py-2 text-center text-xs uppercase tracking-wide text-white hover:opacity-90"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
