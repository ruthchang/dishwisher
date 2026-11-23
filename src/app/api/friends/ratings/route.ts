import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const friendProfileId = typeof body?.friendProfileId === "string" ? body.friendProfileId : "";
  const dishId = typeof body?.dishId === "string" ? body.dishId : "";
  const value = body?.rating === null || body?.rating === "" ? null : Number(body?.rating);
  if (!friendProfileId || !dishId || (value !== null && (!Number.isFinite(value) || value < 1 || value > 5))) {
    return NextResponse.json({ error: "Invalid friend rating." }, { status: 400 });
  }
  const [friend, dish] = await Promise.all([
    db.friendProfile.findFirst({ where: { id: friendProfileId, createdById: user.id, claimedUserId: null } }),
    db.dish.findFirst({ where: { id: dishId, createdById: user.id } }),
  ]);
  if (!friend || !dish) return NextResponse.json({ error: "Friend or dish unavailable." }, { status: 404 });
  const rating = await db.friendRating.upsert({
    where: { friendProfileId_dishId: { friendProfileId, dishId } },
    update: { value, enteredById: user.id, confirmedAt: null },
    create: { friendProfileId, dishId, value, enteredById: user.id },
  });
  return NextResponse.json({ ok: true, id: rating.id });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dishId = new URL(request.url).searchParams.get("dishId");
  if (!dishId) return NextResponse.json({ error: "dishId required" }, { status: 400 });
  const ratings = await db.friendRating.findMany({
    where: { dishId, friendProfile: { createdById: user.id } },
    select: { id: true, value: true, confirmedAt: true, friendProfile: { select: { id: true, displayName: true } } },
  });
  return NextResponse.json({ ratings });
}
