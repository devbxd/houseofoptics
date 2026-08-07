import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { path } = await request.json().catch(() => ({ path: "" }));
  const supabase = createServiceClient();
  await supabase.from("page_views").insert({ path: String(path || "/").slice(0, 300) });
  return NextResponse.json({ ok: true });
}
