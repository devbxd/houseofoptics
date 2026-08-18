"use client";

import { useActionState } from "react";
import { uploadModelPhoto } from "./actions";
import { ProductPicker } from "./ProductPicker";
import { SubmitButton } from "@/components/SubmitButton";

export function AddModelPhotoForm({ products }: { products: { id: string; name: string }[] }) {
  // A plain <form action={uploadModelPhoto}> doesn't remount on submit, so
  // ProductPicker (a controlled component) kept whatever product was
  // selected from the previous upload — only the native file input reset,
  // which made the form look fully reset when it wasn't. The picker still
  // showing the last product with no visual difference from "empty" meant
  // a second photo could get silently linked to the wrong item. A counter
  // that changes on every successful submit forces it to remount instead.
  const [submitCount, dispatch] = useActionState(async (prev: number, formData: FormData) => {
    await uploadModelPhoto(formData);
    return prev + 1;
  }, 0);

  return (
    <form action={dispatch} encType="multipart/form-data" className="mb-8 max-w-md space-y-3 rounded-md border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium">Add a photo</p>
      <div>
        <label className="mb-1 block text-sm text-neutral-600">Photo</label>
        <input key={submitCount} name="image" type="file" accept="image/*" required className="w-full text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-600">Links to product</label>
        <ProductPicker key={submitCount} products={products} />
      </div>
      <SubmitButton className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white">
        Add
      </SubmitButton>
    </form>
  );
}
