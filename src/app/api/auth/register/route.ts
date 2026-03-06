import { NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { createSession, hashPassword, setSessionCookie } from "@/lib/auth";

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
  if (
    message.includes("the url must start with the protocol `file:`") ||
    message.includes("provider = \"sqlite\"")
  ) {
    return {
      status: 500,
      message:
        "Prisma client/schema mismatch detected. Run `npm run db:generate` for Postgres and restart the dev server.",
    };
  }
  return {
    status: 500,
    message: "Server error while creating account. Please try again.",
  };
}

export async function POST(req: Request) {
  try {
    return await withDbRetry(async () => {
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
    }, 2);
  } catch (error) {
    console.error("[DishWisher] register failed", error);
    const classified = classifyAuthDbError(error);
    return NextResponse.json({ error: classified.message }, { status: classified.status });
  }
}
