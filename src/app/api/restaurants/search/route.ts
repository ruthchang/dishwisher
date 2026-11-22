import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const maxDuration = 30;

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "Geoapify is not configured. You can still enter manually." }, { status: 501 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const city = url.searchParams.get("city")?.trim() || "";
  if (q.length < 2 || q.length > 200 || city.length > 200) return NextResponse.json({ error: "Invalid search query." }, { status: 400 });
  let lat = Number(url.searchParams.get("lat") || "37.287");
  let lon = Number(url.searchParams.get("lng") || "-121.95");
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) {
    lat = 37.287; lon = -121.95;
  }
  try {
    const params = new URLSearchParams({
      text: city ? q + ", " + city : q,
      type: "amenity",
      format: "json",
      limit: "8",
      apiKey,
    });
    if (!city) params.set("bias", `proximity:${lon},${lat}`);
    const response = await fetch("https://api.geoapify.com/v1/geocode/search?" + params, { signal: AbortSignal.timeout(22000) });
    if (!response.ok) return NextResponse.json({ error: response.status === 429 ? "Search limit reached. Try later or enter manually." : `Geoapify restaurant search failed (HTTP ${response.status}). ${response.status === 401 || response.status === 403 ? "Check API key and project restrictions." : "You can enter manually."}` }, { status: 502 });
    const payload = await response.json();
    const results: { place_id?: string; name?: string; formatted?: string; lat?: number; lon?: number; result_type?: string }[] = Array.isArray(payload.results) ? payload.results : [];
    return NextResponse.json({ matches: results.filter(p => p.place_id && p.name && p.result_type === "amenity").map(p => ({ id: p.place_id, name: p.name, address: p.formatted || "", cuisine: "Restaurant", yelpUrl: "", provider: "geoapify", latitude: p.lat, longitude: p.lon })), attribution: { provider: "Geoapify", providerUrl: "https://www.geoapify.com" } });
  } catch (error) {
    const kind = error instanceof Error ? error.name : "UnknownError";
    console.error("Geoapify lookup failed:", kind);
    return NextResponse.json({ error: `Restaurant lookup unavailable (${kind}). You can enter manually.` }, { status: 502 });
  }
}
