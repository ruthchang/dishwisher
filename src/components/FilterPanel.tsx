"use client";

import {
  getAllCategories,
  getAllCuisines,
  restaurants as baseRestaurants,
  Restaurant,
} from "@/data/dishes";

interface FilterPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedCuisines: string[];
  onCuisineChange: (cuisines: string[]) => void;
  selectedRestaurant: string;
  onRestaurantChange: (restaurant: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  allCategories?: string[];
  allCuisines?: string[];
  allRestaurants?: Restaurant[];
}

export default function FilterPanel({
  searchQuery,
  onSearchChange,
  selectedCategories,
  onCategoryChange,
  selectedCuisines,
  onCuisineChange,
  selectedRestaurant,
  onRestaurantChange,
  sortBy,
  onSortChange,
  minRating,
  onMinRatingChange,
  allCategories,
  allCuisines,
  allRestaurants,
}: FilterPanelProps) {
  const categories = allCategories || getAllCategories();
  const cuisines = allCuisines || getAllCuisines();
  const restaurants = allRestaurants || baseRestaurants;

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const toggleCuisine = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      onCuisineChange(selectedCuisines.filter((c) => c !== cuisine));
    } else {
      onCuisineChange([...selectedCuisines, cuisine]);
    }
  };

  return (
    <div className="cozy-card rounded-xl p-4">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-[#e7e5e4]">
        <h2 className="font-bold text-base text-[#3e2723]">Filter Results</h2>
      </div>

      {/* Search */}
      <div className="mb-5">
        <label
          htmlFor="search"
          className="block text-sm font-semibold text-[#5b463f] mb-2"
        >
          Search
        </label>
        <input
          id="search"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search dishes..."
          className="w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-md focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] placeholder:text-[#a8a29e]"
        />
      </div>

      {/* Restaurant */}
      <div className="mb-5">
        <label
          htmlFor="restaurant"
          className="block text-sm font-semibold text-[#5b463f] mb-2"
        >
          Restaurant
        </label>
        <select
          id="restaurant"
          value={selectedRestaurant}
          onChange={(e) => onRestaurantChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-md focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] cursor-pointer"
        >
          <option value="">All Cozy Spots</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-[#5b463f] mb-3">
          Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all duration-200 ${
                selectedCategories.includes(category)
                  ? "bg-[#0f766e] text-white"
                  : "bg-[#f7f7f5] text-[#5b463f] hover:bg-[#e7e5e4] border border-[#e7e5e4]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisines */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-[#5b463f] mb-3">
          Cuisines
        </label>
        <div className="flex flex-wrap gap-2">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => toggleCuisine(cuisine)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all duration-200 ${
                selectedCuisines.includes(cuisine)
                  ? "bg-[#0f766e] text-white"
                  : "bg-[#f7f7f5] text-[#5b463f] hover:bg-[#e7e5e4] border border-[#e7e5e4]"
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-[#5b463f] mb-3">
          Minimum Rating: {minRating.toFixed(1)} stars
        </label>
        <div className="px-2">
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={minRating}
            onChange={(e) => onMinRatingChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gradient-to-r from-[#e7e5e4] to-[#ccfbf1] rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${(minRating / 5) * 100}%, #e7e5e4 ${(minRating / 5) * 100}%, #e7e5e4 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-[#5b463f] mt-2 font-medium">
            <span>Any</span>
            <span>5 stars</span>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div>
        <label
          htmlFor="sort"
          className="block text-sm font-semibold text-[#5b463f] mb-2"
        >
          Sort By
        </label>
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-md focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] cursor-pointer"
        >
          <option value="rating-desc">Highest Rated</option>
          <option value="rating-asc">Lowest Rated</option>
          <option value="reviews-desc">Most Reviews</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A-Z</option>
        </select>
      </div>
    </div>
  );
}
