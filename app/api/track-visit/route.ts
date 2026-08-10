import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createServiceClient();
  await supabase.from("site_visits").insert({});
  return NextResponse.json({ ok: true });
}
