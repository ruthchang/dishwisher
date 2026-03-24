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
  const [showLightbox, setShowLightbox] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setDisplaySrc(src);
  }, [src]);

  useEffect(() => {
    if (!showLightbox) {
      setZoom(1);
    }
  }, [showLightbox]);

  useEffect(() => {
    if (!showLightbox) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowLightbox(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showLightbox]);

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
    <>
      <div className="relative w-full h-full">
        <img
          src={displaySrc}
          alt={alt}
          className={`${className} transition-transform duration-200 cursor-zoom-in`}
          style={{ transform: `rotate(${allowRotate ? rotation : 0}deg)` }}
          onClick={() => setShowLightbox(true)}
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
      {showLightbox && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowLightbox(false)}
        >
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))));
              }}
              className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25"
            >
              -
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={(e) => {
                e.stopPropagation();
                setZoom(1);
              }}
              className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))));
              }}
              className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Close image preview"
              onClick={() => setShowLightbox(false)}
              className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25"
            >
              Close
            </button>
          </div>
          <img
            src={displaySrc}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl transition-transform duration-200"
            style={{
              transform: `rotate(${allowRotate ? rotation : 0}deg) scale(${zoom})`,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
