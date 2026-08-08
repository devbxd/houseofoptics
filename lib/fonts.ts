// Curated font pairings loaded from Google Fonts at runtime (via a <link>
// tag built from the site_settings choice) so the client can change them
// from the dashboard without a rebuild — unlike next/font/google, which
// bakes the family in at build time.

export const HEADING_FONTS = {
  "Playfair Display": "Playfair+Display:wght@400;500;600;700",
  "Cormorant Garamond": "Cormorant+Garamond:wght@400;500;600;700",
  "Marcellus": "Marcellus:wght@400",
  "DM Serif Display": "DM+Serif+Display:wght@400",
  "Libre Baskerville": "Libre+Baskerville:wght@400;700",
} as const;

export const BODY_FONTS = {
  Inter: "Inter:wght@400;500;600",
  Poppins: "Poppins:wght@400;500;600",
  Montserrat: "Montserrat:wght@400;500;600",
  "Work Sans": "Work+Sans:wght@400;500;600",
  Jost: "Jost:wght@400;500;600",
} as const;

export type HeadingFont = keyof typeof HEADING_FONTS;
export type BodyFont = keyof typeof BODY_FONTS;

export const DEFAULT_HEADING_FONT: HeadingFont = "Playfair Display";
export const DEFAULT_BODY_FONT: BodyFont = "Inter";

export function googleFontsHref(headingFont: string, bodyFont: string) {
  const headingParam = HEADING_FONTS[headingFont as HeadingFont] ?? HEADING_FONTS[DEFAULT_HEADING_FONT];
  const bodyParam = BODY_FONTS[bodyFont as BodyFont] ?? BODY_FONTS[DEFAULT_BODY_FONT];
  return `https://fonts.googleapis.com/css2?family=${headingParam}&family=${bodyParam}&display=swap`;
}
