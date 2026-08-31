// Next.js patches the global `fetch` on the server to apply its own HTTP
// response caching — supabase-js uses that same global `fetch` internally
// for every request, so without this, individual Supabase queries could get
// silently cached and keep returning stale rows (a variant added in the
// admin invisible to search, etc.) completely independent of this app's own
// unstable_cache/revalidateTag setup, which is the only caching layer meant
// to exist here. Forcing "no-store" on every Supabase request makes sure the
// deliberate unstable_cache wrappers (in lib/products.ts and friends) are
// the single source of truth for what's cached and for how long.
export function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: "no-store" });
}
