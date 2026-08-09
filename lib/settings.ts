import { createClient } from "@/lib/supabase/server";
import { DEFAULT_HEADING_FONT, DEFAULT_BODY_FONT } from "@/lib/fonts";

export type SiteMode = "noel" | "halloween" | "nouvel_an" | null;

export type SiteSettings = {
  brand_name: string;
  whatsapp_number: string;
  contact_email: string;
  instagram_handle: string;
  facebook_url: string;
  logo_url: string | null;
  accent_color: string;
  dark_color: string;
  active_mode: SiteMode;
  heading_font: string;
  body_font: string;
  announcement_text: string;
  banner_color: string;
  shop_address: string;
  shop_description: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  brand_name: "House of Optics",
  whatsapp_number: "",
  contact_email: "",
  instagram_handle: "house.of.optics",
  facebook_url: "",
  logo_url: null,
  accent_color: "#c8102e",
  dark_color: "#111111",
  active_mode: null,
  heading_font: DEFAULT_HEADING_FONT,
  body_font: DEFAULT_BODY_FONT,
  announcement_text: "Nouveautés ajoutées chaque semaine",
  banner_color: "#111111",
  shop_address: "Smoke N Black, Furn El Chebbak, Liban",
  shop_description:
    "Retrouvez la boutique House of Optics à Furn El Chebbak, juste à côté de Smoke N Black. Venez découvrir notre sélection de montures et lunettes de soleil en personne — notre équipe se fera un plaisir de vous conseiller.",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").single();
  // Merge over the defaults rather than replace — a column added by a
  // migration the client hasn't run yet is simply absent from `data`,
  // not `undefined`-valued, so this keeps the site correct either way.
  return { ...DEFAULT_SETTINGS, ...data };
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export function whatsappLink(number: string, message?: string) {
  const digits = number.replace(/[^\d]/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function phoneLink(number: string) {
  return `tel:+${number.replace(/[^\d]/g, "")}`;
}

export function mapEmbedUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

export function mapDirectionsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
