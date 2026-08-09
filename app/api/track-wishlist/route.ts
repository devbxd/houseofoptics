import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { productId } = await request.json().catch(() => ({ productId: "" }));
  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const supabase = createServiceClient();
  await supabase.from("wishlist_events").insert({ product_id: productId });
  return NextResponse.json({ ok: true });
}
