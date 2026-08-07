"use client";

import { useState } from "react";

type Variant = { label: string; stock: string };

export function VariantsEditor({ initial }: { initial: { label: string; stock: number | null }[] }) {
  const [rows, setRows] = useState<Variant[]>(
    initial.length > 0 ? initial.map((v) => ({ label: v.label, stock: v.stock?.toString() ?? "" })) : []
  );

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm text-neutral-600">Color options (leave empty if this product has none)</label>
        <button
          type="button"
          onClick={() => setRows((r) => [...r, { label: "", stock: "" }])}
          className="text-xs uppercase tracking-wide text-brand-red hover:underline"
        >
          + Add color
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              name="variant_label"
              value={row.label}
              onChange={(e) =>
                setRows((r) => r.map((row2, i2) => (i2 === i ? { ...row2, label: e.target.value } : row2)))
              }
              placeholder="e.g. Black"
              className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
            <input
              name="variant_stock"
              type="number"
              min={0}
              value={row.stock}
              onChange={(e) =>
                setRows((r) => r.map((row2, i2) => (i2 === i ? { ...row2, stock: e.target.value } : row2)))
              }
              placeholder="Stock"
              className="w-24 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((_, i2) => i2 !== i))}
              className="px-2 text-neutral-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
