"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export function AddToCartButton({
  product,
  t,
  className,
}: {
  product: { id: string; name: string; price: number | null; stock: number | null; image: string | null };
  t: Record<string, string>;
  className?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock != null && product.stock <= 0;
  const noPrice = product.price == null;

  return (
    <button
      type="button"
      disabled={outOfStock || noPrice}
      onClick={(e) => {
        // Cards are wrapped in a <Link> to the product page — this button
        // sits inside it, so a click must never also trigger navigation.
        e.preventDefault();
        e.stopPropagation();
        if (outOfStock || noPrice) return;
        addItem({ productId: product.id, variant: null, name: product.name, price: product.price!, image: product.image });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className={className}
    >
      {added ? t["product.added"] : noPrice ? t["product.priceOnRequest"] : outOfStock ? t["product.outOfStock"] : t["product.addToCart"]}
    </button>
  );
}
