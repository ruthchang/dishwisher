"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactEventHandler } from "react";

interface RotatableImageProps {
  src: string;
  alt: string;
  className?: string;
  storageKey: string;
  fallbackSrc?: string;
  allowRotate?: boolean;
  onRotate?: () => void;
  onError?: ReactEventHandler<HTMLImageElement>;
}

export default function RotatableImage({
  src,
  alt,
  className = "",
  storageKey,
  fallbackSrc = "/dishwisher-photo-placeholder.svg",
  allowRotate = false,
  onRotate,
  onError,
}: RotatableImageProps) {
  const localStorageKey = useMemo(
    () => `dishwisher:image-rotation:${storageKey}`,
    [storageKey]
  );

  const readInitialRotation = (): number => {
    if (!allowRotate) return 0;
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
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    setDisplaySrc(src);
  }, [src]);

  useEffect(() => {
    if (!allowRotate) {
      setRotation(0);
      return;
    }
    try {
      const raw = localStorage.getItem(localStorageKey);
      const parsed = raw ? Number(raw) : 0;
      setRotation([0, 90, 180, 270].includes(parsed) ? parsed : 0);
    } catch {
      setRotation(0);
    }
  }, [allowRotate, localStorageKey]);

  useEffect(() => {
    if (!allowRotate) return;
    try {
      localStorage.setItem(localStorageKey, String(rotation));
    } catch {
      // Ignore localStorage failures (private mode, quota, etc.)
    }
  }, [allowRotate, localStorageKey, rotation]);

  return (
    <div className="relative w-full h-full">
      <img
        src={displaySrc}
        alt={alt}
        className={`${className} transition-transform duration-200`}
        style={{ transform: `rotate(${allowRotate ? rotation : 0}deg)` }}
        onError={(e) => {
          if (displaySrc !== fallbackSrc) {
            setDisplaySrc(fallbackSrc);
          }
          onError?.(e);
        }}
      />
      {allowRotate && (
        <button
          type="button"
          onClick={() => {
            if (onRotate) {
              onRotate();
              return;
            }
            setRotation((prev) => (prev + 90) % 360);
          }}
          className="absolute right-1.5 top-1.5 px-2 py-1 rounded-md text-[11px] leading-none font-semibold bg-black/60 text-white hover:bg-black/75"
        >
          Rotate
        </button>
      )}
    </div>
  );
}
