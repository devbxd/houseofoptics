import { createServiceClient } from "@/lib/supabase/server";

export type ActivePopup = {
  id: string;
  title: string;
  description: string;
  discount_percent: number | null;
};

// Picks the newest active pop-up that's still within its order limit and
// day window. Both limits are optional and independent — a pop-up with
// neither just runs until the client turns it off manually.
export async function getActivePopup(): Promise<ActivePopup | null> {
  const supabase = createServiceClient();
  const { data: popups } = await supabase
    .from("popups")
    .select("id, title, description, discount_percent, max_uses, duration_days, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!popups || popups.length === 0) return null;

  for (const p of popups) {
    if (p.duration_days != null) {
      const expiresAt = new Date(p.created_at).getTime() + p.duration_days * 24 * 60 * 60 * 1000;
      if (Date.now() > expiresAt) continue;
    }
    if (p.max_uses != null) {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", p.created_at);
      if ((count ?? 0) >= p.max_uses) continue;
    }
    return { id: p.id, title: p.title, description: p.description, discount_percent: p.discount_percent };
  }
  return null;
}
