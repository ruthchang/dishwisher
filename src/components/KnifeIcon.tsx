"use client";

interface KnifeIconProps {
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function KnifeIcon({
  active = false,
  onClick,
  className = "",
}: KnifeIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center justify-center ${className}`}
      aria-label="Recommended"
    >
      {/* Tooltip */}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#2d1f1a] px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
        Recommended
      </span>

      <span
        aria-hidden="true"
        className="block h-7 w-7 shrink-0 bg-current transition-colors"
        style={{
          color: active ? "#0f766e" : "#a8a29e",
          opacity: active ? 1 : 0.75,
          WebkitMaskImage: "url('/knife.png')",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          WebkitMaskSize: "contain",
          maskImage: "url('/knife.png')",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskSize: "contain",
        }}
      />
    </button>
  );
}
