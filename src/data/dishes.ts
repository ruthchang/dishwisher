export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  rating: number;
  priceRange: string;
}

export interface Dish {
  id: string;
  name: string;
  restaurantId: string;
  createdById?: string;
  customRestaurantName?: string;
  customRestaurantAddress?: string;
  customRestaurantCuisine?: string;
  yelpBusinessUrl?: string;
  description: string;
  price: number | null;
  rating: number;
  reviewCount: number;
  category: string;
  imageUrl?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DishWish {
  id: string;
  name: string;
  restaurantName?: string;
  restaurantAddress?: string;
  createdAt: string;
  linkedDishId?: string;
  linkedDishName?: string;
  linkedDishRating?: number;
  linkedDishImageUrl?: string;
  yelpBusinessId?: string;
  yelpBusinessUrl?: string;
}

export interface DishWishInput {
  name?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  linkedDishId?: string;
  yelpBusinessId?: string;
  yelpBusinessUrl?: string;
}

export const restaurants: Restaurant[] = [];

export const dishes: Dish[] = [];

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find((r) => r.id === id);
}

export function getDishesByRestaurant(restaurantId: string): Dish[] {
  return dishes.filter((d) => d.restaurantId === restaurantId);
}

export function getAllCategories(): string[] {
  const defaultCategories = [
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
  const dishCategories = dishes.map((d) => d.category);
  return [...new Set([...defaultCategories, ...dishCategories])].sort();
}

export function getAllCuisines(): string[] {
  const defaultCuisines = [
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
  const restaurantCuisines = restaurants.map((r) => r.cuisine);
  return [...new Set([...defaultCuisines, ...restaurantCuisines])].sort();
}

export function getAllTags(): string[] {
  const defaultTags = [
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
  const dishTags = dishes.flatMap((d) => d.tags);
  return [...new Set([...defaultTags, ...dishTags])].sort();
}

export interface UserRestaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  rating: number;
  priceRange: string;
  isUserCreated: true;
}

export function createUserRestaurant(
  name: string,
  address?: string
): UserRestaurant {
  return {
    id: `custom-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name: name,
    cuisine: "User Added",
    address: address?.trim() || "",
    rating: 0,
    priceRange: "$$",
    isUserCreated: true,
  };
}
