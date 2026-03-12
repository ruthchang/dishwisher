import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { s3Config } from "@/lib/s3";

function isAllowedHost(host: string): boolean {
  const normalized = host.toLowerCase();

  const allowed = new Set<string>();
  if (s3Config.publicBaseUrl) {
    try {
      allowed.add(new URL(s3Config.publicBaseUrl).host.toLowerCase());
    } catch {
      // Ignore malformed optional env.
    }
  }
  if (s3Config.bucket && s3Config.region) {
    allowed.add(`${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com`.toLowerCase());
  }
  if (s3Config.bucket) {
    allowed.add(`${s3Config.bucket}.s3.amazonaws.com`.toLowerCase());
  }

  return allowed.has(normalized);
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const source = url.searchParams.get("url") || "";
  if (!source) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(source);
  } catch {
    return NextResponse.json({ error: "Invalid source URL." }, { status: 400 });
  }

  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only https sources are allowed." }, { status: 400 });
  }
  if (!isAllowedHost(parsed.host)) {
    return NextResponse.json({ error: "Source host is not allowed." }, { status: 403 });
  }

  const upstream = await fetch(parsed.toString(), { cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Could not fetch source image (${upstream.status}).` },
      { status: 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Source is not an image." }, { status: 400 });
  }

  const bytes = await upstream.arrayBuffer();
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
