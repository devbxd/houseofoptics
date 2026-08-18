"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { renameBrand, deleteBrand, uploadBrandLogo, removeBrandLogo, uploadBrandBanner, removeBrandBanner, setBrandFeatured } from "./actions";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  homepage_banner_url?: string | null;
  featured_on_homepage?: boolean | null;
};

export function BrandRow({ brand, productCount }: { brand: Brand; productCount: number }) {
  const [name, setName] = useState(brand.name);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [featured, setFeatured] = useState(!!brand.featured_on_homepage);
  const [featuredPending, setFeaturedPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-b border-neutral-100 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-neutral-300 bg-neutral-50 text-[10px] text-neutral-400 hover:border-brand-black disabled:opacity-50"
          title="Upload logo"
        >
          {brand.logo_url ? (
            <Image src={brand.logo_url} alt="" fill sizes="48px" className="object-contain p-1" />
          ) : uploading ? (
            "..."
          ) : (
            "Logo"
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            setError(null);
            const fd = new FormData();
            fd.set("logo", file);
            try {
              await uploadBrandLogo(brand.id, fd);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Logo upload failed");
            } finally {
              setUploading(false);
              if (fileRef.current) fileRef.current.value = "";
            }
          }}
        />

        {brand.logo_url && (
          <button
            type="button"
            onClick={async () => {
              setError(null);
              try {
                await removeBrandLogo(brand.id);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to remove logo");
              }
            }}
            className="shrink-0 text-xs text-neutral-400 hover:text-red-600"
          >
            Remove logo
          </button>
        )}

        <div className="min-w-0">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-neutral-300 px-2 py-1.5 text-sm sm:w-56"
            />
          ) : (
            <p className="truncate text-sm font-medium">{brand.name}</p>
          )}
          <p className="mt-0.5 text-xs text-neutral-500">
            {brand.slug} · {productCount} product{productCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 text-sm">
        {editing ? (
          <button
            className="text-brand-red"
            onClick={async () => {
              await renameBrand(brand.id, name);
              setEditing(false);
            }}
          >
            Save
          </button>
        ) : (
          <button
            className="text-neutral-600 hover:text-brand-black"
            onClick={() => {
              // Resync from the live prop, not whatever `name` was left
              // over from a previous edit — otherwise a rename made
              // elsewhere (another tab, revalidated in the background)
              // gets silently overwritten by stale text the next time
              // someone clicks Edit here.
              setName(brand.name);
              setEditing(true);
            }}
          >
            Edit
          </button>
        )}
        <button
          disabled={deleting}
          className="text-neutral-600 hover:text-red-600 disabled:opacity-50"
          onClick={async () => {
            if (!confirm(`Delete "${brand.name}"? Associated products will remain but without a brand.`)) return;
            setDeleting(true);
            setError(null);
            try {
              await deleteBrand(brand.id);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Delete failed");
            } finally {
              setDeleting(false);
            }
          }}
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 sm:basis-full">{error}</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-dashed border-neutral-100 pt-3">
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input
            type="checkbox"
            checked={featured}
            disabled={featuredPending}
            onChange={async (e) => {
              const next = e.target.checked;
              setFeaturedPending(true);
              setError(null);
              try {
                await setBrandFeatured(brand.id, next);
                setFeatured(next);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to update");
              } finally {
                setFeaturedPending(false);
              }
            }}
            className="h-4 w-4 accent-brand-black"
          />
          Featured on homepage
        </label>

        <button
          type="button"
          onClick={() => bannerFileRef.current?.click()}
          disabled={uploadingBanner}
          className="relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-neutral-300 bg-neutral-50 text-[9px] text-neutral-400 hover:border-brand-black disabled:opacity-50"
          title="Upload homepage banner photo"
        >
          {brand.homepage_banner_url ? (
            <Image src={brand.homepage_banner_url} alt="" fill sizes="64px" className="object-cover" />
          ) : uploadingBanner ? (
            "..."
          ) : (
            "Banner"
          )}
        </button>
        <input
          ref={bannerFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploadingBanner(true);
            setError(null);
            const fd = new FormData();
            fd.set("banner", file);
            try {
              await uploadBrandBanner(brand.id, fd);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setUploadingBanner(false);
              if (bannerFileRef.current) bannerFileRef.current.value = "";
            }
          }}
        />
        {brand.homepage_banner_url && (
          <button
            type="button"
            onClick={() => removeBrandBanner(brand.id)}
            className="text-xs text-neutral-400 hover:text-red-600"
          >
            Remove banner
          </button>
        )}
      </div>
    </div>
  );
}
