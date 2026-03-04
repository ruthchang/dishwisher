import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Name, email, and password (6+ chars) are required." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { name, email, passwordHash },
  });

  const token = await createSession(user.id);
  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
  setSessionCookie(response, token);
  return response;
}
