import { createClient } from "@/lib/supabase/server";

// Server Actions are public POST endpoints — the middleware redirect only
// protects the admin *pages*, it does not stop someone calling an action
// directly. Every admin action re-checks the caller here, using the same
// rule as middleware.ts (app_metadata can only be set server-side, so a
// customer signup can never grant itself admin).
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "admin") throw new Error("Unauthorized");
  return user;
}
