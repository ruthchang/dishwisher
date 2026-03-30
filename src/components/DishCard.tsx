"use client";

import { useState } from "react";
import Link from "next/link";
import { Dish, getRestaurantById, Restaurant } from "@/data/dishes";
import StarRating from "./StarRating";
import RotatableImage from "./RotatableImage";
import WishFavoriteControls from "./WishFavoriteControls";

interface DishCardProps {
  dish: Dish;
  onRate?: (dishId: string, rating: number) => void;
  userRating?: number;
  isUserDish?: boolean;
  onDelete?: (dishId: string) => void;
  onEdit?: (dish: Dish) => void;
  customRestaurant?: Restaurant;
  isWishlisted?: boolean;
  isFavorited?: boolean;
  isRecommended?: boolean;
  onToggleWishlist?: (value: boolean) => void;
  onToggleFavorite?: (value: boolean) => void;
  onToggleRecommended?: (value: boolean) => void;
}

export default function DishCard({
  dish,
  onRate,
  userRating,
  isUserDish,
  onDelete,
  onEdit,
  customRestaurant,
  isWishlisted,
  isFavorited,
  isRecommended,
  onToggleWishlist,
  onToggleFavorite,
  onToggleRecommended,
}: DishCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localUserRating, setLocalUserRating] = useState(userRating || 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const restaurant = customRestaurant || getRestaurantById(dish.restaurantId);

  const handleRate = (rating: number) => {
    setLocalUserRating(rating);
    if (onRate) {
      onRate(dish.id, rating);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(dish.id);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`panel-card rounded-xl overflow-hidden ${
        isUserDish ? "ring-2 ring-[#ccfbf1]" : ""
      }`}
    >
      {isUserDish && (
        <div className="bg-gradient-to-r from-[#ccfbf1] to-[#e6fffa] px-5 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#0f766e]">
            Your Dish
          </span>
          <span className="text-xs text-[#0b5f58]">Added by you</span>
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="h-44 w-full sm:h-32 sm:w-44 shrink-0 rounded-md overflow-hidden bg-[#f7f7f5] border border-[#e7e5e4]">
            <RotatableImage
              key={`dish-card:${dish.id}`}
              src={dish.imageUrl || "/dishwisher-photo-placeholder.svg"}
              alt={dish.name}
              className="w-full h-full object-cover"
              storageKey={`dish-card:${dish.id}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-[#2d1f1a] leading-tight">
                  {dish.name}
                </h3>
                <p className="text-sm text-[#0f766e] font-semibold mt-0.5">
                  {restaurant?.name || "Custom Restaurant"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                <WishFavoriteControls
                  wishlisted={Boolean(isWishlisted)}
                  favorited={Boolean(isFavorited)}
                  recommended={Boolean(isRecommended)}
                  onToggleWishlist={() => onToggleWishlist?.(!isWishlisted)}
                  onToggleFavorite={() => onToggleFavorite?.(!isFavorited)}
                  onToggleRecommended={() => onToggleRecommended?.(!isRecommended)}
                />
                {dish.price && (
                  <span className="text-sm font-bold text-[#0f766e] bg-[#ecfeff] px-2.5 py-1 rounded-md border border-[#99f6e4]">
                    ${dish.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {dish.rating > 0 ? (
                <>
                  <StarRating rating={dish.rating} size="sm" showValue />
                  <span className="text-xs text-[#78716c]">({dish.reviewCount} reviews)</span>
                </>
              ) : (
                <span className="text-xs text-[#a8a29e] italic">Not rated</span>
              )}
              {dish.category && (
                <>
                  <span className="text-xs text-[#78716c]">•</span>
                  <span className="text-xs text-[#5b463f] font-semibold">{dish.category}</span>
                </>
              )}
            </div>

            <p className="text-[#5b463f] text-sm mt-2 line-clamp-2 leading-relaxed">
              {dish.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
              <div className="flex flex-wrap gap-1.5">
                {dish.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-[#f0fdfa] text-[#0f766e] rounded border border-[#99f6e4]"
                  >
                    {tag}
                  </span>
                ))}
                {dish.tags.length > 2 && (
                  <span className="px-2 py-0.5 text-xs text-[#78716c]">
                    +{dish.tags.length - 2} more
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/dishes/${dish.id}`}
                  className="text-sm text-[#0f766e] hover:text-[#0b5f58] font-semibold transition-colors"
                >
                  View
                </Link>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-[#0f766e] hover:text-[#0b5f58] font-semibold transition-colors"
                >
                  {isExpanded ? "Less" : "Details"}
                </button>
              </div>
            </div>

            {isUserDish && (
              <div className="flex items-center gap-3 mt-2.5">
                <button
                  onClick={() => onEdit && onEdit(dish)}
                  className="text-xs text-[#0f766e] hover:text-[#0b5f58] font-semibold transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-[#b91c1c] hover:text-[#991b1b] font-semibold transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-0 border-t border-[#e7e5e4]">
          <div className="pt-4">
            {restaurant?.address && (
              <div className="text-sm text-[#5b463f] mb-3">
                {restaurant.address}
              </div>
            )}
            {dish.restaurantId.startsWith("yelp-") && dish.yelpBusinessUrl && (
              <div className="text-xs text-[#78716c] mb-3">
                Location matched from{" "}
                <a
                  href={dish.yelpBusinessUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-[#0f766e] hover:text-[#0b5f58]"
                >
                  Yelp
                </a>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-[#5b463f] mb-4 flex-wrap">
              {restaurant?.cuisine && (
                <span className="bg-[#f7f7f5] px-3 py-1 rounded-full">
                  {restaurant.cuisine}
                </span>
              )}
              {restaurant?.priceRange && (
                <span className="bg-[#f7f7f5] px-3 py-1 rounded-full">
                  {restaurant.priceRange}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {dish.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs bg-[#f0fdfa] text-[#0f766e] rounded-full border border-[#99f6e4]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="bg-gradient-to-br from-[#ffffff] to-[#f7f7f5] rounded-2xl p-5 border-2 border-[#e7e5e4]">
              <p className="text-sm font-semibold text-[#3e2723] mb-3">
                Rate this dish
              </p>
              <StarRating
                rating={localUserRating}
                size="lg"
                interactive
                onRatingChange={handleRate}
              />
              {localUserRating > 0 && (
                <p className="text-xs text-[#5b463f] mt-3 font-medium">
                  You rated this {localUserRating} out of 5 stars
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="panel-card rounded-3xl max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-bold text-[#3e2723] mb-2">
              Remove this dish?
            </h3>
            <p className="text-[#5b463f] text-sm mb-6">
              &quot;{dish.name}&quot; will be removed from your collection.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-[#f7f7f5] text-[#5b463f] rounded-xl hover:bg-[#e7e5e4] transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-[#b91c1c] text-white rounded-xl hover:bg-[#991b1b] transition-colors font-semibold"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
