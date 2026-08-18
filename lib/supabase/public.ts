import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Anon-key client with no cookie/session dependency — safe to call from
 * inside `unstable_cache` (which errors if a dynamic API like `cookies()`
 * runs underneath it). Use this for public reads that should be cached
 * across visitors (catalog, site settings, categories, ...); keep the
 * cookie-bound `createClient()` from `./server` for anything that needs
 * the visitor's session.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
