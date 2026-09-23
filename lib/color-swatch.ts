// Product colors are stored as free-text labels in the dashboard
// (product_variants.color_label) — there is no hex field. This maps the
// common ones (FR + EN, since the admin can type either) to a real swatch
// color so cards can show a small dot instead of just text. Anything
// unrecognized still gets a stable, distinct color via a hash fallback,
// rather than a blank/gray dot that looks like a bug.
const COLOR_MAP: Record<string, string> = {
  noir: "#1a1a1a",
  black: "#1a1a1a",
  blanc: "#f5f5f4",
  white: "#f5f5f4",
  ivoire: "#f0e6d8",
  ivory: "#f0e6d8",
  marron: "#6b4423",
  brown: "#6b4423",
  havane: "#8b5e34",
  havana: "#8b5e34",
  tortoise: "#8b5e34",
  ecaille: "#8b5e34",
  camel: "#a9744f",
  or: "#d4af37",
  gold: "#d4af37",
  dore: "#d4af37",
  argent: "#c0c0c0",
  silver: "#c0c0c0",
  gunmetal: "#54585a",
  bleu: "#2a4d8f",
  blue: "#2a4d8f",
  marine: "#1f2f4d",
  navy: "#1f2f4d",
  vert: "#3f6b4a",
  green: "#3f6b4a",
  kaki: "#6b6b47",
  khaki: "#6b6b47",
  rouge: "#b83232",
  red: "#b83232",
  bordeaux: "#5c1f2e",
  burgundy: "#5c1f2e",
  rose: "#d98ca0",
  pink: "#d98ca0",
  gris: "#8a8a8a",
  grey: "#8a8a8a",
  gray: "#8a8a8a",
  anthracite: "#3f3f3f",
  fume: "#5a5a5a",
  smoke: "#5a5a5a",
  jaune: "#e0c341",
  yellow: "#e0c341",
  orange: "#d9772f",
  violet: "#6b4a8f",
  purple: "#6b4a8f",
  beige: "#d8c3a5",
  nude: "#dcc2a8",
  transparent: "#e8e8e8",
  clear: "#e8e8e8",
  cristal: "#e8e8e8",
  crystal: "#e8e8e8",
  turquoise: "#3aa8a0",
  palladium: "#a8a9ad",
  titanium: "#8f9295",
  ruthenium: "#6e6f72",
  chrome: "#b7bcc2",
  gunsmoke: "#54585a",
  cognac: "#8a5a2e",
  caramel: "#a9682f",
  chocolate: "#4a2f1c",
};

function normalize(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function hashColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 38%, 55%)`;
}

// A compound label like "Palladium-Black" or "Black Brown" names *two*
// distinct colors, not one — matching by plain substring ("includes")
// against a short key like "black" made every such label collapse to
// black, since "black" is a substring of nearly every dark compound name.
// Splitting into tokens and resolving each one separately avoids that.
function tokenize(key: string): string[] {
  return key.split(/[^a-z]+/).filter(Boolean);
}

// Returns 1 or 2 hex/hsl values — 2 when the label names two distinct
// colors (e.g. "Black Brown"), so the dot can render as a split swatch
// instead of picking one arbitrarily.
export function colorLabelToSwatches(label: string): string[] {
  const key = normalize(label);
  if (COLOR_MAP[key]) return [COLOR_MAP[key]];

  const tokens = tokenize(key);
  const resolved: string[] = [];
  for (const token of tokens) {
    let value = COLOR_MAP[token];
    if (!value) {
      const matchKey = Object.keys(COLOR_MAP).find((k) => token.includes(k) || k.includes(token));
      if (matchKey) value = COLOR_MAP[matchKey];
    }
    if (value && !resolved.includes(value)) resolved.push(value);
    if (resolved.length === 2) break;
  }
  if (resolved.length > 0) return resolved;

  return [hashColor(key)];
}
