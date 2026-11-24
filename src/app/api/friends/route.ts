import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Only the creating user can enter unverified recommendations for a friend.
// Claimed profiles must be edited by their verified owner through a separate flow.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profiles = await db.friendProfile.findMany({
    where: { createdById: user.id },
    select: { id: true, displayName: true, email: true, claimedUserId: true },
    orderBy: { displayName: "asc" },
  });
  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim().slice(0, 200) : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  if (!displayName || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return NextResponse.json({ error: "Valid name and optional email required." }, { status: 400 });
  }
  const profile = await db.friendProfile.create({
    data: { displayName, email: email || null, createdById: user.id },
    select: { id: true, displayName: true, email: true },
  });
  return NextResponse.json({ profile }, { status: 201 });
}
