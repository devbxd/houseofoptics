"use client";

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
            : isTop
              ? "block py-2 pl-3 text-neutral-600"
              : "block py-1.5 pr-3 text-xs text-neutral-500";
        const indent = variant === "desktop" ? 20 + depth * 16 : 12 + depth * 16;

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
