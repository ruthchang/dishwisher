import { NextResponse } from "next/server";
import Tesseract from "tesseract.js";
import { parseMenuText } from "@/lib/menu-import";

export const runtime = "nodejs";
export const maxDuration = 60;
const OCR_TIMEOUT_MS = 30000;

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Menu image is required." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "This first version supports image files only." },
      { status: 400 }
    );
  }

  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Menu image must be under 12MB." },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await Promise.race([
      Tesseract.recognize(Buffer.from(arrayBuffer), "eng", {
        logger: () => {},
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "OCR timed out. Try a smaller, clearer crop of the menu."
            )
          );
        }, OCR_TIMEOUT_MS);
      }),
    ]);
    const rawText = result.data.text || "";
    const drafts = parseMenuText(rawText);

    return NextResponse.json({
      ok: true,
      rawText,
      drafts,
    });
  } catch (error) {
    console.error("[DishWisher] menu OCR failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not process that menu image. Try a clearer photo with good lighting.",
      },
      { status: 500 }
    );
  }
}
