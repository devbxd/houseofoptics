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
  shop_description_en: string;
  shop_description_ar: string;
  hero_title_fr: string;
  hero_title_en: string;
  hero_title_ar: string;
  hero_eyebrow_fr: string;
  hero_eyebrow_en: string;
  hero_eyebrow_ar: string;
  hero_subtitle_fr: string;
  hero_subtitle_en: string;
  hero_subtitle_ar: string;
  global_shipping_info: string;
  spin_wheel_enabled: boolean;
  packaging_image_url: string | null;
  returns_info: string;
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
  shop_description_en:
    "Find House of Optics in Furn El Chebbak, right next to Smoke N Black. Come discover our selection of frames and sunglasses in person — our team will be happy to help you choose.",
  shop_description_ar:
    "تجدون متجر House of Optics في فرن الشباك، بجانب Smoke N Black مباشرة. تعالوا لاكتشاف تشكيلتنا من الإطارات والنظارات الشمسية عن قرب — سيسعد فريقنا بمساعدتكم في الاختيار.",
  hero_title_fr: "",
  hero_title_en: "",
  hero_title_ar: "",
  hero_eyebrow_fr: "",
  hero_eyebrow_en: "",
  hero_eyebrow_ar: "",
  hero_subtitle_fr: "",
  hero_subtitle_en: "",
  hero_subtitle_ar: "",
  global_shipping_info: "",
  spin_wheel_enabled: false,
  packaging_image_url: null,
  returns_info: "",
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

export function localizedShopDescription(settings: SiteSettings, locale: "fr" | "en" | "ar") {
  if (locale === "en") return settings.shop_description_en || settings.shop_description;
  if (locale === "ar") return settings.shop_description_ar || settings.shop_description;
  return settings.shop_description;
}

// Returns null (not a fallback string) when the client hasn't set a custom
// hero title yet, so callers can fall back to the built-in i18n headline.
export function localizedHeroTitle(settings: SiteSettings, locale: "fr" | "en" | "ar"): string | null {
  if (locale === "en") return settings.hero_title_en || null;
  if (locale === "ar") return settings.hero_title_ar || null;
  return settings.hero_title_fr || null;
}

export function localizedHeroEyebrow(settings: SiteSettings, locale: "fr" | "en" | "ar"): string | null {
  if (locale === "en") return settings.hero_eyebrow_en || null;
  if (locale === "ar") return settings.hero_eyebrow_ar || null;
  return settings.hero_eyebrow_fr || null;
}

export function localizedHeroSubtitle(settings: SiteSettings, locale: "fr" | "en" | "ar"): string | null {
  if (locale === "en") return settings.hero_subtitle_en || null;
  if (locale === "ar") return settings.hero_subtitle_ar || null;
  return settings.hero_subtitle_fr || null;
}
