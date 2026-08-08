"use client";

import { useState } from "react";
import Link from "next/link";

export type Category = { id: string; name: string; slug: string; parent_id: string | null };

// Renders a category and all of its descendants, however deep the client
// has nested them (sub-category of a sub-category of a sub-category...).
export function CategoryLinks({
  categories,
  parentId,
  depth = 0,
  variant,
  onNavigate,
}: {
  categories: Category[];
  parentId: string | null;
  depth?: number;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const items = categories.filter((c) => c.parent_id === parentId);
  if (items.length === 0) return null;

  return (
    <>
      {items.map((c) => {
        const isTop = depth === 0;
        const className =
          variant === "desktop"
            ? isTop
              ? "block px-5 py-2.5 normal-case tracking-normal hover:bg-neutral-50"
              : "block py-2 pr-5 text-xs normal-case tracking-normal text-neutral-500 hover:bg-neutral-50"
            : `block py-2 pr-3 uppercase tracking-wide ${isTop ? "pl-3 text-neutral-600" : "text-neutral-500"}`;
        const indent = variant === "desktop" ? 20 + depth * 16 : 12 + depth * 16;
        const hasChildren = categories.some((sub) => sub.parent_id === c.id);

        // Mobile: collapse sub-levels behind a tap-to-expand chevron, like a
        // typical WooCommerce off-canvas menu, instead of always showing
        // everything at once.
        if (variant === "mobile" && hasChildren) {
          return <MobileCategoryBranch key={c.id} category={c} categories={categories} depth={depth} onNavigate={onNavigate} />;
        }

        return (
          <div key={c.id}>
            <Link
              href={`/categorie/${c.slug}`}
              onClick={onNavigate}
              className={className}
              style={!isTop ? { paddingLeft: indent } : undefined}
            >
              {c.name}
            </Link>
            <CategoryLinks
              categories={categories}
              parentId={c.id}
              depth={depth + 1}
              variant={variant}
              onNavigate={onNavigate}
            />
          </div>
        );
      })}
    </>
  );
}

function MobileCategoryBranch({
  category,
  categories,
  depth,
  onNavigate,
}: {
  category: Category;
  categories: Category[];
  depth: number;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isTop = depth === 0;
  const indent = 12 + depth * 16;

  return (
    <div>
      <div className={`flex items-center ${isTop ? "" : ""}`}>
        <Link
          href={`/categorie/${category.slug}`}
          onClick={onNavigate}
          className={`flex-1 py-2 pr-3 uppercase tracking-wide ${isTop ? "pl-3 text-neutral-600" : "text-neutral-500"}`}
          style={!isTop ? { paddingLeft: indent } : undefined}
        >
          {category.name}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse" : "Expand"}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-400"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M5 7l5 5 5-5H5z" />
          </svg>
        </button>
      </div>
      {open && (
        <CategoryLinks categories={categories} parentId={category.id} depth={depth + 1} variant="mobile" onNavigate={onNavigate} />
      )}
    </div>
  );
}
