"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { uploadBulkProductPhoto } from "./actions";

type Product = { id: string; name: string; sku: string | null; image: string | null };

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  productId: string | null;
  productName: string | null;
  suggestion: Product | null;
  query: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Only ever a *suggestion* the admin taps to confirm — never applied
// silently — so a coincidental word match can't quietly link a photo to
// the wrong product. Requires a distinctive (4+ letter) word match, or an
// exact SKU match in the filename, to even show up as a suggestion.
function guessProduct(filename: string, products: Product[]): Product | null {
  const norm = normalize(filename);
  if (!norm) return null;

  for (const p of products) {
    if (p.sku && p.sku.trim().length >= 3 && norm.includes(p.sku.toLowerCase())) return p;
  }

  const words = norm.split(" ").filter((w) => w.length >= 4);
  if (words.length === 0) return null;

  let best: { product: Product; score: number } | null = null;
  for (const p of products) {
    const pNorm = p.name.toLowerCase();
    const score = words.filter((w) => pNorm.includes(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { product: p, score };
  }
  return best?.product ?? null;
}

export function BulkPhotoUploader({ products }: { products: Product[] }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assignedCount = queue.filter((q) => q.productId && q.status !== "done").length;
  const doneCount = queue.filter((q) => q.status === "done").length;

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newItems: QueueItem[] = Array.from(files).map((file) => {
      const suggestion = guessProduct(file.name, products);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        productId: null,
        productName: null,
        suggestion,
        query: "",
        status: "pending",
      };
    });
    setQueue((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeItem(id: string) {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((q) => q.id !== id);
    });
  }

  function assign(id: string, product: Product) {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, productId: product.id, productName: product.name, query: "" } : q)));
  }

  function unassign(id: string) {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, productId: null, productName: null } : q)));
  }

  function setQuery(id: string, query: string) {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, query } : q)));
  }

  async function saveAll() {
    setSaving(true);
    setSavedCount(0);
    const targets = queue.filter((q) => q.productId && q.status !== "done");

    for (const item of targets) {
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "uploading" } : q)));
      try {
        const fd = new FormData();
        fd.set("photo", item.file);
        await uploadBulkProductPhoto(item.productId!, fd);
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "done" } : q)));
        setSavedCount((c) => c + 1);
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "error", error: err instanceof Error ? err.message : "Upload failed" } : q
          )
        );
      }
    }
    setSaving(false);
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        id="bulk-photo-input"
      />
      <label
        htmlFor="bulk-photo-input"
        className="flex w-full cursor-pointer items-center justify-center gap-2 border border-dashed border-brand-black/30 bg-white py-8 text-sm text-neutral-600 hover:border-brand-black"
      >
        <span className="text-2xl" aria-hidden>
          📷
        </span>
        Tap to choose photos ({queue.length} selected)
      </label>

      {queue.length > 0 && (
        <div className="mt-6 space-y-3 pb-24">
          {queue.map((item) => (
            <BulkPhotoRow
              key={item.id}
              item={item}
              products={products}
              onRemove={() => removeItem(item.id)}
              onAssign={(p) => assign(item.id, p)}
              onUnassign={() => unassign(item.id)}
              onQueryChange={(q) => setQuery(item.id, q)}
            />
          ))}
        </div>
      )}

      {queue.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">
              {assignedCount + doneCount}/{queue.length} matched
              {doneCount > 0 && ` — ${doneCount} saved ✓`}
            </p>
            <button
              type="button"
              disabled={saving || assignedCount === 0}
              onClick={saveAll}
              className="shrink-0 bg-brand-black px-6 py-3 text-xs uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {saving ? `Saving... (${savedCount})` : `Save all (${assignedCount})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BulkPhotoRow({
  item,
  products,
  onRemove,
  onAssign,
  onUnassign,
  onQueryChange,
}: {
  item: QueueItem;
  products: Product[];
  onRemove: () => void;
  onAssign: (p: Product) => void;
  onUnassign: () => void;
  onQueryChange: (q: string) => void;
}) {
  const matches = useMemo(() => {
    const q = item.query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [item.query, products]);

  return (
    <div className="flex gap-3 rounded-md border border-neutral-200 bg-white p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
        {item.status === "done" && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg text-white">✓</span>
        )}
        {item.status === "uploading" && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">...</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {item.status === "done" ? (
          <p className="text-sm text-neutral-600">
            Saved to <span className="font-medium text-brand-black">{item.productName}</span>
          </p>
        ) : item.productId ? (
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm">
              <span className="text-emerald-700">✓</span> <span className="font-medium">{item.productName}</span>
            </p>
            <button type="button" onClick={onUnassign} className="shrink-0 text-xs text-neutral-400 underline hover:text-brand-black">
              Change
            </button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={item.query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search product name..."
              className="w-full border border-neutral-300 px-2.5 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
            {item.suggestion && !item.query && (
              <button
                type="button"
                onClick={() => onAssign(item.suggestion!)}
                className="mt-1.5 flex items-center gap-1.5 rounded-full border border-brand-black/30 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 hover:border-brand-black"
              >
                Suggested: <span className="font-medium text-brand-black">{item.suggestion.name}</span>
              </button>
            )}
            {matches.length > 0 && (
              <div className="mt-1.5 max-h-40 overflow-y-auto rounded border border-neutral-200">
                {matches.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onAssign(p)}
                    className="block w-full px-2.5 py-2 text-left text-sm hover:bg-neutral-50"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {item.status === "error" && <p className="mt-1 text-xs text-red-600">{item.error}</p>}
      </div>

      {item.status !== "done" && item.status !== "uploading" && (
        <button type="button" onClick={onRemove} className="shrink-0 self-start text-neutral-400 hover:text-red-600" aria-label="Remove">
          ✕
        </button>
      )}
    </div>
  );
}
