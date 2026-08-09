"use client";

import { useWishlist, type WishlistItem } from "./WishlistProvider";

export function WishlistButton({
  item,
  className,
  iconClassName,
}: {
  item: WishlistItem;
  className?: string;
  iconClassName?: string;
}) {
  const { has, toggle } = useWishlist();
  const active = has(item.productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={className}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        className={`${iconClassName ?? ""} ${active ? "text-brand-red" : ""}`}
      >
        <path
          d="M12 20.5s-7.5-4.8-9.8-9.6C.7 7.4 2.3 4 5.7 3.3c2-.4 4 .5 5.3 2.4 1.3-1.9 3.3-2.8 5.3-2.4 3.4.7 5 4.1 3.5 7.6-2.3 4.8-9.8 9.6-9.8 9.6Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
