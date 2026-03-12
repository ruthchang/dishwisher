"use client";

import { useState } from "react";
import type { MenuDraftDish } from "@/lib/menu-import";

const MENU_IMPORT_TIMEOUT_MS = 35000;

interface ImportMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseDraft: (draft: MenuDraftDish) => void;
}

export default function ImportMenuModal({
  isOpen,
  onClose,
  onUseDraft,
}: ImportMenuModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<MenuDraftDish[]>([]);
  const [rawText, setRawText] = useState("");

  if (!isOpen) return null;

  const reset = () => {
    setLoading(false);
    setError("");
    setDrafts([]);
    setRawText("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleMenuImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setDrafts([]);
    setRawText("");

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), MENU_IMPORT_TIMEOUT_MS);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/menu/ocr", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Could not process menu image.");
        }
        setDrafts(Array.isArray(payload.drafts) ? payload.drafts : []);
        setRawText(typeof payload.rawText === "string" ? payload.rawText : "");
        if (!payload.drafts?.length) {
          setError(
            "OCR ran, but no dish rows were confidently parsed. Try a clearer crop of the menu."
          );
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch (error) {
      setError(
        error instanceof Error && error.name === "AbortError"
          ? "Menu OCR took too long. Try a tighter crop with just the dishes and prices."
          : error instanceof Error
            ? error.message
            : "Could not process menu image."
      );
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="panel-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-[#0f766e] via-[#14b8a6] to-[#99f6e4] px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-white accent-text-shadow">
              Import Menu
            </h2>
            <p className="text-xs text-white/85 mt-1">
              Upload a menu photo and choose a detected dish draft.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleMenuImport}
            className="w-full px-4 py-3 bg-white border-2 border-[#e7e5e4] rounded-2xl focus:border-[#14b8a6] focus:ring-4 focus:ring-[#14b8a6]/20 outline-none transition-all text-[#3e2723] file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-lg file:bg-[#f0fdfa] file:text-[#0f766e] file:font-semibold file:cursor-pointer"
          />
          <p className="text-[11px] text-[#78716c]">
            Best results come from straight-on photos with clear section headers and prices.
          </p>
          {loading && (
            <p className="text-xs text-[#0f766e]">
              Processing menu image... this can take up to 30 seconds on first run.
            </p>
          )}
          {error && <p className="text-xs text-[#b91c1c]">{error}</p>}

          {drafts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#2d1f1a]">Detected dish drafts</p>
              <div className="max-h-80 overflow-y-auto rounded-xl border border-[#e7e5e4] bg-white">
                {drafts.map((draft) => (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => {
                      onUseDraft(draft);
                      handleClose();
                    }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b last:border-b-0 border-[#f0efed] text-left hover:bg-[#f7f7f5]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#2d1f1a] truncate">
                        {draft.name}
                      </p>
                      <p className="text-xs text-[#5b463f]">
                        {draft.category}
                        {draft.price !== null ? ` • $${draft.price.toFixed(2)}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#0f766e]">Use in Add Dish</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {rawText && (
            <details>
              <summary className="cursor-pointer text-xs font-semibold text-[#5b463f]">
                View OCR text
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-white border border-[#e7e5e4] p-3 text-[11px] text-[#5b463f] max-h-40 overflow-y-auto">
                {rawText}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
