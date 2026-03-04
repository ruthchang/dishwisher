import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

async function recalculateDish(dishId: string) {
  const aggregate = await db.rating.aggregate({
    where: { dishId },
    _avg: { value: true },
    _count: { _all: true },
  });

  await db.dish.update({
    where: { id: dishId },
    data: {
      rating: aggregate._avg.value ?? 0,
      reviewCount: aggregate._count._all,
    },
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const dishId = body?.dishId as string | undefined;
  const value = Number(body?.rating);

  if (!dishId || Number.isNaN(value) || value < 0 || value > 5) {
    return NextResponse.json({ error: "Invalid rating payload." }, { status: 400 });
  }

  const dish = await db.dish.findUnique({ where: { id: dishId } });
  if (!dish) return NextResponse.json({ error: "Dish not found." }, { status: 404 });

  await db.rating.upsert({
    where: {
      dishId_userId: { dishId, userId: user.id },
    },
    update: { value },
    create: { dishId, userId: user.id, value },
  });

  await recalculateDish(dishId);
  return NextResponse.json({ ok: true });
}
