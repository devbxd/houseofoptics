import sharp from "sharp";

const MAX_DIMENSION = 1600;

// Storage paths are UUID-named and never reused, so uploaded images are
// immutable — safe to cache for a long time. Without this Supabase defaults
// to a 1-hour cache, and every re-fetch (e.g. Next's image optimizer
// re-pulling the original) is billed as Cached Egress.
export const IMMUTABLE_CACHE_CONTROL = "31536000";

// Every admin upload (logos, banners, testimonial/model photos, popup and
// content images...) goes through here so none of them ship a raw,
// full-resolution phone photo: that both bloats Supabase egress and risks
// exceeding the Server Actions body size limit before this code even runs
// for the *next* upload on the same page.
//
// WebP instead of JPEG/PNG — typically 25-35% smaller than a JPEG at the
// same visual quality, and (unlike JPEG) still supports transparency, so
// one codepath now covers what used to need a PNG branch. Every browser
// this site needs to support has read WebP for years. This only shrinks
// *new* uploads going forward — it doesn't shrink images already sitting
// in storage from before this change.
export async function processImage(file: File): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const original = Buffer.from(await file.arrayBuffer());
  try {
    const buffer = await sharp(original)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { buffer, contentType: "image/webp", ext: "webp" };
  } catch {
    // Unsupported/corrupt input (e.g. an odd format sharp can't decode) —
    // fall back to uploading the original rather than failing the save.
    const ext = file.name.split(".").pop() || "jpg";
    return { buffer: original, contentType: file.type || "image/jpeg", ext };
  }
}
