"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactEventHandler } from "react";

interface RotatableImageProps {
  src: string;
  alt: string;
  className?: string;
  storageKey: string;
  onError?: ReactEventHandler<HTMLImageElement>;
}

export default function RotatableImage({
  src,
  alt,
  className = "",
  storageKey,
  onError,
}: RotatableImageProps) {
  const localStorageKey = useMemo(
    () => `dishwisher:image-rotation:${storageKey}`,
    [storageKey]
  );

  const readInitialRotation = (): number => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = localStorage.getItem(localStorageKey);
      const parsed = raw ? Number(raw) : 0;
      return [0, 90, 180, 270].includes(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  };

  const [rotation, setRotation] = useState<number>(readInitialRotation);

  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, String(rotation));
    } catch {
      // Ignore localStorage failures (private mode, quota, etc.)
    }
  }, [localStorageKey, rotation]);

  return (
    <div className="relative w-full h-full">
      <img
        src={src}
        alt={alt}
        className={`${className} transition-transform duration-200`}
        style={{ transform: `rotate(${rotation}deg)` }}
        onError={onError}
      />
      <button
        type="button"
        onClick={() => setRotation((prev) => (prev + 90) % 360)}
        className="absolute right-1.5 top-1.5 px-2 py-1 rounded-md text-[11px] leading-none font-semibold bg-black/60 text-white hover:bg-black/75"
      >
        Rotate
      </button>
    </div>
  );
}
