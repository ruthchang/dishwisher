import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const YELP_SEARCH_URL = "https://api.yelp.com/v3/businesses/search";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Yelp API is not configured." },
      { status: 501 }
    );
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim() || "";
  const lat = url.searchParams.get("lat")?.trim() || "";
  const lng = url.searchParams.get("lng")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters." },
      { status: 400 }
    );
  }

  const yelpParams = new URLSearchParams({
    term: query,
    limit: "8",
    sort_by: "best_match",
    categories: "restaurants,food",
  });

  if (lat && lng) {
    yelpParams.set("latitude", lat);
    yelpParams.set("longitude", lng);
  } else {
    yelpParams.set("location", "Campbell, CA");
  }

  const response = await fetch(`${YELP_SEARCH_URL}?${yelpParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    return NextResponse.json(
      { error: `Yelp search failed (${response.status}). ${payload.slice(0, 120)}` },
      { status: 502 }
    );
  }

  const payload = await response.json();
  const matches = Array.isArray(payload.businesses) ? payload.businesses : [];

  return NextResponse.json({
    matches: matches.map((business: Record<string, unknown>) => {
      const location =
        typeof business.location === "object" && business.location
          ? (business.location as Record<string, unknown>)
          : {};
      const categories = Array.isArray(business.categories)
        ? (business.categories as Array<Record<string, unknown>>)
        : [];
      const displayAddress = Array.isArray(location.display_address)
        ? (location.display_address as unknown[])
            .filter((line): line is string => typeof line === "string")
            .join(", ")
        : "";
      return {
        id: String(business.id || ""),
        name: String(business.name || ""),
        address: displayAddress,
        cuisine: String(categories[0]?.title || "Restaurant"),
        yelpUrl: String(business.url || ""),
      };
    }),
    attribution: {
      provider: "Yelp",
      providerUrl: "https://www.yelp.com",
    },
  });
}
