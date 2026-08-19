import type { ProductCard } from "@/lib/products";

// Client-only view history, kept in localStorage (not tied to an account or
// order) — purely "products this browser has looked at recently", shown as
// its own row at the bottom of the product page.
const KEY = "house-of-optics-recently-viewed";
const MAX_ENTRIES = 8;

export function trackProductView(product: ProductCard) {
  try {
    const raw = localStorage.getItem(KEY);
    const list: ProductCard[] = raw ? JSON.parse(raw) : [];
    const next = [product, ...list.filter((p) => p.id !== product.id)].slice(0, MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private browsing, quota) — view history is
    // a nice-to-have, never worth surfacing an error for.
  }
}

export function getRecentlyViewed(excludeId: string, limit = 4): ProductCard[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list: ProductCard[] = raw ? JSON.parse(raw) : [];
    return list.filter((p) => p.id !== excludeId).slice(0, limit);
  } catch {
    return [];
  }
}
