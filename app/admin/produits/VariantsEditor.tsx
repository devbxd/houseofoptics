"use client";

import { useState } from "react";

type VariantRow = {
  key: string;
  label: string;
  stock: string;
  price: string;
  description: string;
  existingImageUrl: string;
  previewUrl: string | null;
};

type VariantData = {
  label: string;
  stock: number | null;
  price?: number | null;
  description?: string | null;
  image_url?: string | null;
};

function emptyRow(): VariantRow {
  return {
    key: crypto.randomUUID(),
    label: "",
    stock: "",
    price: "",
    description: "",
    existingImageUrl: "",
    previewUrl: null,
  };
}

export function VariantsEditor({ kind, initial }: { kind: "color" | "size"; initial: VariantData[] }) {
  const prefix = kind === "color" ? "variant_color" : "variant_size";
  const [rows, setRows] = useState<VariantRow[]>(
    initial.length > 0
      ? initial.map((v) => ({
          key: crypto.randomUUID(),
          label: v.label,
          stock: v.stock?.toString() ?? "",
          price: v.price?.toString() ?? "",
          description: v.description ?? "",
          existingImageUrl: v.image_url ?? "",
          previewUrl: v.image_url ?? null,
        }))
      : []
  );

  function update(key: string, patch: Partial<VariantRow>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  const label = kind === "color" ? "Color options" : "Size options";
  const addLabel = kind === "color" ? "+ Add color" : "+ Add size";
  const placeholder = kind === "color" ? "e.g. Black" : "e.g. 52mm";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm text-neutral-600">{label} (leave empty if this product has none)</label>
        <button
          type="button"
          onClick={() => setRows((r) => [...r, emptyRow()])}
          className="text-xs uppercase tracking-wide text-brand-red hover:underline"
        >
          {addLabel}
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="space-y-2 border border-neutral-200 p-3">
            <div className="flex gap-2">
              <input
                name={`${prefix}_label`}
                value={row.label}
                onChange={(e) => update(row.key, { label: e.target.value })}
                placeholder={placeholder}
                className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <input
                name={`${prefix}_stock`}
                type="number"
                min={0}
                value={row.stock}
                onChange={(e) => update(row.key, { stock: e.target.value })}
                placeholder="Stock"
                className="w-20 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
              <input
                name={`${prefix}_price`}
                type="number"
                step="0.01"
                value={row.price}
                onChange={(e) => update(row.key, { price: e.target.value })}
                placeholder="Price (optional)"
                className="w-28 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
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
              <div className="shrink-0">
                <input type="hidden" name={`${prefix}_existing_image`} value={row.existingImageUrl} />
                <label className="flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded border border-dashed border-neutral-300 text-center text-[10px] leading-tight text-neutral-400 hover:border-brand-black">
                  {row.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small local preview, next/image's fill sizing isn't worth it here
                    <img src={row.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "Photo"
                  )}
                  <input
                    name={`${prefix}_image`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      update(row.key, { previewUrl: file ? URL.createObjectURL(file) : row.existingImageUrl || null });
                    }}
                  />
                </label>
              </div>
              <textarea
                name={`${prefix}_description`}
                value={row.description}
                onChange={(e) => update(row.key, { description: e.target.value })}
                rows={2}
                placeholder="Description shown when this option is selected (optional)"
                className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
