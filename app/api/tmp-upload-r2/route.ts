import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migration-secret");
  if (!secret || !process.env.TMP_MIGRATION_SECRET || secret !== process.env.TMP_MIGRATION_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { dataBase64, ext, contentType } = await req.json();
  const buffer = Buffer.from(dataBase64, "base64");
  const path = `migrated/${crypto.randomUUID()}.${ext}`;

  try {
    const url = await uploadToR2(path, buffer, contentType);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "upload failed" }, { status: 500 });
  }
}
