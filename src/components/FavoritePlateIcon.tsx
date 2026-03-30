"use client";

interface FavoritePlateIconProps {
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function FavoritePlateIcon({
  active = false,
  onClick,
  className = "",
}: FavoritePlateIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex shrink-0 items-center justify-center w-8 h-8 ${className}`}
      aria-label="Favorite"
    >
      {/* Tooltip */}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#2d1f1a] px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
        Favorite
      </span>

      <span
        className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full border text-[16px] leading-none transition-colors ${
          active ? "border-[#14b8a6] text-[#0f766e]" : "border-[#a8a29e] text-[#a8a29e]"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute inset-[5px] rounded-full border transition-colors ${
            active ? "border-[#99f6e4]" : "border-[#d6d3d1]"
          }`}
        />
        {active ? "♥" : "♡"}
      </span>
    </button>
  );
}
