"use client";

import { Dish, Restaurant } from "@/data/dishes";
import StarRating from "./StarRating";

interface MenuViewProps {
  dishes: Dish[];
  restaurantsById: Record<string, Restaurant>;
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

export default function MenuView({ dishes, restaurantsById }: MenuViewProps) {
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

        return (
          <article key={restaurantId} className="cozy-card rounded-xl p-5 sm:p-6">
            <header className="border-b border-[#e7e5e4] pb-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#2d1f1a]">
                {restaurant?.name || "Custom Restaurant"}
              </h2>
              {(restaurant?.cuisine || restaurant?.address) && (
                <p className="text-sm text-[#5b463f] mt-1">
                  {[restaurant?.cuisine, restaurant?.address].filter(Boolean).join(" • ")}
                </p>
              )}
            </header>

            <div className="space-y-5">
              {categories.map((category) => (
                <section key={category}>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#0f766e] mb-2">
                    {category}
                  </h3>
                  <div className="divide-y divide-[#eceae8] border border-[#eceae8] rounded-lg overflow-hidden">
                    {dishesByCategory[category]
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((dish) => (
                        <div
                          key={dish.id}
                          className="grid grid-cols-[minmax(0,1fr)_84px] gap-3 p-3 sm:p-4 bg-white"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[#2d1f1a] truncate">{dish.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <StarRating rating={dish.rating} size="sm" showValue />
                              {dish.price !== null && (
                                <span className="text-sm font-semibold text-[#0f766e]">
                                  ${dish.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-[84px] h-[64px] rounded-md overflow-hidden bg-[#f7f7f5] border border-[#e7e5e4] justify-self-end">
                            {dish.imageUrl ? (
                              <img
                                src={dish.imageUrl}
                                alt={dish.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                        </div>
                      ))}
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
