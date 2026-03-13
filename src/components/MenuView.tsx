"use client";

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
            className="rounded-xl p-5 sm:p-6 border border-[#e7e5e4] shadow-[0_8px_24px_rgba(62,39,35,0.06)] bg-[linear-gradient(180deg,#fffefb_0%,#fff_100%)]"
          >
            <header className="text-center border-b border-[#e7e5e4] pb-4 mb-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#78716c]">
                House Menu
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#2d1f1a]">
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
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#0f766e] whitespace-nowrap">
                      {category}
                    </h3>
                    <div className="h-px w-full bg-[#d6d3d1]" />
                  </div>
                  <div className="rounded-lg overflow-hidden bg-white border border-[#eceae8]">
                    {dishesByCategory[category]
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((dish) => {
                        return (
                          <div
                            key={dish.id}
                            className="grid grid-cols-1 gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_96px] sm:px-4 sm:py-3.5 border-b border-[#f0efed] last:border-b-0"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-0 min-w-0">
                                <div className="flex items-baseline gap-0 min-w-0 flex-1">
                                  <p className="font-semibold text-[#2d1f1a] truncate">{dish.name}</p>
                                  <span className="hidden sm:block flex-1 border-b border-dotted border-[#cfcac7] translate-y-[-2px]" />
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                  <WishFavoriteControls
                                    wishlisted={Boolean(dishPreferences[dish.id]?.wishlisted)}
                                    favorited={Boolean(dishPreferences[dish.id]?.favorited)}
                                    onToggleWishlist={() =>
                                      onToggleWishlist?.(
                                        dish.id,
                                        !Boolean(dishPreferences[dish.id]?.wishlisted)
                                      )
                                    }
                                    onToggleFavorite={() =>
                                      onToggleFavorite?.(
                                        dish.id,
                                        !Boolean(dishPreferences[dish.id]?.favorited)
                                      )
                                    }
                                  />
                                  {dish.price !== null && (
                                    <span className="text-sm font-bold text-[#0f766e] whitespace-nowrap">
                                      ${dish.price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <StarRating rating={dish.rating} size="sm" showValue />
                                {dish.description && (
                                  <p className="hidden sm:block text-xs text-[#78716c] truncate italic">
                                    {dish.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="h-[140px] w-full sm:h-[72px] sm:w-[96px] rounded-md overflow-hidden bg-[#f7f7f5] border border-[#e7e5e4] justify-self-end">
                              <RotatableImage
                                key={`menu:${dish.id}`}
                                src={dish.imageUrl || "/dishwisher-photo-placeholder.svg"}
                                alt={dish.name}
                                className="w-full h-full object-cover"
                                storageKey={`menu:${dish.id}`}
                              />
                            </div>
                          </div>
                        )})}
                  </div>
                </section>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
