"use client";

import { useState, useEffect } from "react";
import { restaurants, Dish } from "@/data/dishes";
import StarRating from "./StarRating";
import RotatableImage from "./RotatableImage";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const TARGET_IMAGE_SIZE_BYTES = 1200 * 1024;

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDish: (dish: Dish) => void;
  onEditDish?: (dish: Dish) => void;
  editingDish?: Dish | null;
  existingCategories: string[];
  existingTags: string[];
}

interface YelpRestaurantMatch {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  yelpUrl: string;
}

export default function AddDishModal({
  isOpen,
  onClose,
  onAddDish,
  onEditDish,
  editingDish,
  existingCategories,
  existingTags,
}: AddDishModalProps) {
  const [name, setName] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [customRestaurant, setCustomRestaurant] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [useCustomRestaurant, setUseCustomRestaurant] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [customRestaurantAddress, setCustomRestaurantAddress] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [searchCoords, setSearchCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [yelpLoading, setYelpLoading] = useState(false);
  const [yelpError, setYelpError] = useState("");
  const [yelpMatches, setYelpMatches] = useState<YelpRestaurantMatch[]>([]);
  const [selectedYelpMatch, setSelectedYelpMatch] = useState<YelpRestaurantMatch | null>(
    null
  );

  const readImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number; image: HTMLImageElement }> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: image.width, height: image.height, image });
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not load image."));
      };
      image.src = objectUrl;
    });
  };

  const compressAndResizeImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/")) return file;
    // Animated GIFs don't survive canvas round-tripping, so keep source.
    if (file.type === "image/gif") return file;

    const { width, height, image } = await readImageDimensions(file);
    const ratio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * ratio));
    const targetHeight = Math.max(1, Math.round(height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare image for upload.");
    }
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    let quality = 0.85;
    let outputBlob: Blob | null = null;
    while (quality >= 0.55) {
      // JPEG is widely supported and keeps payload small for photos.
      outputBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (!outputBlob) break;
      if (outputBlob.size <= TARGET_IMAGE_SIZE_BYTES) break;
      quality -= 0.1;
    }

    if (!outputBlob) {
      throw new Error("Could not compress image.");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([outputBlob], `${baseName}.jpg`, { type: "image/jpeg" });
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Could not read file."));
        }
      };
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
  };

  const isEditing = !!editingDish;

  useEffect(() => {
    if (editingDish && isOpen) {
      setName(editingDish.name);
      setDescription(editingDish.description);
      setPrice(editingDish.price?.toString() || "");
      setRating(editingDish.rating);
      setTags(editingDish.tags);
      setImageUrl(editingDish.imageUrl || "");
      setImageError("");
      setCustomRestaurantAddress(editingDish.customRestaurantAddress || "");
      setLocationError("");
      setYelpError("");
      setYelpMatches([]);

      if (existingCategories.includes(editingDish.category)) {
        setCategory(editingDish.category);
        setCustomCategory("");
      } else {
        setCategory("__custom__");
        setCustomCategory(editingDish.category);
      }

      if (
        editingDish.restaurantId.startsWith("custom-") ||
        editingDish.restaurantId.startsWith("yelp-")
      ) {
        setUseCustomRestaurant(true);
        const restaurantName =
          editingDish.customRestaurantName ||
          editingDish.restaurantId
            .replace("custom-", "")
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        setCustomRestaurant(restaurantName);
        setRestaurantId("");
        if (editingDish.restaurantId.startsWith("yelp-")) {
          setSelectedYelpMatch({
            id: editingDish.restaurantId.replace(/^yelp-/, ""),
            name: restaurantName,
            address: editingDish.customRestaurantAddress || "",
            cuisine: editingDish.customRestaurantCuisine || "Restaurant",
            yelpUrl: editingDish.yelpBusinessUrl || "",
          });
        } else {
          setSelectedYelpMatch(null);
        }
      } else {
        setUseCustomRestaurant(false);
        setRestaurantId(editingDish.restaurantId);
        setCustomRestaurant("");
        setSelectedYelpMatch(null);
      }
    }
  }, [editingDish, isOpen, existingCategories]);

  const resetForm = () => {
    setName("");
    setRestaurantId("");
    setCustomRestaurant("");
    setDescription("");
    setPrice("");
    setRating(0);
    setCategory("");
    setCustomCategory("");
    setTags([]);
    setCustomTag("");
    setUseCustomRestaurant(false);
    setImageUrl("");
    setImageError("");
    setCustomRestaurantAddress("");
    setLocationError("");
    setLocationLoading(false);
    setSearchCoords(null);
    setYelpLoading(false);
    setYelpError("");
    setYelpMatches([]);
    setSelectedYelpMatch(null);
  };

  const uploadImageToS3 = async (file: File): Promise<string | null> => {
    const presignResponse = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      }),
    });

    if (presignResponse.status === 501) {
      // S3 not configured on this deployment; caller can fallback to local preview storage.
      return null;
    }

    if (!presignResponse.ok) {
      const payload = await presignResponse.json().catch(() => ({}));
      throw new Error(payload.error || "Unable to prepare image upload.");
    }

    const { uploadUrl, fileUrl, debug } = await presignResponse.json();
    console.debug("[DishWisher] upload presign", {
      fileUrl,
      debug,
    });
    let uploadResponse: Response;
    try {
      uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Image upload could not reach S3 (${message}). Check bucket CORS AllowedOrigins for this app origin and ensure PUT is allowed.`
      );
    }

    if (!uploadResponse.ok) {
      const responseBody = await uploadResponse.text().catch(() => "");
      throw new Error(
        `Upload failed (${uploadResponse.status}). Check S3 bucket CORS and IAM PutObject permissions.${
          responseBody ? ` S3 response: ${responseBody.slice(0, 200)}` : ""
        }`
      );
    }

    console.debug("[DishWisher] upload complete", {
      status: uploadResponse.status,
      fileUrl,
    });
    return fileUrl as string;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const sourceFile = e.target.files?.[0];
    if (!sourceFile) return;

    if (!sourceFile.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      e.target.value = "";
      return;
    }

    if (sourceFile.size > 20 * 1024 * 1024) {
      setImageError("Please choose an image under 20MB.");
      e.target.value = "";
      return;
    }

    try {
      const preparedFile = await compressAndResizeImage(sourceFile);
      if (preparedFile.size > MAX_IMAGE_SIZE_BYTES) {
        setImageError(
          "Image is still too large after compression. Try a smaller image."
        );
        e.target.value = "";
        return;
      }

      const s3Url = await uploadImageToS3(preparedFile);
      if (s3Url) {
        setImageUrl(s3Url);
        setImageError("");
      } else {
        const localDataUrl = await fileToDataUrl(preparedFile);
        setImageUrl(localDataUrl);
        setImageError(
          "Using local image storage fallback. Configure S3 for cloud uploads."
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not upload image.";
      setImageError(message);
    }
    e.target.value = "";
  };

  const getCurrentPosition = (
    options: PositionOptions
  ): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    );
    if (!response.ok) {
      throw new Error("Reverse geocoding failed");
    }
    const data = await response.json();
    const address = data?.address || {};
    const city =
      address.city || address.town || address.village || address.county || "";
    const state = address.state || "";
    const country = address.country || "";
    const formatted = [city, state, country].filter(Boolean).join(", ");
    return (
      formatted ||
      data?.display_name ||
      `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    );
  };

  const locationErrorMessage = (error: GeolocationPositionError): string => {
    if (error.code === error.PERMISSION_DENIED) {
      return "Location permission was denied.";
    }
    if (error.code === error.TIMEOUT) {
      return "Location request timed out. Try again or enter location manually.";
    }
    return "Could not get your location. Check browser and OS location settings.";
  };

  const getBestEffortCoordinates = async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    if (searchCoords) return searchCoords;
    if (!navigator.geolocation) return null;
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 5 * 60 * 1000,
      });
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setSearchCoords(coords);
      return coords;
    } catch {
      return null;
    }
  };

  const searchYelpRestaurants = async () => {
    const query = customRestaurant.trim();
    if (query.length < 2) {
      setYelpError("Type at least 2 characters to search Yelp.");
      return;
    }

    setYelpLoading(true);
    setYelpError("");
    setYelpMatches([]);

    try {
      const coords = await getBestEffortCoordinates();
      const params = new URLSearchParams({ q: query });
      if (coords) {
        params.set("lat", String(coords.latitude));
        params.set("lng", String(coords.longitude));
      }
      const response = await fetch(`/api/restaurants/search?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not search Yelp right now.");
      }
      const matches = Array.isArray(payload.matches) ? payload.matches : [];
      setYelpMatches(matches);
      if (matches.length === 0) {
        setYelpError("No Yelp matches found nearby. You can still enter manually.");
      }
    } catch (error) {
      setYelpError(
        error instanceof Error ? error.message : "Could not search Yelp right now."
      );
    } finally {
      setYelpLoading(false);
    }
  };

  const selectYelpMatch = (match: YelpRestaurantMatch) => {
    setSelectedYelpMatch(match);
    setCustomRestaurant(match.name);
    setCustomRestaurantAddress(match.address);
    setYelpError("");
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Location is not supported in this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError("");
    try {
      let position: GeolocationPosition;
      try {
        // Fast path: allow cached or coarse location so this returns quickly.
        position = await getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 5 * 60 * 1000,
        });
      } catch (firstError) {
        const typedFirstError = firstError as GeolocationPositionError;
        if (typedFirstError.code === typedFirstError.PERMISSION_DENIED) {
          setLocationError(locationErrorMessage(typedFirstError));
          return;
        }
        // Fallback: higher accuracy, longer timeout.
        position = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
      }

      const { latitude, longitude } = position.coords;
      setSearchCoords({ latitude, longitude });
      try {
        const locationText = await reverseGeocode(latitude, longitude);
        setCustomRestaurantAddress(locationText);
      } catch {
        setCustomRestaurantAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setLocationError("Location found, but place lookup failed. Coordinates were used.");
      }
    } catch (error) {
      setLocationError(locationErrorMessage(error as GeolocationPositionError));
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = category === "__custom__" ? customCategory : category;
    const manualRestaurantId = `custom-${customRestaurant
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
    const finalRestaurantId = useCustomRestaurant
      ? selectedYelpMatch
        ? `yelp-${selectedYelpMatch.id}`
        : manualRestaurantId
      : restaurantId;

    const dish: Dish = {
      id: isEditing ? editingDish.id : `user-${Date.now()}`,
      name: name.trim(),
      restaurantId: finalRestaurantId,
      customRestaurantName: useCustomRestaurant ? customRestaurant.trim() : undefined,
      customRestaurantAddress: useCustomRestaurant
        ? customRestaurantAddress.trim() || undefined
        : undefined,
      customRestaurantCuisine: selectedYelpMatch?.cuisine || undefined,
      yelpBusinessUrl: selectedYelpMatch?.yelpUrl || undefined,
      description: description.trim(),
      price: price ? parseFloat(price) : null,
      rating: rating,
      reviewCount: isEditing ? editingDish.reviewCount : 1,
      category: finalCategory,
      imageUrl: imageUrl.trim() || undefined,
      tags: tags,
    };

    if (isEditing && onEditDish) {
      onEditDish(dish);
    } else {
      onAddDish(dish);
    }
    resetForm();
    onClose();
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmedTag = customTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setCustomTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (!isOpen) return null;

  const isValid =
    name.trim() &&
    (restaurantId || (useCustomRestaurant && customRestaurant.trim())) &&
    (category || customCategory.trim()) &&
    rating > 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="panel-card rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0f766e] via-[#14b8a6] to-[#99f6e4] px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl font-bold text-white accent-text-shadow">
            {isEditing ? "Edit Dish" : "Add Dish"}
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dish Name */}
          <div>
            <label
              htmlFor="dish-name"
              className="block text-sm font-semibold text-[#3e2723] mb-2"
            >
              Dish Name <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              id="dish-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What did you eat?"
              className="w-full px-4 py-3.5 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] placeholder:text-[#a8a29e]"
              required
            />
          </div>

          {/* Restaurant */}
          <div>
            <label className="block text-sm font-semibold text-[#3e2723] mb-2">
              Restaurant <span className="text-[#b91c1c]">*</span>
            </label>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-[#5b463f] cursor-pointer">
                <input
                  type="radio"
                  checked={!useCustomRestaurant}
                  onChange={() => {
                    setUseCustomRestaurant(false);
                    setYelpMatches([]);
                    setYelpError("");
                    setSelectedYelpMatch(null);
                  }}
                  className="w-4 h-4 accent-[#0f766e]"
                />
                Existing Spot
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#5b463f] cursor-pointer">
                <input
                  type="radio"
                  checked={useCustomRestaurant}
                  onChange={() => {
                    setUseCustomRestaurant(true);
                    setYelpError("");
                  }}
                  className="w-4 h-4 accent-[#0f766e]"
                />
                New Place
              </label>
            </div>
            {useCustomRestaurant ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={customRestaurant}
                  onChange={(e) => {
                    setCustomRestaurant(e.target.value);
                    setSelectedYelpMatch(null);
                  }}
                  placeholder="Where did you find this gem?"
                  className="w-full px-4 py-3.5 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] placeholder:text-[#a8a29e]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={searchYelpRestaurants}
                    disabled={yelpLoading}
                    className="px-3.5 py-2 text-xs font-semibold rounded-md border border-[#d6d3d1] text-[#3e2723] hover:bg-[#f7f7f5] disabled:opacity-60"
                  >
                    {yelpLoading ? "Searching..." : "Find Nearby on Yelp"}
                  </button>
                  <span className="text-xs text-[#78716c]">
                    For matching only. Data from Yelp.
                  </span>
                </div>
                {selectedYelpMatch && (
                  <div className="text-xs text-[#0f766e] bg-[#ecfeff] border border-[#99f6e4] rounded-md px-3 py-2">
                    Matched to Yelp listing: {selectedYelpMatch.name}
                    {selectedYelpMatch.yelpUrl && (
                      <>
                        {" "}
                        •{" "}
                        <a
                          href={selectedYelpMatch.yelpUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline hover:text-[#0b5f58]"
                        >
                          View on Yelp
                        </a>
                      </>
                    )}
                  </div>
                )}
                {yelpMatches.length > 0 && (
                  <div className="rounded-xl border border-[#e7e5e4] bg-white overflow-hidden">
                    {yelpMatches.map((match) => (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => selectYelpMatch(match)}
                        className="w-full text-left px-3 py-2.5 border-b last:border-b-0 border-[#f0efed] hover:bg-[#f7f7f5]"
                      >
                        <p className="text-sm font-semibold text-[#2d1f1a]">{match.name}</p>
                        <p className="text-xs text-[#5b463f]">{match.address}</p>
                      </button>
                    ))}
                    <div className="px-3 py-2 text-[11px] text-[#78716c] bg-[#fafaf9] border-t border-[#f0efed]">
                      Powered by{" "}
                      <a
                        href="https://www.yelp.com"
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-[#5b463f]"
                      >
                        Yelp
                      </a>
                    </div>
                  </div>
                )}
                {yelpError && (
                  <p className="text-xs text-[#b91c1c]">{yelpError}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locationLoading}
                    className="px-3.5 py-2 text-xs font-semibold rounded-md border border-[#d6d3d1] text-[#3e2723] hover:bg-[#f7f7f5] disabled:opacity-60"
                  >
                    {locationLoading ? "Locating..." : "Use Current Location"}
                  </button>
                  {locationError && (
                    <span className="text-xs text-[#b91c1c]">{locationError}</span>
                  )}
                </div>
                <input
                  type="text"
                  value={customRestaurantAddress}
                  onChange={(e) => setCustomRestaurantAddress(e.target.value)}
                  placeholder="Location (optional)"
                  className="w-full px-4 py-3.5 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] placeholder:text-[#a8a29e]"
                />
              </div>
            ) : (
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] cursor-pointer"
              >
                <option value="">Pick a restaurant...</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-[#3e2723] mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this dish..."
              rows={2}
              className="w-full px-4 py-3.5 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] placeholder:text-[#a8a29e] resize-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-semibold text-[#3e2723] mb-2">
              Photo
            </label>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-3 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-lg file:bg-[#f0fdfa] file:text-[#0f766e] file:font-semibold file:cursor-pointer"
            />
            <p className="text-xs text-[#5b463f] mt-2">
              Upload from your device (auto-compressed, max 5MB), or paste an image URL below.
            </p>
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageError("");
              }}
              placeholder="https://example.com/your-dish-photo.jpg"
              className="w-full mt-3 px-4 py-3.5 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] placeholder:text-[#a8a29e]"
            />
            {imageError && (
              <p className="text-xs text-[#b91c1c] mt-2">{imageError}</p>
            )}
            {imageUrl && (
              <div className="mt-3 relative">
                <div className="aspect-video rounded-2xl overflow-hidden bg-[#f7f7f5] border-2 border-[#e7e5e4]">
                  <RotatableImage
                    key={isEditing && editingDish ? `modal:${editingDish.id}` : "modal:new"}
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    storageKey={isEditing && editingDish ? `modal:${editingDish.id}` : "modal:new"}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <p className="text-xs text-[#5b463f] mt-1.5 text-center">
                  Preview
                </p>
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="mt-2 mx-auto block text-xs text-[#0f766e] hover:text-[#0b5f58] font-semibold"
                >
                  Remove photo
                </button>
              </div>
            )}
          </div>

          {/* Price and Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-semibold text-[#3e2723] mb-2"
              >
                Price
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="$0.00"
                className="w-full px-4 py-3.5 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] placeholder:text-[#a8a29e]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#3e2723] mb-2">
                Your Rating <span className="text-[#b91c1c]">*</span>
              </label>
              <div className="pt-1">
                <StarRating
                  rating={rating}
                  size="lg"
                  interactive
                  onRatingChange={setRating}
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-[#3e2723] mb-2">
              Category <span className="text-[#b91c1c]">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] cursor-pointer"
            >
              <option value="">What type of dish is this?</option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__custom__">+ Add New Category</option>
            </select>
            {category === "__custom__" && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Create your own category"
                className="w-full mt-3 px-4 py-3.5 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] placeholder:text-[#a8a29e]"
              />
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-[#3e2723] mb-3">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {existingTags.slice(0, 15).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-200 ${
                    tags.includes(tag)
                      ? "bg-gradient-to-r from-[#0f766e] to-[#14b8a6] text-white shadow-md scale-105"
                      : "bg-[#f7f7f5] text-[#5b463f] hover:bg-[#e7e5e4] border border-[#e7e5e4]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="Add your own tag..."
                className="flex-1 px-4 py-2.5 bg-white border-2 border-[#e7e5e4] rounded-xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] placeholder:text-[#a8a29e] text-sm"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="px-4 py-2.5 bg-[#f7f7f5] text-[#5b463f] rounded-xl hover:bg-[#e7e5e4] transition-colors text-sm font-semibold"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#f0fdfa] text-[#0f766e] rounded-full border border-[#99f6e4] font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-[#b91c1c] transition-colors"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 px-4 py-3.5 bg-[#f7f7f5] text-[#5b463f] rounded-xl hover:bg-[#e7e5e4] transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 px-4 py-3.5 primary-btn rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isEditing ? "Save Changes" : "Add Dish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
