"use client";

import { Heart } from "lucide-react";
import { useWishlist, type WishlistProduct } from "@/contexts/WishlistContext";

interface WishlistButtonProps {
  product: WishlistProduct;
  className?: string;
  iconSize?: number;
  showLabel?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export default function WishlistButton({
  product,
  className = "",
  iconSize = 18,
  showLabel = false,
  activeLabel = "Saved",
  inactiveLabel = "Save for later",
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const liked = isInWishlist(product.id);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(product);
      }}
      aria-label={liked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      className={className || `grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 ${liked ? "text-[#d92f66]" : "text-[#172033]"}`}
    >
      <Heart size={iconSize} fill={liked ? "currentColor" : "none"} />
      {showLabel && <span className="text-xs font-semibold">{liked ? activeLabel : inactiveLabel}</span>}
    </button>
  );
}
