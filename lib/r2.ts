import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 is S3-compatible — this is the only place the AWS SDK is
// used. Every image upload across the admin (products, brands, popups,
// hero, testimonials, footer, model photos, bulk photo uploader) goes
// through uploadToR2 instead of Supabase Storage: R2 has zero egress fees,
// which is what actually drove Supabase's "Cached Egress" quota over its
// limit — Supabase's own database/auth usage was never the problem.
const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function uploadToR2(path: string, buffer: Buffer, contentType: string): Promise<string> {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: path,
      Body: buffer,
      ContentType: contentType,
      // Paths are UUID-named and never reused (same convention as the old
      // Supabase uploads), so a year-long cache is always safe.
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${PUBLIC_URL}/${path}`;
}
