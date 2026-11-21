import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const apiKey = process.env.GEOAPIFY_API_KEY;
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
    if (city) {
      const params = new URLSearchParams({ text: city, format: "json", limit: "1", apiKey });
      const response = await fetch("https://api.geoapify.com/v1/geocode/search?" + params, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Location lookup failed");
      const result = (await response.json()).results?.[0];
      if (!result) return NextResponse.json({ error: "Location not found. Try a city and country." }, { status: 400 });
      lat = result.lat; lon = result.lon;
    }
    const params = new URLSearchParams({ categories: "catering", name: q, bias: `proximity:${lon},${lat}`, limit: "8", apiKey });
    if (city) params.set("filter", `circle:${lon},${lat},50000`);
    const response = await fetch("https://api.geoapify.com/v2/places?" + params, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return NextResponse.json({ error: response.status === 429 ? "Search limit reached. Try later or enter manually." : "Restaurant search unavailable. You can enter manually." }, { status: 502 });
    const payload = await response.json();
    const features: { properties: { place_id?: string; name?: string; formatted?: string; lat?: number; lon?: number } }[] = Array.isArray(payload.features) ? payload.features : [];
    return NextResponse.json({ matches: features.filter(f => f.properties?.place_id && f.properties?.name).map(({properties:p}) => ({ id: p.place_id, name: p.name, address: p.formatted || "", cuisine: "Restaurant", yelpUrl: "", provider: "geoapify", latitude: p.lat, longitude: p.lon })), attribution: { provider: "Geoapify", providerUrl: "https://www.geoapify.com" } });
  } catch {
    return NextResponse.json({ error: "Restaurant lookup unavailable. You can enter manually." }, { status: 502 });
  }
}
