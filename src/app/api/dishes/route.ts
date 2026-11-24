import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Dish } from "@/data/dishes";

function customRestaurantId(name: string): string {
  return `custom-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Dish | null;
  if (!body?.name || !body.restaurantId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  const friendId=typeof body.friendProfileId==="string"?body.friendProfileId.trim():"";
  const friendName=typeof body.friendName==="string"?body.friendName.trim().slice(0,200):"";
  const friendRating=body.friendRating??null;
  if(friendRating!==null&&(!Number.isFinite(friendRating)||friendRating<1||friendRating>5||(!friendId&&!friendName)))return NextResponse.json({error:"Invalid friend rating."},{status:400});
  if(friendId&&!await db.friendProfile.findFirst({where:{id:friendId,createdById:user.id,claimedUserId:null}}))return NextResponse.json({error:"Friend unavailable."},{status:404});
  const category = body.category?.trim() || "Uncategorized";

  const tags = Array.isArray(body.tags) ? body.tags : [];
  const isCustom = body.restaurantId.startsWith("custom-");
  const isYelp = body.restaurantId.startsWith("yelp-") || body.restaurantId.startsWith("geoapify-");
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
    const parsedYelpId = body.restaurantId.replace(/^(yelp|geoapify)-/, "").trim();
    if (parsedYelpId) {
      restaurantId = body.restaurantId;
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

  const dish = await db.$transaction(async tx=>{
  const dish = await tx.dish.create({
    data: {
      name: body.name.trim(),
      restaurantId,
      customRestaurantName: restaurantName || null,
      customRestaurantAddress: restaurantAddress || null,
      yelpBusinessUrl: body.yelpBusinessUrl?.trim() || null,
      description: body.description?.trim() || "",
      price: body.price ?? null,
      category,
      imageUrl: body.imageUrl ?? null,
      tags,
      createdById: user.id,
    },
  });

  const initialValue = body.rating && body.rating > 0 ? body.rating : 0;
  if (initialValue > 0) {
    await tx.rating.create({
      data: {
        dishId: dish.id,
        userId: user.id,
        value: initialValue,
      },
    });
    await tx.dish.update({
      where: { id: dish.id },
      data: {
        rating: initialValue,
        reviewCount: 1,
      },
    });
  }

  if(friendId||friendName){
    const profile=friendId?await tx.friendProfile.findFirst({where:{id:friendId,createdById:user.id,claimedUserId:null}}):await tx.friendProfile.create({data:{displayName:friendName,createdById:user.id}});
    if(!profile)throw Error("Friend unavailable.");
    await tx.friendRating.create({data:{dishId:dish.id,friendProfileId:profile.id,enteredById:user.id,value:friendRating}});
  }
  return dish;
  });
  return NextResponse.json({ ok: true, id: dish.id });
}
