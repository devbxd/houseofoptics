"use server";

import { processImage } from "@/lib/process-image";
import { uploadToR2 } from "@/lib/r2";

// Uploads the customer's reference photo so the WhatsApp message can link
// to it — WhatsApp's click-to-chat links can only pre-fill text, there's
// no way to pre-attach an actual image file, so a link to the uploaded
// photo is the closest equivalent.
export async function uploadSpecialRequestPhoto(formData: FormData): Promise<{ url: string | null }> {
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { url: null };

  try {
    const { buffer, contentType, ext } = await processImage(file);
    const path = `special-requests/${crypto.randomUUID()}.${ext}`;
    const url = await uploadToR2(path, buffer, contentType);
    return { url };
  } catch {
    return { url: null };
  }
}
