import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { DishWishInput } from "@/data/dishes";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const wish = await db.dishWish.findUnique({ where: { id } });
    if (!wish) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (wish.createdById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as DishWishInput | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const name = body.name?.trim() || "";
    if (!name) {
      return NextResponse.json({ error: "Wish name is required." }, { status: 400 });
    }

    const baseData = {
      name,
      restaurantName: body.restaurantName?.trim() || null,
      restaurantAddress: body.restaurantAddress?.trim() || null,
    };

    try {
      await db.dishWish.update({
        where: { id },
        data: {
          ...baseData,
          yelpBusinessId: body.yelpBusinessId?.trim() || null,
          yelpBusinessUrl: body.yelpBusinessUrl?.trim() || null,
        },
      });
    } catch (error) {
      // Fallback for environments where Yelp fields haven't been migrated yet.
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (
        message.includes("yelpbusinessid") ||
        message.includes("yelpbusinessurl") ||
        message.includes("column")
      ) {
        await db.dishWish.update({
          where: { id },
          data: baseData,
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update wish.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const wish = await db.dishWish.findUnique({ where: { id } });
  if (!wish) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (wish.createdById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.dishWish.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
