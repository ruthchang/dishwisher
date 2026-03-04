import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  destroySessionFromCookies,
} from "@/lib/auth";

export async function POST() {
  await destroySessionFromCookies();
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
