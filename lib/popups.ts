import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export type ActivePopup = {
  id: string;
  title: string;
  description: string;
  discount_percent: number | null;
  image_url: string | null;
};

// Picks the newest active pop-up that's still within its order limit and
// day window. Both limits are optional and independent — a pop-up with
// neither just runs until the client turns it off manually.
//
// max_uses depends on live order counts, so this intentionally has a short
// TTL rather than a long one — a promo shouldn't keep showing for the full
// 60s window after the last redeeming order comes in.
async function fetchActivePopup(): Promise<ActivePopup | null> {
  const supabase = createServiceClient();
  // select("*") rather than naming columns explicitly — image_url comes from
  // a migration that may not have run yet, and "*" degrades gracefully
  // (just absent) instead of erroring like naming it would.
  const { data: popups, error } = await supabase
    .from("popups")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) console.error("Failed to load popups:", error);

  if (!popups || popups.length === 0) return null;

  for (const p of popups) {
    if (p.duration_days != null) {
      const expiresAt = new Date(p.created_at).getTime() + p.duration_days * 24 * 60 * 60 * 1000;
      if (Date.now() > expiresAt) continue;
    }
    if (p.max_uses != null) {
      const { count, error: countError } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", p.created_at);
      if (countError) console.error(`Failed to count orders for popup "${p.id}" max_uses check:`, countError);
      if ((count ?? 0) >= p.max_uses) continue;
    }
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      discount_percent: p.discount_percent,
      image_url: p.image_url ?? null,
    };
  }
  return null;
}

export const getActivePopup = unstable_cache(fetchActivePopup, ["active-popup"], {
  tags: ["popups"],
  revalidate: 30,
});
