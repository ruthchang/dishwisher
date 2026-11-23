import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 200) : "";
  const cuisine = typeof body?.cuisine === "string" ? body.cuisine.trim().slice(0, 100) : "";
  const friendProfileId = typeof body?.friendProfileId === "string" ? body.friendProfileId : "";
  const rating = body?.friendRating === "" || body?.friendRating == null ? null : Number(body.friendRating);
  const ownRating = body?.rating === "" || body?.rating == null ? null : Number(body.rating);
  if (!name || !cuisine || (rating !== null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) ||
    (ownRating !== null && (!Number.isFinite(ownRating) || ownRating < 1 || ownRating > 5))) {
    return NextResponse.json({ error: "Dish, cuisine, or rating is invalid." }, { status: 400 });
  }
  if (friendProfileId) {
    const friend = await db.friendProfile.findFirst({ where: { id: friendProfileId, createdById: user.id, claimedUserId: null } });
    if (!friend) return NextResponse.json({ error: "Friend unavailable." }, { status: 404 });
  }
  const dish = await db.$transaction(async (tx) => {
    const created = await tx.dish.create({
      data: { name, cuisine, description: typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "",
        category: "Uncategorized", tags: [], createdById: user.id },
    });
    if (ownRating !== null) await tx.rating.create({ data: { dishId: created.id, userId: user.id, value: ownRating } });
    if (friendProfileId) await tx.friendRating.create({
      data: { dishId: created.id, friendProfileId, value: rating, enteredById: user.id },
    });
    if (ownRating !== null) await tx.dish.update({
      where: { id: created.id }, data: { rating: ownRating, reviewCount: 1 },
    });
    return created;
  });
  return NextResponse.json({ ok: true, id: dish.id }, { status: 201 });
}
