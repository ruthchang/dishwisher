"use client";

interface ForkWishIconProps {
  active?: boolean;
  className?: string;
}

export default function ForkWishIcon({
  active = false,
  className = "",
}: ForkWishIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`block w-7 h-7 shrink-0 bg-current ${
        active ? "text-[#0f766e]" : "text-[#a8a29e]"
      } ${className}`}
      style={{
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
  );
}
