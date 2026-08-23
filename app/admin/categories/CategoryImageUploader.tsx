"use client";

import { useState } from "react";
import Image from "next/image";
import { updateCategoryImage, removeCategoryImage } from "./actions";

export function CategoryImageUploader({ categoryId, imageUrl }: { categoryId: string; imageUrl: string | null }) {
  const [preview, setPreview] = useState(imageUrl);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {preview ? (
        <Image src={preview} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded object-cover" />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded bg-neutral-100" />
      )}
      <label className="cursor-pointer text-xs text-neutral-500 hover:text-brand-black">
        {pending ? "..." : "Image"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={pending}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setPending(true);
            const fd = new FormData();
            fd.append("image", file);
            fd.append("category_id", categoryId);
            try {
              const url = await updateCategoryImage(fd);
              setPreview(url);
            } finally {
              setPending(false);
            }
          }}
        />
      </label>
      {preview && (
        <button
          type="button"
          disabled={pending}
          className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-50"
          onClick={async () => {
            setPending(true);
            try {
              await removeCategoryImage(categoryId);
              setPreview(null);
            } finally {
              setPending(false);
            }
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
}
