// Curated font pairings loaded from Google Fonts at runtime (via a <link>
// tag built from the site_settings choice) so the client can change them
// from the dashboard without a rebuild — unlike next/font/google, which
// bakes the family in at build time.

export const HEADING_FONTS = {
  "Playfair Display": "Playfair+Display:wght@400;500;600;700",
  "Cormorant Garamond": "Cormorant+Garamond:wght@400;500;600;700",
  Marcellus: "Marcellus:wght@400",
  "DM Serif Display": "DM+Serif+Display:wght@400",
  "Libre Baskerville": "Libre+Baskerville:wght@400;700",
  "Bodoni Moda": "Bodoni+Moda:wght@400;500;600;700",
  Cormorant: "Cormorant:wght@400;500;600;700",
  "Crimson Pro": "Crimson+Pro:wght@400;500;600;700",
  "EB Garamond": "EB+Garamond:wght@400;500;600;700",
  Fraunces: "Fraunces:wght@400;500;600;700",
  Lora: "Lora:wght@400;500;600;700",
  Merriweather: "Merriweather:wght@400;700",
  Prata: "Prata:wght@400",
  Spectral: "Spectral:wght@400;500;600;700",
  Vollkorn: "Vollkorn:wght@400;500;600;700",
  "Abril Fatface": "Abril+Fatface:wght@400",
  "Bebas Neue": "Bebas+Neue:wght@400",
  Cinzel: "Cinzel:wght@400;500;600;700",
  "Josefin Sans": "Josefin+Sans:wght@400;500;600;700",
  Oswald: "Oswald:wght@400;500;600;700",
  Raleway: "Raleway:wght@400;500;600;700",
  "Archivo Black": "Archivo+Black:wght@400",
  "Poiret One": "Poiret+One:wght@400",
  "Yeseva One": "Yeseva+One:wght@400",
  Cardo: "Cardo:wght@400;700",
  Italiana: "Italiana:wght@400",
  "Marcellus SC": "Marcellus+SC:wght@400",
  "Antic Didone": "Antic+Didone:wght@400",
  Amiri: "Amiri:wght@400;700",
  "Cinzel Decorative": "Cinzel+Decorative:wght@400;700",
  "Rozha One": "Rozha+One:wght@400",
  Unna: "Unna:wght@400;700",
  "Zilla Slab": "Zilla+Slab:wght@400;500;600;700",
} as const;

export const BODY_FONTS = {
  Inter: "Inter:wght@400;500;600",
  Poppins: "Poppins:wght@400;500;600",
  Montserrat: "Montserrat:wght@400;500;600",
  "Work Sans": "Work+Sans:wght@400;500;600",
  Jost: "Jost:wght@400;500;600",
  "Nunito Sans": "Nunito+Sans:wght@400;500;600",
  Karla: "Karla:wght@400;500;600",
  Lato: "Lato:wght@400;700",
  "Open Sans": "Open+Sans:wght@400;500;600",
  Roboto: "Roboto:wght@400;500;700",
  "Source Sans 3": "Source+Sans+3:wght@400;500;600",
  Manrope: "Manrope:wght@400;500;600",
  "DM Sans": "DM+Sans:wght@400;500;600",
  Mulish: "Mulish:wght@400;500;600",
  Rubik: "Rubik:wght@400;500;600",
  Outfit: "Outfit:wght@400;500;600",
  Urbanist: "Urbanist:wght@400;500;600",
  "Plus Jakarta Sans": "Plus+Jakarta+Sans:wght@400;500;600",
  Sora: "Sora:wght@400;500;600",
  "Space Grotesk": "Space+Grotesk:wght@400;500;600",
  Figtree: "Figtree:wght@400;500;600",
  "Albert Sans": "Albert+Sans:wght@400;500;600",
  Epilogue: "Epilogue:wght@400;500;600",
  "Hanken Grotesk": "Hanken+Grotesk:wght@400;500;600",
  "Instrument Sans": "Instrument+Sans:wght@400;500;600",
  Lexend: "Lexend:wght@400;500;600",
  Barlow: "Barlow:wght@400;500;600",
  Cabin: "Cabin:wght@400;500;600",
  Quicksand: "Quicksand:wght@400;500;600",
  Comfortaa: "Comfortaa:wght@400;500;600",
  "IBM Plex Sans": "IBM+Plex+Sans:wght@400;500;600",
  Archivo: "Archivo:wght@400;500;600",
  "Red Hat Text": "Red+Hat+Text:wght@400;500;600",
  "Public Sans": "Public+Sans:wght@400;500;600",
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
