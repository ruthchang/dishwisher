"use client";

import ForkWishIcon from "./ForkWishIcon";
import FavoritePlateIcon from "./FavoritePlateIcon";
import KnifeIcon from "./KnifeIcon";

interface WishFavoriteControlsProps {
  wishlisted: boolean;
  favorited: boolean;
  onToggleWishlist: () => void;
  onToggleFavorite: () => void;
  className?: string;
}

export default function WishFavoriteControls({
  wishlisted,
  favorited,
  onToggleWishlist,
  onToggleFavorite,
  className = "",
}: WishFavoriteControlsProps) {
  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <button
        type="button"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        title={wishlisted ? "Wishlisted" : "Add to wishlist"}
        onClick={onToggleWishlist}
        className="inline-flex h-7 w-7 items-center justify-center p-0 hover:opacity-85"
      >
        <ForkWishIcon active={wishlisted} />
      </button>
      <div className="inline-flex items-center gap-0">
        <button
          type="button"
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          title={favorited ? "Favorited" : "Add to favorites"}
          onClick={onToggleFavorite}
          className="inline-flex h-8 w-8 items-center justify-center p-0 hover:opacity-85"
        >
          <FavoritePlateIcon active={favorited} />
        </button>
        <KnifeIcon />
      </div>
    </div>
  );
}
