"use client";

import { useState } from "react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  allowClear?: boolean;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  showValue = false,
  allowClear = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(allowClear && rating === starIndex ? 0 : starIndex);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const fillPercentage = Math.min(
            100,
            Math.max(0, (displayRating - index) * 100)
          );

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`relative ${interactive ? "cursor-pointer hover:scale-125 transition-all duration-200" : "cursor-default"} ${
                fillPercentage > 0 ? "drop-shadow-[0_0_4px_rgba(20,184,166,0.45)]" : ""
              }`}
            >
              <svg
                className={`${sizeClasses[size]} text-[#e7e5e4]`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage}%` }}
              >
                <svg
                  className={`${sizeClasses[size]} text-[#14b8a6]`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={`${textSizeClasses[size]} text-[#5b463f] font-bold ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
