import { NextRequest, NextResponse } from "next/server";

// Server-side reverse geocoding proxy (OpenStreetMap Nominatim) so the
// browser never calls a third party directly and we can set a proper
// User-Agent as required by Nominatim's usage policy.
export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");
  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
    { headers: { "User-Agent": "house-of-optics-checkout/1.0" } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "geocoding failed" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({
    address: data.display_name ?? "",
    city: data.address?.city || data.address?.town || data.address?.village || "",
  });
}
