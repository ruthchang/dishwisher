import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { DishWishInput } from "@/data/dishes";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as DishWishInput | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const linkedDishId = body.linkedDishId?.trim() || null;
  const requestedName = body.name?.trim() || "";
  const requestedRestaurantName = body.restaurantName?.trim() || "";
  const requestedRestaurantAddress = body.restaurantAddress?.trim() || "";
  const requestedYelpBusinessId = body.yelpBusinessId?.trim() || "";
  const requestedYelpBusinessUrl = body.yelpBusinessUrl?.trim() || "";

  let name = requestedName;
  let restaurantName = requestedRestaurantName;
  let restaurantAddress = requestedRestaurantAddress;
  const yelpBusinessId = requestedYelpBusinessId;
  let yelpBusinessUrl = requestedYelpBusinessUrl;

  if (linkedDishId) {
    const linkedDish = await db.dish.findUnique({ where: { id: linkedDishId } });
    if (!linkedDish) {
      return NextResponse.json({ error: "Linked dish not found." }, { status: 404 });
    }
    if (!name) name = linkedDish.name;
    if (!restaurantName) {
      restaurantName = linkedDish.customRestaurantName?.trim() || "";
    }
    if (!restaurantAddress) {
      restaurantAddress = linkedDish.customRestaurantAddress?.trim() || "";
    }
    if (!yelpBusinessUrl) {
      yelpBusinessUrl = linkedDish.yelpBusinessUrl?.trim() || "";
    }
  }

  if (!name) {
    return NextResponse.json({ error: "Dish wish name is required." }, { status: 400 });
  }

  const created = await db.dishWish.create({
    data: {
      name,
      restaurantName: restaurantName || null,
      restaurantAddress: restaurantAddress || null,
      yelpBusinessId: yelpBusinessId || null,
      yelpBusinessUrl: yelpBusinessUrl || null,
      createdById: user.id,
      linkedDishId,
    },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
