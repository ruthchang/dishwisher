"use client";


import CuisineWishes from "@/components/CuisineWishes";
import RestaurantEntries from "@/components/RestaurantEntries";
import FriendRecommendations from "@/components/FriendRecommendations";
import ManageRestaurants from "@/components/ManageRestaurants";
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
    Record<string, { wishlisted: boolean; favorited: boolean; recommended: boolean }>
  >({});
  const [showFilters, setShowFilters] = useState(false);
  const [displayMode, setDisplayMode] = useState<"cards" | "menu">("cards");
  const [showManageRestaurants, setShowManageRestaurants] = useState(false);
  const [collectionView, setCollectionView] = useState<
    "main" | "wishes" | "favorites" | "recommended"
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
    preferences: { wishlisted: boolean; favorited: boolean; recommended?: boolean }
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
    type: "wishlisted" | "favorited" | "recommended",
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
      recommended: false,
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
            recommended: Boolean(payload.recommended),
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

  const recommendedDishes = useMemo(
    () =>
      allDishes.filter((dish) => Boolean(dishPreferences[dish.id]?.recommended)),
    [allDishes, dishPreferences]
  );

  const sourceDishes = useMemo(() => {
    if (collectionView === "wishes") return wishlistedDishes;
    if (collectionView === "favorites") return favoritedDishes;
    if (collectionView === "recommended") return recommendedDishes;
    return allDishes;
  }, [allDishes, collectionView, favoritedDishes, wishlistedDishes, recommendedDishes]);

  const filteredAndSortedDishes = useMemo(() => {
    let result = [...sourceDishes];

    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (dish) =>
          (displayMode === "menu" && (userRestaurants[dish.restaurantId]?.name || "Custom Restaurant").toLowerCase().includes(query)) ||
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
      case "created-desc":
        result.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        break;
      case "updated-desc":
        result.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
        break;
    }

    return result;
  }, [
    sourceDishes,
    displayMode,
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
      {showManageRestaurants && currentUser && <ManageRestaurants onClose={() => setShowManageRestaurants(false)} onChange={loadData} />}
      <header className="relative lg:sticky lg:top-0 z-30 border-b border-[#e7e5e4] bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 md:flex md:gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Image src="/dishwisher-logo.svg" alt="" width={36} height={36} className="h-8 w-8 shrink-0" />
              <span className="text-lg font-bold tracking-tight text-[#2d1f1a]">DishWisher</span>
            </div>
            <div className="justify-self-end md:order-last">
              {currentUser ? (
                <details className="relative">
                  <summary aria-label="Account menu" className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex h-11 w-11 items-center justify-center rounded-full border border-[#e7e5e4] text-sm font-semibold text-[#0f766e]">
                    {currentUser.name?.charAt(0).toUpperCase() || "•"}
                  </summary>
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-36 rounded-xl border border-[#e7e5e4] bg-white p-2 shadow-lg">
                    <p className="px-2 py-1 text-xs text-[#5b463f]">{currentUser.name}</p>
                    <button onClick={() => setShowManageRestaurants(true)} className="w-full min-h-11 rounded-lg text-left px-2 text-sm font-semibold">Manage restaurants</button>
                    <button onClick={handleLogout} className="w-full min-h-11 rounded-lg text-left px-2 text-sm font-semibold hover:bg-[#f7f7f5]">Log out</button>
                  </div>
                </details>
              ) : <button onClick={() => { setAuthMode("login"); setShowAuth(true); }} className="min-h-11 px-3 text-sm font-semibold">Log in</button>}
            </div>
            <div className="col-span-2 w-full min-w-0 md:flex-1">
              <input
                type="search"
                aria-label={displayMode === "menu" ? "Search restaurants or dishes" : "Search dishes"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  displayMode === "menu"
                    ? "Search restaurants or dishes"
                    : collectionView === "wishes"
                    ? "Search wishes"
                    : collectionView === "favorites"
                      ? "Search favorite dishes"
                      : "Search dishes"
                }
                className="w-full px-3 py-2 min-h-11 bg-white border border-[#d6d3d1] rounded-md focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 outline-none text-[#3e2723] placeholder:text-[#a8a29e]"
              />
            </div>
            <div className="col-span-2 flex flex-wrap items-center gap-1 justify-between md:justify-end">
              <div className="flex rounded-lg border border-[#e7e5e4] p-0.5 shrink-0">
                {(["cards", "menu"] as const).map(mode => (
                  <button key={mode} aria-pressed={displayMode === mode} onClick={() => setDisplayMode(mode)} className={`min-h-10 px-2 sm:px-3 rounded-md text-xs font-semibold ${displayMode === mode ? "bg-[#0f766e] text-white" : "text-[#3e2723]"}`}>{mode === "cards" ? "Dishes" : "Menus"}</button>
                ))}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button aria-label="Filters" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)} className={`lg:hidden min-h-11 px-2 rounded-md text-xs font-semibold ${showFilters ? "bg-[#ccfbf1] text-[#0f766e]" : "text-[#3e2723]"}`}>Filters</button>
                {currentUser && <>
                  <button onClick={() => setShowImportMenu(true)} className="min-h-11 px-2 text-xs font-semibold text-[#0f766e]">Import</button>
                  <button onClick={() => { setDraftDish(null); setShowAddDish(true); }} className="min-h-11 px-2.5 text-xs font-semibold rounded-lg bg-[#0f766e] text-white whitespace-nowrap">+ Dish</button>
                </>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-5">
        <nav aria-label="Collection" className="mb-3 flex items-center gap-1 border-b border-[#e7e5e4] sm:gap-4">
          {([{id:"main",label:"Main"},{id:"wishes",label:"Wishes"},{id:"favorites",label:"Favorites"},{id:"recommended",label:"Recommended"}] as const).map(tab => (
            <button key={tab.id} aria-current={collectionView === tab.id ? "page" : undefined} onClick={() => setCollectionView(tab.id)} className={`flex-1 sm:flex-none min-h-11 px-1 sm:px-4 whitespace-nowrap border-b-2 text-xs sm:text-sm font-semibold ${collectionView === tab.id ? "border-[#0f766e] text-[#0f766e]" : "border-transparent text-[#5b463f]"}`}>{tab.label}</button>
          ))}
        </nav>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h1 className="text-xl font-bold text-[#2d1f1a]">{collectionView === "wishes" ? "Wish List" : collectionView === "favorites" ? "Favorites" : collectionView === "recommended" ? "Recommended" : "Dishes"}</h1>
          <p className="text-xs text-[#5b463f]">{filteredAndSortedDishes.length} {filteredAndSortedDishes.length === 1 ? "dish" : "dishes"}</p>
        </div>

        {collectionView === "wishes" && currentUser && <><RestaurantEntries /><CuisineWishes /><FriendRecommendations /></>}
        {collectionView === "wishes" || collectionView === "favorites" || collectionView === "recommended" ? (
          !currentUser ? (
            <div className="panel-card rounded-xl p-10 text-center">
              <h3 className="text-xl font-bold text-[#3e2723] mb-2">
                {collectionView === "wishes"
                  ? "Log in to view your wishes"
                  : collectionView === "recommended"
                    ? "Log in to view your recommendations"
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
                        isRecommended={Boolean(dishPreferences[dish.id]?.recommended)}
                        onToggleWishlist={(value) =>
                          updateDishPreference(dish.id, "wishlisted", value)
                        }
                        onToggleFavorite={(value) =>
                          updateDishPreference(dish.id, "favorited", value)
                        }
                        onToggleRecommended={(value) =>
                          updateDishPreference(dish.id, "recommended", value)
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
                        isRecommended={Boolean(dishPreferences[dish.id]?.recommended)}
                        onToggleWishlist={(value) =>
                          updateDishPreference(dish.id, "wishlisted", value)
                        }
                        onToggleFavorite={(value) =>
                          updateDishPreference(dish.id, "favorited", value)
                        }
                        onToggleRecommended={(value) =>
                          updateDishPreference(dish.id, "recommended", value)
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
          <div className="panel-card rounded-xl w-full max-w-md p-4 sm:p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto">
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
