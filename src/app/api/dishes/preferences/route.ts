import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

type PreferenceType = "wishlisted" | "favorited" | "recommended";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { dishId?: string; type?: PreferenceType; value?: boolean }
    | null;

  const dishId = body?.dishId?.trim() || "";
  const type = body?.type;
  const value = body?.value;

  if (!dishId || (type !== "wishlisted" && type !== "favorited" && type !== "recommended") || typeof value !== "boolean") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const dish = await db.dish.findUnique({ where: { id: dishId }, select: { id: true } });
  if (!dish) return NextResponse.json({ error: "Dish not found." }, { status: 404 });

  const existing = await db.userDishPreference.findUnique({
    where: {
      userId_dishId: {
        userId: user.id,
        dishId,
      },
    },
  });

  const baseData = existing
    ? {
        wishlisted: existing.wishlisted,
        favorited: existing.favorited,
        recommended: existing.recommended,
      }
    : {
        wishlisted: false,
        favorited: false,
        recommended: false,
      };

  const nextData = {
    ...baseData,
    [type]: value,
  };

  const record = await db.userDishPreference.upsert({
    where: {
      userId_dishId: {
        userId: user.id,
        dishId,
      },
    },
    update: nextData,
    create: {
      userId: user.id,
      dishId,
      ...nextData,
    },
  });

  return NextResponse.json({
    ok: true,
    dishId,
    wishlisted: record.wishlisted,
    favorited: record.favorited,
    recommended: record.recommended,
  });
}
