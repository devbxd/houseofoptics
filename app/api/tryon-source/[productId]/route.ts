import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Proxies a product's main photo same-origin so the browser can run
// background removal on its pixels — a client-side fetch() straight to R2
// would otherwise need CORS headers we don't control there.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.url) return NextResponse.json({ error: "No photo for this product" }, { status: 404 });

  const res = await fetch(data.url);
  if (!res.ok) return NextResponse.json({ error: "Source photo unavailable" }, { status: 502 });

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
