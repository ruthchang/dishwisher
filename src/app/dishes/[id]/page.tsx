"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import StarRating from "@/components/StarRating";
import RotatableImage from "@/components/RotatableImage";

interface Review {
  id: string;
  userId: string;
  userName: string;
  value: number;
  text: string | null;
  createdAt: string;
}

interface DishDetail {
  id: string;
  name: string;
  restaurantId: string;
  customRestaurantName?: string;
  description: string;
  price: number | null;
  rating: number;
  reviewCount: number;
  category: string;
  imageUrl?: string;
  tags: string[];
  yelpBusinessUrl?: string;
  createdAt: string;
  createdBy: { id: string; name: string };
  restaurant: { id: string; name: string; cuisine: string; address: string } | null;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

function UserInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#14b8a6] to-[#0f766e] flex items-center justify-center shrink-0">
      <span className="text-white text-xs font-bold">{initials}</span>
    </div>
  );
}

export default function DishPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [dish, setDish] = useState<DishDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [myRating, setMyRating] = useState(0);
  const [myText, setMyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const load = useCallback(async () => {
    const [dishRes, userRes] = await Promise.all([
      fetch(`/api/dishes/${id}`),
      fetch("/api/auth/me"),
    ]);

    if (dishRes.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    if (dishRes.ok) {
      const data = await dishRes.json();
      setDish(data.dish);
      setReviews(data.reviews);
    }

    if (userRes.ok) {
      const data = await userRes.json();
      setCurrentUser(data.user || null);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Pre-fill user's existing review if present
  useEffect(() => {
    if (!currentUser || reviews.length === 0) return;
    const mine = reviews.find((r) => r.userId === currentUser.id);
    if (mine) {
      setMyRating(mine.value);
      setMyText(mine.text ?? "");
    }
  }, [currentUser, reviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishId: id, rating: myRating, text: myText }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Could not save review.");
      }
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: dish?.name ?? "Dish",
      text: dish ? `Check out ${dish.name} on DishWisher` : "Check this out on DishWisher",
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // clipboard unavailable — noop
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#5b463f]">Loading…</p>
      </div>
    );
  }

  if (notFound || !dish) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-bold text-[#3e2723]">Dish not found</p>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-[#0f766e] font-semibold hover:underline"
        >
          Back to collection
        </button>
      </div>
    );
  }

  const restaurantName =
    dish.customRestaurantName || dish.restaurant?.name || "Unknown restaurant";
  const myReview = currentUser ? reviews.find((r) => r.userId === currentUser.id) : null;
  const otherReviews = currentUser
    ? reviews.filter((r) => r.userId !== currentUser.id)
    : reviews;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e7e5e4] bg-white/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/")}
              className="shrink-0 p-2 rounded-full hover:bg-[#f7f7f5] transition-colors text-[#3e2723]"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              <Image
                src="/dishwisher-logo.svg"
                alt="DishWisher"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0"
              />
              <span className="text-base font-bold text-[#2d1f1a] truncate">DishWisher</span>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-sm font-semibold hover:bg-[#ccfbf1] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {shareState === "copied" ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Dish hero */}
        <div className="panel-card rounded-2xl overflow-hidden">
          {dish.imageUrl && (
            <div className="aspect-video w-full bg-[#f7f7f5]">
              <RotatableImage
                key={`dish-page:${dish.id}`}
                src={dish.imageUrl}
                alt={dish.name}
                className="w-full h-full object-cover"
                storageKey={`dish-page:${dish.id}`}
              />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-[#2d1f1a] leading-tight">{dish.name}</h1>
                <p className="text-[#0f766e] font-semibold mt-0.5">{restaurantName}</p>
                {dish.restaurant?.address && (
                  <p className="text-sm text-[#78716c] mt-0.5">{dish.restaurant.address}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {dish.rating > 0 ? (
                  <>
                    <StarRating rating={dish.rating} size="sm" showValue />
                    <span className="text-xs text-[#78716c]">{dish.reviewCount} {dish.reviewCount === 1 ? "review" : "reviews"}</span>
                  </>
                ) : (
                  <span className="text-xs text-[#a8a29e] italic">Not yet rated</span>
                )}
                {dish.price != null && (
                  <span className="text-sm font-bold text-[#0f766e] bg-[#ecfeff] px-2.5 py-1 rounded-md border border-[#99f6e4]">
                    ${dish.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {dish.description && (
              <p className="text-[#5b463f] text-sm mt-3 leading-relaxed">{dish.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {dish.category && (
                <span className="px-3 py-1 text-xs bg-[#f7f7f5] text-[#5b463f] rounded-full border border-[#e7e5e4] font-medium">
                  {dish.category}
                </span>
              )}
              {dish.restaurant?.cuisine && (
                <span className="px-3 py-1 text-xs bg-[#f7f7f5] text-[#5b463f] rounded-full border border-[#e7e5e4]">
                  {dish.restaurant.cuisine}
                </span>
              )}
              {dish.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 text-xs bg-[#f0fdfa] text-[#0f766e] rounded-full border border-[#99f6e4]">
                  {tag}
                </span>
              ))}
            </div>

            {dish.yelpBusinessUrl && (
              <p className="text-xs text-[#78716c] mt-3">
                Location matched from{" "}
                <a href={dish.yelpBusinessUrl} target="_blank" rel="noreferrer" className="underline text-[#0f766e] hover:text-[#0b5f58]">
                  Yelp
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Your review */}
        <div className="panel-card rounded-2xl p-5">
          <h2 className="text-base font-bold text-[#3e2723] mb-4">
            {myReview ? "Your Review" : "Leave a Review"}
          </h2>
          {currentUser ? (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#5b463f] mb-2">Rating <span className="text-xs font-normal text-[#78716c]">(optional)</span></p>
                <StarRating
                  rating={myRating}
                  size="lg"
                  interactive
                  onRatingChange={setMyRating}
                  allowClear
                />
                {myRating === 0 && <p className="text-xs text-[#78716c] mt-1">No rating — tap a star to rate</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#5b463f] mb-2">
                  Review <span className="text-xs font-normal text-[#78716c]">(optional)</span>
                </label>
                <textarea
                  value={myText}
                  onChange={(e) => setMyText(e.target.value)}
                  placeholder="Share your thoughts about this dish…"
                  rows={3}
                  className="w-full px-4 py-3 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] placeholder:text-[#a8a29e] resize-none text-sm"
                />
              </div>
              {submitError && <p className="text-xs text-[#b91c1c]">{submitError}</p>}
              <button
                type="submit"
                disabled={submitting || (myRating === 0 && myText.trim() === "")}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0f766e] to-[#14b8a6] text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {submitting ? "Saving…" : myReview ? "Update Review" : "Submit Review"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-[#5b463f]">
              <button
                onClick={() => router.push("/")}
                className="text-[#0f766e] font-semibold hover:underline"
              >
                Log in
              </button>{" "}
              to leave a review.
            </p>
          )}
        </div>

        {/* All reviews */}
        <div className="panel-card rounded-2xl p-5">
          <h2 className="text-base font-bold text-[#3e2723] mb-4">
            Reviews {reviews.length > 0 && <span className="text-[#78716c] font-normal text-sm">({reviews.length})</span>}
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm text-[#a8a29e] italic">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {/* Own review pinned first */}
              {myReview && (
                <div className="flex gap-3 p-3 rounded-xl bg-[#f0fdfa] border border-[#99f6e4]">
                  <UserInitials name={myReview.userName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#2d1f1a]">{myReview.userName} <span className="text-xs text-[#0f766e] font-semibold">(you)</span></span>
                      <span className="text-xs text-[#a8a29e]">{new Date(myReview.createdAt).toLocaleDateString()}</span>
                    </div>
                    {myReview.value > 0 && (
                      <div className="mt-1">
                        <StarRating rating={myReview.value} size="sm" showValue />
                      </div>
                    )}
                    {myReview.text && (
                      <p className="text-sm text-[#5b463f] mt-1.5 leading-relaxed">{myReview.text}</p>
                    )}
                  </div>
                </div>
              )}

              {otherReviews.map((review) => (
                <div key={review.id} className="flex gap-3">
                  <UserInitials name={review.userName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#2d1f1a]">{review.userName}</span>
                      <span className="text-xs text-[#a8a29e]">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.value > 0 && (
                      <div className="mt-1">
                        <StarRating rating={review.value} size="sm" showValue />
                      </div>
                    )}
                    {review.text && (
                      <p className="text-sm text-[#5b463f] mt-1.5 leading-relaxed">{review.text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
