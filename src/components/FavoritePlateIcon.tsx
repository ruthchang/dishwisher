"use client";

interface FavoritePlateIconProps {
  active?: boolean;
  className?: string;
}

export default function FavoritePlateIcon({
  active = false,
  className = "",
}: FavoritePlateIconProps) {
  return (
    <span
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full border text-[16px] leading-none ${
        active ? "border-[#14b8a6] text-[#0f766e]" : "border-[#a8a29e] text-[#a8a29e]"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-[5px] rounded-full border ${
          active ? "border-[#99f6e4]" : "border-[#d6d3d1]"
        }`}
      />
      {active ? "♥" : "♡"}
    </span>
  );
}
