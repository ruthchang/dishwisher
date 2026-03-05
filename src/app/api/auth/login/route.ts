import { NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import {
  createSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

function classifyAuthDbError(error: unknown): {
  status: number;
  message: string;
} {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (
    message.includes("p1001") ||
    message.includes("postgresql connection") ||
    message.includes("kind: closed") ||
    message.includes("timed out")
  ) {
    return {
      status: 503,
      message: "Database is temporarily unavailable. Please try again shortly.",
    };
  }
  return {
    status: 500,
    message: "Server error while logging in. Please try again.",
  };
}

export async function POST(req: Request) {
  try {
    return await withDbRetry(async () => {
      const body = await req.json().catch(() => null);
      const email = body?.email?.trim().toLowerCase();
      const password = body?.password;

      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required." },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
      }

      const token = await createSession(user.id);
      const response = NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email },
      });
      setSessionCookie(response, token);
      return response;
    }, 2);
  } catch (error) {
    console.error("[DishWisher] login failed", error);
    const classified = classifyAuthDbError(error);
    return NextResponse.json({ error: classified.message }, { status: classified.status });
  }
}
