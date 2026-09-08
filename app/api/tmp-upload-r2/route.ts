// TEMPORARY — internal-only endpoint used once to finish migrating old
// Supabase-hosted photos to R2 from a local script (the local machine's
// network can't reach R2's S3 API endpoint directly, but this deployed
// app already uploads to R2 successfully every day via the same
// uploadToR2()). Protected by a shared secret so it's not a public open
// upload endpoint. Delete this whole file once the migration is done.

import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migration-secret");
  if (!secret || !process.env.TMP_MIGRATION_SECRET || secret !== process.env.TMP_MIGRATION_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ext = req.nextUrl.searchParams.get("ext") || "jpg";
  const contentType = req.nextUrl.searchParams.get("contentType") || "image/jpeg";
  const buffer = Buffer.from(await req.arrayBuffer());
  const path = `migrated/${crypto.randomUUID()}.${ext}`;

  try {
    const url = await uploadToR2(path, buffer, contentType);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "upload failed" }, { status: 500 });
  }
}
