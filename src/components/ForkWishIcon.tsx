"use client";

interface ForkWishIconProps {
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function ForkWishIcon({
  active = false,
  onClick,
  className = "",
}: ForkWishIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center justify-center ${className}`}
      aria-label="Wishes"
    >
      {/* Tooltip */}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#2d1f1a] px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
        Wishes
      </span>

      <span
        aria-hidden="true"
        className="block w-7 h-7 shrink-0 bg-current transition-colors"
        style={{
          color: active ? "#0f766e" : "#a8a29e",
          opacity: active ? 1 : 0.75,
          WebkitMaskImage: "url('/fork.png')",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          WebkitMaskSize: "contain",
          maskImage: "url('/fork.png')",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskSize: "contain",
        }}
      />
    </button>
  );
}
