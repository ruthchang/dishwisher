"use client";

import { useState } from "react";
import { Dish, Restaurant } from "@/data/dishes";
import StarRating from "./StarRating";
import RotatableImage from "./RotatableImage";
import WishFavoriteControls from "./WishFavoriteControls";

interface MenuViewProps {
  dishes: Dish[];
  restaurantsById: Record<string, Restaurant>;
  dishPreferences?: Record<string, { wishlisted: boolean; favorited: boolean }>;
  onToggleWishlist?: (dishId: string, value: boolean) => void;
  onToggleFavorite?: (dishId: string, value: boolean) => void;
}

const CATEGORY_ORDER = [
  "appetizer",
  "breakfast",
  "brunch",
  "lunch",
  "salad",
  "soup",
  "sandwich",
  "entree",
  "dinner",
  "side",
  "snack",
  "dessert",
  "drinks",
];

function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.toLowerCase());
    const bIndex = CATEGORY_ORDER.indexOf(b.toLowerCase());
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

export default function MenuView({
  dishes,
  restaurantsById,
  dishPreferences = {},
  onToggleWishlist,
  onToggleFavorite,
}: MenuViewProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const dishesByRestaurant = dishes.reduce<Record<string, Dish[]>>((acc, dish) => {
    if (!acc[dish.restaurantId]) acc[dish.restaurantId] = [];
    acc[dish.restaurantId].push(dish);
    return acc;
  }, {});

  const restaurantEntries = Object.entries(dishesByRestaurant).sort((a, b) => {
    const aName = restaurantsById[a[0]]?.name || "Unknown Spot";
    const bName = restaurantsById[b[0]]?.name || "Unknown Spot";
    return aName.localeCompare(bName);
  });

  return (
    <div className="space-y-6">
      {restaurantEntries.map(([restaurantId, restaurantDishes]) => {
        const restaurant = restaurantsById[restaurantId];
        const dishesByCategory = restaurantDishes.reduce<Record<string, Dish[]>>(
          (acc, dish) => {
            if (!acc[dish.category]) acc[dish.category] = [];
            acc[dish.category].push(dish);
            return acc;
          },
          {}
        );

        const categories = sortCategories(Object.keys(dishesByCategory));
        const yelpUrl = restaurantDishes.find((dish) => dish.yelpBusinessUrl)?.yelpBusinessUrl;

        return (
          <article
            key={restaurantId}
            className="rounded-xl border border-[#e7e5e4] bg-[#fffefb] overflow-hidden"
          >
            <button type="button" aria-expanded={Boolean(expanded[restaurantId])}
              onClick={() => setExpanded((prev) => ({ ...prev, [restaurantId]: !prev[restaurantId] }))}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-[#f7f7f5]">
              <span className="min-w-0">
                <span className="block font-semibold text-[#2d1f1a]">{restaurant?.name || "Custom Restaurant"}</span>
                <span className="block text-xs text-[#5b463f]">{restaurantDishes.length} {restaurantDishes.length === 1 ? "dish" : "dishes"}</span>
              </span>
              <svg aria-hidden="true" className={`h-5 w-5 shrink-0 text-[#0f766e] transition-transform ${expanded[restaurantId] ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {expanded[restaurantId] && (
            <div className="border-t border-[#e7e5e4] px-4 py-6 sm:px-8 sm:py-8">
            <header className="text-center border-y border-[#b8aea3] py-5 mb-6">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#78716c]">
                DishWisher Menu
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-serif font-semibold text-[#2d1f1a]">
                {restaurant?.name || "Custom Restaurant"}
              </h2>
              {(restaurant?.cuisine || restaurant?.address) && (
                <p className="text-sm text-[#5b463f] mt-1">
                  {[restaurant?.cuisine, restaurant?.address].filter(Boolean).join(" • ")}
                </p>
              )}
              {restaurantId.startsWith("yelp-") && (
                <p className="text-xs text-[#78716c] mt-1">
                  Location matched from{" "}
                  {yelpUrl ? (
                    <a
                      href={yelpUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-[#0f766e] hover:text-[#0b5f58]"
                    >
                      Yelp
                    </a>
                  ) : (
                    "Yelp"
                  )}
                </p>
              )}
            </header>

            <div className="space-y-6">
              {categories.map((category) => (
                <section key={category}>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="min-w-0 shrink-0 max-w-full truncate whitespace-nowrap text-base font-serif font-semibold uppercase tracking-widest text-[#0f766e]">
                      {category}
                    </h3>
                    <div className="h-px min-w-0 flex-1 bg-[#d6d3d1]" />
                  </div>
                  <div className="divide-y divide-[#e7e5e4]">
                    {dishesByCategory[category]
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((dish) => {
                        return (
                          <div
                            key={dish.id}
                            className="py-3"
                          >
                            <div className="flex items-baseline gap-2">
                              <p className="min-w-0 font-serif text-lg font-semibold leading-tight text-[#2d1f1a]">{dish.name}</p>
                              <span aria-hidden="true" className="min-w-2 flex-1 border-b border-dotted border-[#b8aea3]" />
                              {dish.price !== null && (
                                <span className="shrink-0 font-serif text-base tabular-nums text-[#2d1f1a]">${dish.price.toFixed(2)}</span>
                              )}
                            </div>
                            {dish.description && <p className="mt-1 text-sm leading-relaxed text-[#5b463f]">{dish.description}</p>}
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                {dish.reviewCount > 0 ? (
                                  <>
                                    <span className="text-xs text-[#5b463f]">Average</span>
                                    <StarRating rating={dish.rating} size="sm" showValue />
                                    <span className="text-xs text-[#78716c]">({dish.reviewCount} {dish.reviewCount === 1 ? "review" : "reviews"})</span>
                                  </>
                                ) : (
                                  <span className="text-xs italic text-[#78716c]">Not yet rated</span>
                                )}
                              </div>
                              <WishFavoriteControls
                                wishlisted={Boolean(dishPreferences[dish.id]?.wishlisted)}
                                favorited={Boolean(dishPreferences[dish.id]?.favorited)}
                                onToggleWishlist={() => onToggleWishlist?.(dish.id, !Boolean(dishPreferences[dish.id]?.wishlisted))}
                                onToggleFavorite={() => onToggleFavorite?.(dish.id, !Boolean(dishPreferences[dish.id]?.favorited))}
                              />
                            </div>
                            {dish.imageUrl && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-[#0f766e]">View photo</summary>
                                <div className="mt-2 aspect-video max-w-xs overflow-hidden rounded-md">
                                  <RotatableImage src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" storageKey={`menu:${dish.id}`} />
                                </div>
                              </details>
                            )}
                          </div>
                        )})}
                  </div>
                </section>
              ))}
            </div>
            </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
