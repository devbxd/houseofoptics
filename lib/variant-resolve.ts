// Turns the variant text stored on a cart/order line (e.g. "Black — 52mm")
// back into the concrete product_variants row that owns its stock and price.
//
// The product page builds that text from the shopper's color pick and size
// pick joined together, but color and size normally live in two *separate*
// rows (a color row and a size row), and the product's own main color/size
// have no row at all. Matching the text against one row's label therefore
// failed for most real selections ("Black — 52mm", or just the main color),
// which showed up at checkout as a bogus "out of stock".

export type VariantRow = {
  id: string;
  color_label: string | null;
  size_label: string | null;
  label?: string | null;
  kind?: string | null;
  price?: number | null;
  stock?: number | null;
};

const SEP = " — ";

function rowColor(v: VariantRow) {
  return v.color_label ?? (v.kind === "color" ? v.label : null) ?? null;
}
function rowSize(v: VariantRow) {
  return v.size_label ?? (v.kind === "size" ? v.label : null) ?? null;
}
function joined(color: string | null, size: string | null) {
  return [color, size].filter(Boolean).join(SEP);
}

// null = this text doesn't correspond to anything the product offers.
export function resolveVariant(
  rows: VariantRow[],
  base: { color: string | null; size: string | null },
  variant: string
): { id: string | null; price: number | null } | null {
  // A row saved with both color and size filled in (older products) — or a
  // single-axis row picked on its own — matches its own label directly.
  const exact = rows.find((v) => joined(rowColor(v), rowSize(v)) === variant);
  if (exact) return { id: exact.id, price: exact.price ?? null };

  const colors = new Set<string | null>([null]);
  const sizes = new Set<string | null>([null]);
  if (base.color) colors.add(base.color);
  if (base.size) sizes.add(base.size);
  for (const v of rows) {
    if (rowColor(v) && !rowSize(v)) colors.add(rowColor(v));
    if (rowSize(v) && !rowColor(v)) sizes.add(rowSize(v));
  }

  for (const color of colors) {
    for (const size of sizes) {
      if (!color && !size) continue;
      if (joined(color, size) !== variant) continue;

      const colorRow = color ? rows.find((v) => rowColor(v) === color && !rowSize(v)) : undefined;
      const sizeRow = size ? rows.find((v) => rowSize(v) === size && !rowColor(v)) : undefined;

      // Same precedence the product page uses: the size row's price/stock
      // win, then the color row's, then the product's own.
      const price = sizeRow?.price ?? colorRow?.price ?? null;
      const owner =
        sizeRow && sizeRow.stock != null ? sizeRow : colorRow && colorRow.stock != null ? colorRow : sizeRow ?? colorRow;
      return { id: owner?.id ?? null, price };
    }
  }
  return null;
}
