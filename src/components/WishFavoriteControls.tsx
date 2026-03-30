"use client";

import ForkWishIcon from "./ForkWishIcon";
import FavoritePlateIcon from "./FavoritePlateIcon";
import KnifeIcon from "./KnifeIcon";

interface WishFavoriteControlsProps {
  wishlisted: boolean;
  favorited: boolean;
  recommended?: boolean;
  onToggleWishlist: () => void;
  onToggleFavorite: () => void;
  onToggleRecommended?: () => void;
  className?: string;
}

export default function WishFavoriteControls({
  wishlisted,
  favorited,
  recommended = false,
  onToggleWishlist,
  onToggleFavorite,
  onToggleRecommended,
  className = "",
}: WishFavoriteControlsProps) {
  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <ForkWishIcon active={wishlisted} onClick={onToggleWishlist} />
      <FavoritePlateIcon active={favorited} onClick={onToggleFavorite} />
      <KnifeIcon active={recommended} onClick={onToggleRecommended} />
    </div>
  );
}
