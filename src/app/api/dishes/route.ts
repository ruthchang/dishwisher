import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Dish } from "@/data/dishes";

function customRestaurantId(name: string): string {
  return `custom-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

function yelpRestaurantId(yelpBusinessId: string): string {
  return `yelp-${yelpBusinessId}`;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Dish | null;
  if (!body?.name || !body.category || !body.restaurantId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const tags = Array.isArray(body.tags) ? body.tags : [];
  const isCustom = body.restaurantId.startsWith("custom-");
  const isYelp = body.restaurantId.startsWith("yelp-");
  const restaurantName = body.customRestaurantName?.trim() || "";
  const restaurantAddress = body.customRestaurantAddress?.trim() || "";
  const restaurantCuisine = body.customRestaurantCuisine?.trim() || "Restaurant";

  let restaurantId = body.restaurantId;
  if (isCustom && restaurantName) {
    restaurantId = customRestaurantId(restaurantName);
    await db.restaurant.upsert({
      where: { id: restaurantId },
      update: {
        name: restaurantName,
        address: restaurantAddress,
      },
      create: {
        id: restaurantId,
        name: restaurantName,
        address: restaurantAddress,
        cuisine: "User Added",
        rating: 0,
        priceRange: "$$",
        isUserCreated: true,
      },
    });
  }
  if (isYelp && restaurantName) {
    const parsedYelpId = body.restaurantId.replace(/^yelp-/, "").trim();
    if (parsedYelpId) {
      restaurantId = yelpRestaurantId(parsedYelpId);
      await db.restaurant.upsert({
        where: { id: restaurantId },
        update: {
          name: restaurantName,
          address: restaurantAddress,
          cuisine: restaurantCuisine,
          isUserCreated: false,
        },
        create: {
          id: restaurantId,
          name: restaurantName,
          address: restaurantAddress,
          cuisine: restaurantCuisine,
          rating: 0,
          priceRange: "$$",
          isUserCreated: false,
        },
      });
    }
  }

  const dish = await db.dish.create({
    data: {
      name: body.name.trim(),
      restaurantId,
      customRestaurantName: restaurantName || null,
      customRestaurantAddress: restaurantAddress || null,
      yelpBusinessUrl: body.yelpBusinessUrl?.trim() || null,
      description: body.description?.trim() || "",
      price: body.price ?? null,
      category: body.category.trim(),
      imageUrl: body.imageUrl ?? null,
      tags,
      createdById: user.id,
    },
  });

  const initialValue = body.rating && body.rating > 0 ? body.rating : 0;
  if (initialValue > 0) {
    await db.rating.create({
      data: {
        dishId: dish.id,
        userId: user.id,
        value: initialValue,
      },
    });
    await db.dish.update({
      where: { id: dish.id },
      data: {
        rating: initialValue,
        reviewCount: 1,
      },
    });
  }

  return NextResponse.json({ ok: true, id: dish.id });
}
