"use client";

interface KnifeIconProps {
  className?: string;
}

export default function KnifeIcon({ className = "" }: KnifeIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none h-7 w-7 shrink-0 bg-current text-[#a8a29e] ${className}`}
      style={{
        opacity: 0.75,
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
  );
}
