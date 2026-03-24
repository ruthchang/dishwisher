"use client";

import Image from "next/image";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Dish,
  Restaurant,
} from "@/data/dishes";
import DishCard from "@/components/DishCard";
import FilterPanel from "@/components/FilterPanel";
import AddDishModal from "@/components/AddDishModal";
import MenuView from "@/components/MenuView";
import ImportMenuModal from "@/components/ImportMenuModal";
import type { MenuDraftDish } from "@/lib/menu-import";

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
  const [ratingFilter, setRatingFilter] = useState<"all" | "rated" | "unrated">("all");
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [dishPreferences, setDishPreferences] = useState<
    Record<string, { wishlisted: boolean; favorited: boolean }>
  >({});
  const [showFilters, setShowFilters] = useState(false);
  const [displayMode, setDisplayMode] = useState<"cards" | "menu">("cards");
  const [collectionView, setCollectionView] = useState<
    "main" | "wishes" | "favorites"
  >("main");
  const [mounted, setMounted] = useState(false);
  const [showAddDish, setShowAddDish] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [draftDish, setDraftDish] = useState<MenuDraftDish | null>(null);
  const [userDishes, setUserDishes] = useState<Dish[]>([]);
  const [userRestaurants, setUserRestaurants] = useState<UserRestaurantData>({});
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allCuisines, setAllCuisines] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const dishPreferencesRef = useRef(dishPreferences);
  const preferenceRequestVersionRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.allSettled([fetchCurrentUser(), loadData()]);
      setMounted(true);
    };
    bootstrap();
  }, []);

  useEffect(() => {
    dishPreferencesRef.current = dishPreferences;
  }, [dishPreferences]);

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
    setDishPreferences(data.dishPreferences || {});
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
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!response.ok) {
        setAuthError(
          data.error ||
            "Authentication failed. Please check your details and try again."
        );
        return;
      }
      setCurrentUser(data.user);
      setShowAuth(false);
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      await loadData();
    } catch (error) {
      console.error("[DishWisher] auth submit failed", error);
      setAuthError(
        "Could not connect to the server. Please try again in a few seconds."
      );
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
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Could not add dish.");
    }
    const payload = await response.json().catch(() => ({}));
    await loadData();
    return typeof payload.id === "string" ? payload.id : undefined;
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
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Could not save dish.");
    }
    await loadData();
    setEditingDish(null);
    return updatedDish.id;
  };

  const persistDishPreferences = async (
    dishId: string,
    preferences: { wishlisted: boolean; favorited: boolean }
  ) => {
    for (const [type, value] of Object.entries(preferences) as Array<
      ["wishlisted" | "favorited", boolean]
    >) {
      await fetch("/api/dishes/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishId, type, value }),
      });
    }
    await loadData();
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

  const updateDishPreference = useCallback(async (
    dishId: string,
    type: "wishlisted" | "favorited",
    value: boolean
  ) => {
    if (!currentUser) {
      openAuthForAction();
      return;
    }
    const pendingKey = `${dishId}:${type}`;
    const previousPreference = dishPreferencesRef.current[dishId] || {
      wishlisted: false,
      favorited: false,
    };
    const nextVersion = (preferenceRequestVersionRef.current[pendingKey] || 0) + 1;
    preferenceRequestVersionRef.current[pendingKey] = nextVersion;

    setDishPreferences((prev) => ({
      ...prev,
      [dishId]: {
        ...(prev[dishId] || previousPreference),
        [type]: value,
      },
    }));
    try {
      const response = await fetch("/api/dishes/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishId, type, value }),
      });
      if (response.status === 401) {
        if (preferenceRequestVersionRef.current[pendingKey] === nextVersion) {
          setDishPreferences((prev) => ({
            ...prev,
            [dishId]: previousPreference,
          }));
        }
        openAuthForAction();
        return;
      }
      if (!response.ok) {
        if (preferenceRequestVersionRef.current[pendingKey] === nextVersion) {
          setDishPreferences((prev) => ({
            ...prev,
            [dishId]: previousPreference,
          }));
        }
        return;
      }
      const payload = await response.json().catch(() => null);
      if (payload && preferenceRequestVersionRef.current[pendingKey] === nextVersion) {
        setDishPreferences((prev) => ({
          ...prev,
          [dishId]: {
            wishlisted: Boolean(payload.wishlisted),
            favorited: Boolean(payload.favorited),
          },
        }));
      }
    } catch {
      if (preferenceRequestVersionRef.current[pendingKey] === nextVersion) {
        setDishPreferences((prev) => ({
          ...prev,
          [dishId]: previousPreference,
        }));
      }
    }
  }, [currentUser]);

  const wishlistedDishes = useMemo(
    () =>
      allDishes.filter((dish) => Boolean(dishPreferences[dish.id]?.wishlisted)),
    [allDishes, dishPreferences]
  );

  const favoritedDishes = useMemo(
    () =>
      allDishes.filter((dish) => Boolean(dishPreferences[dish.id]?.favorited)),
    [allDishes, dishPreferences]
  );

  const sourceDishes = useMemo(() => {
    if (collectionView === "wishes") return wishlistedDishes;
    if (collectionView === "favorites") return favoritedDishes;
    return allDishes;
  }, [allDishes, collectionView, favoritedDishes, wishlistedDishes]);

  const filteredAndSortedDishes = useMemo(() => {
    let result = [...sourceDishes];

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

    if (ratingFilter === "rated") {
      result = result.filter((dish) => dish.rating > 0);
    } else if (ratingFilter === "unrated") {
      result = result.filter((dish) => !dish.rating || dish.rating === 0);
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
    sourceDishes,
    searchQuery,
    selectedCategories,
    selectedCuisines,
    selectedRestaurant,
    sortBy,
    minRating,
    ratingFilter,
    userRestaurants,
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedCuisines([]);
    setSelectedRestaurant("");
    setSortBy("rating-desc");
    setMinRating(0);
    setRatingFilter("all");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategories.length > 0 ||
    selectedCuisines.length > 0 ||
    selectedRestaurant ||
    minRating > 0 ||
    ratingFilter !== "all";

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-[#e7e5e4] bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="shrink-0 flex items-center gap-1.5 rounded-2xl border border-[#eceae8] bg-[linear-gradient(180deg,#fffefb_0%,#fafaf9_100%)] px-2.5 py-1.5 shadow-[0_1px_0_rgba(62,39,35,0.04)]">
              <Image
                src="/dishwisher-logo.svg"
                alt="DishWisher logo"
                width={44}
                height={44}
                className="h-10 w-10 shrink-0"
              />
              <div className="min-w-0 leading-none">
                <div className="text-[1.18rem] font-bold tracking-[-0.03em] text-[#2d1f1a]">
                  DishWisher
                </div>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0f766e]/75">
                  Dish Tracker
                </p>
              </div>
            </div>
            <div className="hidden md:block flex-1 max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  collectionView === "wishes"
                    ? "Search wishlisted dishes"
                    : collectionView === "favorites"
                      ? "Search favorite dishes"
                      : "Search dishes, tags, or descriptions"
                }
                className="w-full px-4 py-2.5 bg-white border border-[#d6d3d1] rounded-md focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 outline-none text-[#3e2723] placeholder:text-[#a8a29e]"
              />
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-auto md:justify-end">
              {currentUser ? (
                <>
                  <span className="hidden sm:block text-sm text-[#5b463f]">
                    {currentUser.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-xs sm:text-sm font-semibold border border-[#d6d3d1] rounded-md text-[#3e2723] hover:bg-[#f7f7f5]"
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
                  className="px-3 py-2 text-xs sm:text-sm font-semibold border border-[#d6d3d1] rounded-md text-[#3e2723] hover:bg-[#f7f7f5]"
                >
                  Log in
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-3 py-2 text-xs sm:text-sm font-semibold border border-[#d6d3d1] rounded-md text-[#3e2723] hover:bg-[#f7f7f5]"
              >
                {showFilters ? "Hide Filters" : "Filters"}
              </button>
              {currentUser && (
                <>
                  <button
                    onClick={() => setShowImportMenu(true)}
                    className="px-3 py-2 text-xs sm:text-sm font-semibold border border-[#99f6e4] rounded-md text-[#0f766e] hover:bg-[#f0fdfa] transition-colors"
                  >
                    <span className="sm:hidden">Import</span>
                    <span className="hidden sm:inline">Import Menu</span>
                  </button>
                  <button
                    onClick={() => {
                      setDraftDish(null);
                      setShowAddDish(true);
                    }}
                    className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md bg-[#0f766e] text-white hover:bg-[#0b5f58] transition-colors"
                  >
                    Add Dish
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#78716c] mb-1.5">
                Browse
              </p>
              <div className="inline-flex rounded-xl border border-[#d6d3d1] bg-[#fcfcfb] p-1 shadow-[0_1px_0_rgba(62,39,35,0.04)]">
                <button
                  onClick={() => setDisplayMode("cards")}
                  className={`px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold rounded-lg transition-colors ${
                    displayMode === "cards"
                      ? "bg-[#0f766e] text-white shadow-sm"
                      : "text-[#3e2723] hover:bg-white"
                  }`}
                >
                  Dishes
                </button>
                <button
                  onClick={() => setDisplayMode("menu")}
                  className={`px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold rounded-lg transition-colors ${
                    displayMode === "menu"
                      ? "bg-[#0f766e] text-white shadow-sm"
                      : "text-[#3e2723] hover:bg-white"
                  }`}
                >
                  Menus
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 rounded-2xl border border-[#eceae8] bg-[linear-gradient(180deg,#fffefb_0%,#fafaf9_100%)] px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#78716c]">
                Collection
              </p>
              <p className="text-sm text-[#5b463f] mt-1">
                Switch between the main browse view, saved wishes, and favorites.
              </p>
            </div>
            <div className="grid w-full grid-cols-3 rounded-xl border border-[#d6d3d1] bg-white p-1 shadow-[0_1px_0_rgba(62,39,35,0.04)] sm:inline-flex sm:w-auto">
              <button
                onClick={() => setCollectionView("main")}
                className={`px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold rounded-lg transition-colors ${
                  collectionView === "main"
                    ? "bg-[#3e2723] text-white shadow-sm"
                    : "text-[#3e2723] hover:bg-[#f7f7f5]"
                }`}
              >
                Main
              </button>
              <button
                onClick={() => setCollectionView("wishes")}
                className={`px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold rounded-lg transition-colors ${
                  collectionView === "wishes"
                    ? "bg-[#3e2723] text-white shadow-sm"
                    : "text-[#3e2723] hover:bg-[#f7f7f5]"
                }`}
              >
                Wishes
              </button>
              <button
                onClick={() => setCollectionView("favorites")}
                className={`px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold rounded-lg transition-colors ${
                  collectionView === "favorites"
                    ? "bg-[#3e2723] text-white shadow-sm"
                    : "text-[#3e2723] hover:bg-[#f7f7f5]"
                }`}
              >
                Favorites
              </button>
            </div>
          </div>
        </div>

        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2d1f1a]">
              {collectionView === "wishes"
                ? "Wish List"
                : collectionView === "favorites"
                  ? "Favorites"
                  : "Dishes"}
            </h1>
            <p className="text-sm text-[#5b463f] mt-1">
              {collectionView === "wishes"
                ? `Showing ${filteredAndSortedDishes.length} ${
                    filteredAndSortedDishes.length === 1 ? "dish" : "dishes"
                  }`
                : collectionView === "favorites"
                  ? `Showing ${favoritedDishes.length} ${
                      favoritedDishes.length === 1 ? "dish" : "dishes"
                    }`
                : `Showing ${filteredAndSortedDishes.length} ${
                    filteredAndSortedDishes.length === 1 ? "dish" : "dishes"
                  }`}
            </p>
          </div>
          {mounted && sourceDishes.length > 0 && (
            <p className="text-sm text-[#5b463f]">
              {sourceDishes.length}{" "}
              {collectionView === "wishes"
                ? "wishlisted dishes"
                : collectionView === "favorites"
                  ? "favorite dishes"
                  : "dishes added by you"}
            </p>
          )}
        </div>

        {collectionView === "wishes" || collectionView === "favorites" ? (
          !currentUser ? (
            <div className="panel-card rounded-xl p-10 text-center">
              <h3 className="text-xl font-bold text-[#3e2723] mb-2">
                {collectionView === "wishes"
                  ? "Log in to view your wishes"
                  : "Log in to view your favorites"}
              </h3>
              <p className="text-[#5b463f] mb-6">
                {collectionView === "wishes"
                  ? "Your saved dishes to try will appear here."
                  : "Your favorite dishes will appear here."}
              </p>
              <button
                onClick={openAuthForAction}
                className="px-6 py-3 rounded-md bg-[#0f766e] text-white font-semibold hover:bg-[#0b5f58]"
              >
                Log In
              </button>
            </div>
          ) : (
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
                    ratingFilter={ratingFilter}
                    onRatingFilterChange={setRatingFilter}
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
                  <div className="panel-card rounded-xl p-10 text-center">
                    {!mounted ? (
                      <p className="text-[#5b463f]">Loading dishes</p>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-[#3e2723] mb-2">
                          {collectionView === "wishes"
                            ? "No wishlisted dishes match your filters"
                            : "No favorite dishes match your filters"}
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
                ) : displayMode === "cards" ? (
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
                        customRestaurant={userRestaurants[dish.restaurantId]}
                        isWishlisted={Boolean(dishPreferences[dish.id]?.wishlisted)}
                        isFavorited={Boolean(dishPreferences[dish.id]?.favorited)}
                        onToggleWishlist={(value) =>
                          updateDishPreference(dish.id, "wishlisted", value)
                        }
                        onToggleFavorite={(value) =>
                          updateDishPreference(dish.id, "favorited", value)
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <MenuView
                    dishes={filteredAndSortedDishes}
                    restaurantsById={userRestaurants}
                    dishPreferences={dishPreferences}
                    onToggleWishlist={(dishId, value) =>
                      updateDishPreference(dishId, "wishlisted", value)
                    }
                    onToggleFavorite={(dishId, value) =>
                      updateDishPreference(dishId, "favorited", value)
                    }
                  />
                )}
              </section>
            </div>
          )
        ) : (
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
                  ratingFilter={ratingFilter}
                  onRatingFilterChange={setRatingFilter}
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
                <div className="panel-card rounded-xl p-10 text-center">
                  {!mounted ? (
                    <p className="text-[#5b463f]">Loading dishes</p>
                  ) : allDishes.length === 0 ? (
                    <>
                      <h3 className="text-xl font-bold text-[#3e2723] mb-2">
                        Your dish collection is empty
                      </h3>
                      <p className="text-[#5b463f] mb-6">
                        Start adding your favorite dishes with photos
                      </p>
                      {currentUser ? (
                        <button
                          onClick={() => setShowAddDish(true)}
                          className="px-6 py-3 rounded-md bg-[#0f766e] text-white font-semibold hover:bg-[#0b5f58]"
                        >
                          Add Your First Dish
                        </button>
                      ) : (
                        <button
                          onClick={openAuthForAction}
                          className="px-6 py-3 rounded-md bg-[#0f766e] text-white font-semibold hover:bg-[#0b5f58]"
                        >
                          Log In to Add a Dish
                        </button>
                      )}
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
                displayMode === "cards" ? (
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
                        customRestaurant={userRestaurants[dish.restaurantId]}
                        isWishlisted={Boolean(dishPreferences[dish.id]?.wishlisted)}
                        isFavorited={Boolean(dishPreferences[dish.id]?.favorited)}
                        onToggleWishlist={(value) =>
                          updateDishPreference(dish.id, "wishlisted", value)
                        }
                        onToggleFavorite={(value) =>
                          updateDishPreference(dish.id, "favorited", value)
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <MenuView
                    dishes={filteredAndSortedDishes}
                    restaurantsById={userRestaurants}
                    dishPreferences={dishPreferences}
                    onToggleWishlist={(dishId, value) =>
                      updateDishPreference(dishId, "wishlisted", value)
                    }
                    onToggleFavorite={(dishId, value) =>
                      updateDishPreference(dishId, "favorited", value)
                    }
                  />
                )
              )}
            </section>
          </div>
        )}
      </main>

      <AddDishModal
        isOpen={showAddDish}
        onClose={() => {
          setShowAddDish(false);
          setEditingDish(null);
          setDraftDish(null);
        }}
        onAddDish={handleAddDish}
        onEditDish={handleEditDish}
        onSaveDishPreferences={persistDishPreferences}
        editingDish={editingDish}
        initialPreferences={
          editingDish
            ? {
                wishlisted: Boolean(dishPreferences[editingDish.id]?.wishlisted),
                favorited: Boolean(dishPreferences[editingDish.id]?.favorited),
              }
            : undefined
        }
        initialDraft={editingDish ? null : draftDish}
        existingCategories={allCategories}
        existingTags={allTags}
        existingRestaurants={allRestaurants}
      />

      <ImportMenuModal
        isOpen={showImportMenu}
        onClose={() => setShowImportMenu(false)}
        onUseDraft={(draft) => {
          setDraftDish(draft);
          setEditingDish(null);
          setShowAddDish(true);
        }}
      />

      {showAuth && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel-card rounded-xl w-full max-w-md p-6">
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
