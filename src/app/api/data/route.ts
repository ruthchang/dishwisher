import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const DEFAULT_CATEGORIES = [
  "Appetizer",
  "Breakfast",
  "Brunch",
  "Dessert",
  "Dinner",
  "Drinks",
  "Entree",
  "Lunch",
  "Salad",
  "Sandwich",
  "Side",
  "Snack",
  "Soup",
];

const DEFAULT_CUISINES = [
  "American",
  "Chinese",
  "French",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Mexican",
  "Thai",
  "Vietnamese",
];

const DEFAULT_TAGS = [
  "comfort",
  "crispy",
  "fresh",
  "hearty",
  "healthy",
  "homemade",
  "savory",
  "spicy",
  "sweet",
  "vegetarian",
];

export async function GET() {
  const user = await getCurrentUser();
  const [dishes, restaurants, myRatings, wishes, preferences] = await Promise.all([
    db.dish.findMany({ orderBy: { createdAt: "desc" } }),
    db.restaurant.findMany({ orderBy: { name: "asc" } }),
    user
      ? db.rating.findMany({ where: { userId: user.id } })
      : Promise.resolve([]),
    user
      ? db.dishWish.findMany({
          where: { createdById: user.id },
          orderBy: { createdAt: "desc" },
          include: {
            linkedDish: {
              select: {
                id: true,
                name: true,
                rating: true,
                imageUrl: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    user
      ? db.userDishPreference.findMany({ where: { userId: user.id } })
      : Promise.resolve([]),
  ]);

  const normalizedDishes = dishes.map((dish) => ({
    id: dish.id,
    name: dish.name,
    restaurantId: dish.restaurantId ?? "",
    createdById: dish.createdById,
    customRestaurantName: dish.customRestaurantName ?? undefined,
    customRestaurantAddress: dish.customRestaurantAddress ?? undefined,
    yelpBusinessUrl: dish.yelpBusinessUrl ?? undefined,
    description: dish.description,
    price: dish.price,
    rating: dish.rating,
    reviewCount: dish.reviewCount,
    category: dish.category,
    imageUrl: dish.imageUrl ?? undefined,
    tags: Array.isArray(dish.tags) ? dish.tags : [],
    createdAt: dish.createdAt.toISOString(),
    updatedAt: dish.updatedAt?.toISOString() ?? dish.createdAt.toISOString(),
  }));

  const categories = [
    ...new Set([...DEFAULT_CATEGORIES, ...normalizedDishes.map((d) => d.category)]),
  ].sort();
  const cuisines = [
    ...new Set([...DEFAULT_CUISINES, ...restaurants.map((r) => r.cuisine)]),
  ].sort();
  const tags = [
    ...new Set([
      ...DEFAULT_TAGS,
      ...normalizedDishes.flatMap((d) => d.tags).filter((t) => typeof t === "string"),
    ]),
  ].sort();

  const userRatings = Object.fromEntries(
    myRatings.map((rating) => [rating.dishId, rating.value])
  );
  const dishPreferences = Object.fromEntries(
    preferences.map((pref) => [
      pref.dishId,
      { wishlisted: pref.wishlisted, favorited: pref.favorited, recommended: pref.recommended },
    ])
  );
  const normalizedWishes = wishes.map((wish) => ({
    id: wish.id,
    name: wish.name,
    restaurantName: wish.restaurantName ?? undefined,
    restaurantAddress: wish.restaurantAddress ?? undefined,
    yelpBusinessId: wish.yelpBusinessId ?? undefined,
    yelpBusinessUrl: wish.yelpBusinessUrl ?? undefined,
    createdAt: wish.createdAt.toISOString(),
    linkedDishId: wish.linkedDishId ?? undefined,
    linkedDishName: wish.linkedDish?.name ?? undefined,
    linkedDishRating: wish.linkedDish?.rating ?? undefined,
    linkedDishImageUrl: wish.linkedDish?.imageUrl ?? undefined,
  }));

  return NextResponse.json({
    dishes: normalizedDishes,
    restaurants,
    wishes: normalizedWishes,
    dishPreferences,
    userRatings,
    categories,
    cuisines,
    tags,
  });
}
