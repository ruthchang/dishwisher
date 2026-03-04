"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dish,
  Restaurant,
} from "@/data/dishes";
import DishCard from "@/components/DishCard";
import FilterPanel from "@/components/FilterPanel";
import AddDishModal from "@/components/AddDishModal";

interface UserRestaurantData {
  [id: string]: Restaurant & { isUserCreated?: true };
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [sortBy, setSortBy] = useState("rating-desc");
  const [minRating, setMinRating] = useState(0);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAddDish, setShowAddDish] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [userDishes, setUserDishes] = useState<Dish[]>([]);
  const [userRestaurants, setUserRestaurants] = useState<UserRestaurantData>({});
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allCuisines, setAllCuisines] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    const bootstrap = async () => {
      await fetchCurrentUser();
      await loadData();
      setMounted(true);
    };
    bootstrap();
  }, []);

  const fetchCurrentUser = async () => {
    const response = await fetch("/api/auth/me");
    if (!response.ok) return;
    const data = await response.json();
    setCurrentUser(data.user || null);
  };

  const loadData = async () => {
    const response = await fetch("/api/data");
    if (!response.ok) return;
    const data = await response.json();
    setUserDishes(data.dishes || []);
    const restaurantMap: UserRestaurantData = Object.fromEntries(
      (data.restaurants || []).map((restaurant: Restaurant) => [
        restaurant.id,
        restaurant,
      ])
    );
    setUserRestaurants(restaurantMap);
    setUserRatings(data.userRatings || {});
    setAllCategories(data.categories || []);
    setAllCuisines(data.cuisines || []);
    setAllTags(data.tags || []);
  };

  const allDishes = useMemo(() => userDishes, [userDishes]);

  const allRestaurants = useMemo(() => {
    return Object.values(userRestaurants);
  }, [userRestaurants]);

  const openAuthForAction = () => {
    setAuthMode("login");
    setAuthError("");
    setShowAuth(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const endpoint =
        authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload: Record<string, string> = {
        email: authEmail.trim(),
        password: authPassword,
      };
      if (authMode === "register") {
        payload.name = authName.trim();
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Authentication failed.");
        return;
      }
      setCurrentUser(data.user);
      setShowAuth(false);
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      await loadData();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setUserRatings({});
    await loadData();
  };

  const handleAddDish = async (dish: Dish) => {
    if (!currentUser) {
      openAuthForAction();
      return;
    }
    const response = await fetch("/api/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dish),
    });
    if (response.status === 401) {
      openAuthForAction();
      return;
    }
    await loadData();
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!currentUser) {
      openAuthForAction();
      return;
    }
    const response = await fetch(`/api/dishes/${dishId}`, {
      method: "DELETE",
    });
    if (response.status === 401) {
      openAuthForAction();
      return;
    }
    await loadData();
  };

  const handleStartEdit = (dish: Dish) => {
    setEditingDish(dish);
    setShowAddDish(true);
  };

  const handleEditDish = async (updatedDish: Dish) => {
    if (!currentUser) {
      openAuthForAction();
      return;
    }
    const response = await fetch(`/api/dishes/${updatedDish.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDish),
    });
    if (response.status === 401) {
      openAuthForAction();
      return;
    }
    await loadData();
    setEditingDish(null);
  };

  const handleRateDish = async (dishId: string, rating: number) => {
    if (!currentUser) {
      openAuthForAction();
      return;
    }
    const response = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishId, rating }),
    });
    if (response.status === 401) {
      openAuthForAction();
      return;
    }
    await loadData();
  };

  const filteredAndSortedDishes = useMemo(() => {
    let result = [...allDishes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (dish) =>
          dish.name.toLowerCase().includes(query) ||
          dish.description.toLowerCase().includes(query) ||
          dish.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((dish) =>
        selectedCategories.includes(dish.category)
      );
    }

    if (selectedCuisines.length > 0) {
      result = result.filter((dish) => {
        const restaurant = userRestaurants[dish.restaurantId];
        return restaurant && selectedCuisines.includes(restaurant.cuisine);
      });
    }

    if (selectedRestaurant) {
      result = result.filter(
        (dish) => dish.restaurantId === selectedRestaurant
      );
    }

    if (minRating > 0) {
      result = result.filter((dish) => dish.rating >= minRating);
    }

    switch (sortBy) {
      case "rating-desc":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "rating-asc":
        result.sort((a, b) => a.rating - b.rating);
        break;
      case "reviews-desc":
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "price-asc":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-desc":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [
    allDishes,
    searchQuery,
    selectedCategories,
    selectedCuisines,
    selectedRestaurant,
    sortBy,
    minRating,
    userRestaurants,
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedCuisines([]);
    setSelectedRestaurant("");
    setSortBy("rating-desc");
    setMinRating(0);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategories.length > 0 ||
    selectedCuisines.length > 0 ||
    selectedRestaurant ||
    minRating > 0;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-[#e7e5e4] bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <div className="text-xl font-bold text-[#3e2723]">DishWisher</div>
          <div className="hidden md:block flex-1 max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, tags, or descriptions"
              className="w-full px-4 py-2.5 bg-white border border-[#d6d3d1] rounded-md focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 outline-none text-[#3e2723] placeholder:text-[#a8a29e]"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {currentUser ? (
              <>
                <span className="hidden sm:block text-sm text-[#5b463f]">
                  {currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-semibold border border-[#d6d3d1] rounded-md text-[#3e2723] hover:bg-[#f7f7f5]"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuth(true);
                }}
                className="px-3 py-2 text-sm font-semibold border border-[#d6d3d1] rounded-md text-[#3e2723] hover:bg-[#f7f7f5]"
              >
                Log in
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-3 py-2 text-sm font-semibold border border-[#d6d3d1] rounded-md text-[#3e2723] hover:bg-[#f7f7f5]"
            >
              {showFilters ? "Hide Filters" : "Filters"}
            </button>
            <button
              onClick={() => setShowAddDish(true)}
              className="px-3.5 py-2 text-sm font-semibold rounded-md bg-[#0f766e] text-white hover:bg-[#0b5f58] transition-colors"
            >
              Add Dish
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2d1f1a]">Best Dishes</h1>
            <p className="text-sm text-[#5b463f] mt-1">
              Showing {filteredAndSortedDishes.length} {filteredAndSortedDishes.length === 1 ? "dish" : "dishes"}
            </p>
          </div>
          {mounted && userDishes.length > 0 && (
            <p className="text-sm text-[#5b463f]">{userDishes.length} dishes added by you</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
          <aside className={`${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-24">
              <FilterPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
                selectedCuisines={selectedCuisines}
                onCuisineChange={setSelectedCuisines}
                selectedRestaurant={selectedRestaurant}
                onRestaurantChange={setSelectedRestaurant}
                sortBy={sortBy}
                onSortChange={setSortBy}
                minRating={minRating}
                onMinRatingChange={setMinRating}
                allCategories={allCategories}
                allCuisines={allCuisines}
                allRestaurants={allRestaurants}
              />
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 w-full py-2.5 text-sm font-semibold border border-[#d6d3d1] rounded-md text-[#3e2723] hover:bg-[#f7f7f5]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </aside>

          <section>
            {filteredAndSortedDishes.length === 0 ? (
              <div className="cozy-card rounded-xl p-10 text-center">
                {allDishes.length === 0 ? (
                  <>
                    <h3 className="text-xl font-bold text-[#3e2723] mb-2">
                      Your dish collection is empty
                    </h3>
                    <p className="text-[#5b463f] mb-6">
                      Start adding your favorite dishes with photos
                    </p>
                    <button
                      onClick={() => setShowAddDish(true)}
                      className="px-6 py-3 rounded-md bg-[#0f766e] text-white font-semibold hover:bg-[#0b5f58]"
                    >
                      Add Your First Dish
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-[#3e2723] mb-2">
                      No dishes match your filters
                    </h3>
                    <p className="text-[#5b463f] mb-6">
                      Try adjusting your search criteria
                    </p>
                    <button
                      onClick={clearFilters}
                      className="px-6 py-3 rounded-md bg-[#0f766e] text-white font-semibold hover:bg-[#0b5f58]"
                    >
                      Reset Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedDishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onRate={handleRateDish}
                    userRating={mounted ? userRatings[dish.id] : undefined}
                    isUserDish={dish.createdById === currentUser?.id}
                    onDelete={handleDeleteDish}
                    onEdit={handleStartEdit}
                    customRestaurant={
                      dish.restaurantId.startsWith("custom-")
                        ? userRestaurants[dish.restaurantId]
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <AddDishModal
        isOpen={showAddDish}
        onClose={() => {
          setShowAddDish(false);
          setEditingDish(null);
        }}
        onAddDish={handleAddDish}
        onEditDish={handleEditDish}
        editingDish={editingDish}
        existingCategories={allCategories}
        existingTags={allTags}
      />

      {showAuth && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="cozy-card rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#2d1f1a]">
              {authMode === "login" ? "Log in" : "Create account"}
            </h2>
            <p className="text-sm text-[#5b463f] mt-1 mb-4">
              {authMode === "login"
                ? "Sign in to post and rate dishes."
                : "Create an account to start posting."}
            </p>
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === "register" && (
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-md focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 outline-none"
                  required
                />
              )}
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-md focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 outline-none"
                required
              />
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Password"
                minLength={6}
                className="w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-md focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 outline-none"
                required
              />
              {authError && <p className="text-sm text-[#b91c1c]">{authError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuth(false);
                    setAuthError("");
                  }}
                  className="flex-1 px-3 py-2.5 text-sm font-semibold border border-[#d6d3d1] rounded-md text-[#3e2723] hover:bg-[#f7f7f5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 px-3 py-2.5 text-sm font-semibold rounded-md bg-[#0f766e] text-white hover:bg-[#0b5f58] disabled:opacity-60"
                >
                  {authLoading
                    ? "Please wait..."
                    : authMode === "login"
                      ? "Log in"
                      : "Create account"}
                </button>
              </div>
            </form>
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setAuthError("");
              }}
              className="mt-3 text-sm text-[#0f766e] font-semibold"
            >
              {authMode === "login"
                ? "Need an account? Sign up"
                : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
