import { createClient } from "@/lib/supabase/server";

export type SiteSettings = {
  brand_name: string;
  whatsapp_number: string;
  contact_email: string;
  instagram_handle: string;
  facebook_url: string;
  logo_url: string | null;
};

const DEFAULT_SETTINGS: SiteSettings = {
  brand_name: "House of Optics",
  whatsapp_number: "",
  contact_email: "",
  instagram_handle: "house.of.optics",
  facebook_url: "",
  logo_url: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").single();
  return data ?? DEFAULT_SETTINGS;
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export function whatsappLink(number: string, message?: string) {
  const digits = number.replace(/[^\d]/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
