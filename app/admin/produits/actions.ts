"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

const BUCKET = "products";
const MAX_DIMENSION = 1600;
// Storage paths are UUID-named and never reused, so uploaded images are
// immutable — safe to cache for a long time. Without this Supabase defaults
// to a 1-hour cache, and every re-fetch (e.g. Next's image optimizer
// re-pulling the original) is billed as Cached Egress.
const IMMUTABLE_CACHE_CONTROL = "31536000";

// Uploaded photos come straight off phones/cameras at full resolution.
// Downsizing + recompressing here (instead of only in the manual
// scripts/enhance-images.mjs pass) keeps every product's originals small
// from the moment they're added, so egress doesn't creep back up.
async function processImage(file: File): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const original = Buffer.from(await file.arrayBuffer());
  const isPng = file.type === "image/png";
  try {
    let pipeline = sharp(original)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });
    pipeline = isPng ? pipeline.png({ quality: 85, compressionLevel: 9 }) : pipeline.jpeg({ quality: 85, mozjpeg: true });
    const buffer = await pipeline.toBuffer();
    return { buffer, contentType: isPng ? "image/png" : "image/jpeg", ext: isPng ? "png" : "jpg" };
  } catch {
    // Unsupported/corrupt input (e.g. an odd format sharp can't decode) —
    // fall back to uploading the original rather than failing the save.
    const ext = file.name.split(".").pop() || "jpg";
    return { buffer: original, contentType: file.type || "image/jpeg", ext };
  }
}

// Lets the variant photo picker reuse a photo already uploaded to some
// product on the site, instead of only uploading a new file.
export async function getProductImages(productId: string): Promise<string[]> {
  if (!productId) return [];
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((row) => row.url);
}

function parseVariantRows(formData: FormData) {
  const colors = formData.getAll("variant_color") as string[];
  const sizes = formData.getAll("variant_size") as string[];
  const stocks = formData.getAll("variant_stock") as string[];
  const prices = formData.getAll("variant_price") as string[];
  const descriptions = formData.getAll("variant_description") as string[];
  const existingImages = formData.getAll("variant_existing_image") as string[];
  const images = formData.getAll("variant_image") as File[];
  return colors
    .map((color, i) => ({
      colorLabel: color.trim() || null,
      sizeLabel: sizes[i]?.trim() || null,
      stock: stocks[i]?.trim() ? Number(stocks[i]) : null,
      price: prices[i]?.trim() ? Number(prices[i]) : null,
      description: descriptions[i]?.trim() || null,
      existingImageUrl: existingImages[i]?.trim() || null,
      imageFile: images[i] && images[i].size > 0 ? images[i] : null,
    }))
    .filter((v) => v.colorLabel || v.sizeLabel);
}

async function uploadVariantImage(
  supabase: ReturnType<typeof createServiceClient>,
  productSlug: string,
  file: File
) {
  const { buffer, contentType, ext } = await processImage(file);
  const path = `${productSlug}/variants/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
    cacheControl: IMMUTABLE_CACHE_CONTROL,
  });
  if (error) return null;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

async function saveVariants(
  supabase: ReturnType<typeof createServiceClient>,
  productId: string,
  productSlug: string,
  formData: FormData
) {
  const rows = parseVariantRows(formData);

  const resolved = await Promise.all(
    rows.map(async (v) => ({
      product_id: productId,
      color_label: v.colorLabel,
      size_label: v.sizeLabel,
      stock: v.stock,
      price: v.price,
      description: v.description,
      image_url: v.imageFile ? await uploadVariantImage(supabase, productSlug, v.imageFile) : v.existingImageUrl,
    }))
  );

  await supabase.from("product_variants").delete().eq("product_id", productId);
  if (resolved.length === 0) return;

  const fields = resolved.map((v, i) => ({ ...v, sort_order: i }));
  const { error } = await supabase.from("product_variants").insert(fields);
  if (error) {
    // color_label/size_label come from a migration that may not have run
    // yet — retry against the older label/kind columns so saving still
    // works either way.
    const fallback = fields.map((v) => ({
      product_id: v.product_id,
      label: v.color_label || v.size_label || "",
      kind: v.color_label ? "color" : "size",
      stock: v.stock,
      price: v.price,
      description: v.description,
      image_url: v.image_url,
      sort_order: v.sort_order,
    }));
    await supabase.from("product_variants").insert(fallback);
  }
}

async function uploadImages(supabase: ReturnType<typeof createServiceClient>, productSlug: string, files: File[]) {
  const urls: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const { buffer, contentType, ext } = await processImage(file);
    const path = `${productSlug}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType,
      upsert: false,
      cacheControl: IMMUTABLE_CACHE_CONTROL,
    });
    if (error) throw error;
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(pub.publicUrl);
  }
  return urls;
}

// One packaging photo (box/pouch/cleaning cloth) per product, shown after
// the description on that product's own page.
async function savePackagingImage(
  supabase: ReturnType<typeof createServiceClient>,
  productId: string,
  productSlug: string,
  file: File | null,
  remove: boolean
) {
  if (file && file.size > 0) {
    const [url] = await uploadImages(supabase, productSlug, [file]);
    if (url) await supabase.from("products").update({ packaging_image_url: url }).eq("id", productId);
  } else if (remove) {
    await supabase.from("products").update({ packaging_image_url: null }).eq("id", productId);
  }
}

// base_color comes from a migration that may not have run yet on this
// deployment — retry without it rather than failing the whole save if
// Postgres rejects it as an unknown column.
async function insertProductSafe(supabase: ReturnType<typeof createServiceClient>, fields: Record<string, unknown>) {
  const first = await supabase.from("products").insert(fields).select("id, slug").single();
  if (!first.error) return first;
  const { base_color, ...fallback } = fields;
  return supabase.from("products").insert(fallback).select("id, slug").single();
}

async function updateProductSafe(supabase: ReturnType<typeof createServiceClient>, productId: string, fields: Record<string, unknown>) {
  const { error } = await supabase.from("products").update(fields).eq("id", productId);
  if (!error) return;
  const { base_color, ...fallback } = fields;
  await supabase.from("products").update(fallback).eq("id", productId);
}

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const brandId = String(formData.get("brand_id") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim();
  const additionalInfo = String(formData.get("additional_info") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw ? Number(priceRaw) : null;
  const discountRaw = String(formData.get("discount_percent") ?? "").trim();
  const discountPercent = discountRaw ? Number(discountRaw) : null;
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const stock = stockRaw ? Number(stockRaw) : null;
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const baseColor = String(formData.get("base_color") ?? "").trim() || null;
  const files = (formData.getAll("images") as File[]).filter((f) => f.size > 0);
  const packagingFile = formData.get("packaging_image") as File | null;

  if (!name) return;

  const supabase = createServiceClient();
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: product, error } = await insertProductSafe(supabase, {
    name,
    slug,
    category_id: categoryId,
    brand_id: brandId,
    description,
    additional_info: additionalInfo,
    price,
    discount_percent: discountPercent,
    stock,
    sku,
    base_color: baseColor,
  });

  if (error || !product) throw error;

  await saveVariants(supabase, product.id, product.slug, formData);

  const urls = await uploadImages(supabase, product.slug, files);
  if (urls.length > 0) {
    await supabase
      .from("product_images")
      .insert(urls.map((url, i) => ({ product_id: product.id, url, sort_order: i })));
  }

  await savePackagingImage(supabase, product.id, product.slug, packagingFile, false);

  revalidatePath("/admin/produits");
  revalidatePath("/", "layout");
  redirect("/admin/produits");
}

export async function updateProduct(productId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const brandId = String(formData.get("brand_id") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim();
  const additionalInfo = String(formData.get("additional_info") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw ? Number(priceRaw) : null;
  const discountRaw = String(formData.get("discount_percent") ?? "").trim();
  const discountPercent = discountRaw ? Number(discountRaw) : null;
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const stock = stockRaw ? Number(stockRaw) : null;
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const baseColor = String(formData.get("base_color") ?? "").trim() || null;
  const isActive = formData.get("is_active") === "on";
  const files = (formData.getAll("images") as File[]).filter((f) => f.size > 0);
  const packagingFile = formData.get("packaging_image") as File | null;
  const removePackaging = formData.get("remove_packaging_image") === "on";

  if (!name) return;

  const supabase = createServiceClient();
  const { data: product } = await supabase.from("products").select("slug").eq("id", productId).single();
  if (!product) return;

  await updateProductSafe(supabase, productId, {
    name,
    category_id: categoryId,
    brand_id: brandId,
    description,
    additional_info: additionalInfo,
    price,
    discount_percent: discountPercent,
    stock,
    sku,
    base_color: baseColor,
    is_active: isActive,
  });

  await saveVariants(supabase, productId, product.slug, formData);

  const urls = await uploadImages(supabase, product.slug, files);
  if (urls.length > 0) {
    const { count } = await supabase
      .from("product_images")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId);
    await supabase
      .from("product_images")
      .insert(urls.map((url, i) => ({ product_id: productId, url, sort_order: (count ?? 0) + i })));
  }

  await savePackagingImage(supabase, productId, product.slug, packagingFile, removePackaging);

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

// Shipping/returns text applies to every product at once (set once here)
// rather than per product — description AND additional info are per
// product now, set in each product's own edit page.
export async function updateGlobalProductInfo(formData: FormData) {
  const shippingInfo = String(formData.get("global_shipping_info") ?? "").trim();
  const returnsInfo = String(formData.get("returns_info") ?? "").trim();

  const supabase = createServiceClient();
  // Saved as two separate updates so a missing column on either one (e.g. a
  // migration that hasn't run in this environment) can't stop the other
  // field from saving — see the same fix on the font settings.
  await supabase.from("site_settings").update({ global_shipping_info: shippingInfo }).eq("id", true);
  await supabase.from("site_settings").update({ returns_info: returnsInfo }).eq("id", true);

  revalidatePath("/admin/reglages");
  revalidatePath("/", "layout");
}


export async function deleteProduct(productId: string) {
  const supabase = createServiceClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/admin/produits");
  revalidatePath("/", "layout");
}

export async function updateDiscount(productId: string, discountPercent: number | null) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("products")
    .update({ discount_percent: discountPercent })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/discounts");
  revalidatePath("/", "layout");
}

export async function deleteProductImage(imageId: string) {
  const supabase = createServiceClient();
  await supabase.from("product_images").delete().eq("id", imageId);
  revalidatePath("/admin/produits");
}

// Same full-recompute approach as category reordering — deterministic
// regardless of any pre-existing tied sort_order values.
export async function setProductImagePosition(productId: string, imageId: string, newIndex: number) {
  const supabase = createServiceClient();
  const { data: images } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (!images) return;

  const ordered = images.map((img) => img.id).filter((iid) => iid !== imageId);
  const clampedIndex = Math.max(0, Math.min(newIndex, ordered.length));
  ordered.splice(clampedIndex, 0, imageId);

  await Promise.all(
    ordered.map((iid, i) => supabase.from("product_images").update({ sort_order: i }).eq("id", iid))
  );

  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/admin/produits");
  revalidatePath("/", "layout");
}

// A manual related-products pick overrides the automatic category/brand
// matching shown under "Related products" on the public product page.
export async function addRelatedProduct(productId: string, relatedProductId: string) {
  if (productId === relatedProductId) return;
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("product_related_products")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase
    .from("product_related_products")
    .insert({ product_id: productId, related_product_id: relatedProductId, sort_order: count ?? 0 });
  if (error && error.code !== "23505") {
    // 23505 = already added (unique constraint) — fine, nothing to do.
    throw new Error("Couldn't add — the database may need the latest migration applied.");
  }

  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
}

export async function removeRelatedProduct(id: string, productId: string) {
  const supabase = createServiceClient();
  await supabase.from("product_related_products").delete().eq("id", id);
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
}

// "Other colors" — tags two products as different colors of the same model.
// There's no separate group table: every product sharing the same
// color_group_id shows up as a swatch on the others' pages, so joining a
// group is just adopting (or creating) that shared id.
export async function addColorLink(productId: string, otherProductId: string) {
  if (productId === otherProductId) return;
  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from("products")
    .select("id, color_group_id")
    .in("id", [productId, otherProductId]);

  const self = rows?.find((r) => r.id === productId);
  const other = rows?.find((r) => r.id === otherProductId);
  const groupId: string = self?.color_group_id ?? other?.color_group_id ?? crypto.randomUUID();

  const ids = [productId, otherProductId];
  // If the other product already belonged to a different group, everyone in
  // that old group needs to move too, or they'd silently drop out of it.
  if (other?.color_group_id && other.color_group_id !== groupId) {
    const { data: siblings } = await supabase.from("products").select("id").eq("color_group_id", other.color_group_id);
    for (const s of siblings ?? []) ids.push(s.id);
  }
  if (self?.color_group_id && self.color_group_id !== groupId) {
    const { data: siblings } = await supabase.from("products").select("id").eq("color_group_id", self.color_group_id);
    for (const s of siblings ?? []) ids.push(s.id);
  }

  await supabase.from("products").update({ color_group_id: groupId }).in("id", Array.from(new Set(ids)));

  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
}

export async function removeColorLink(productId: string, memberProductId: string) {
  const supabase = createServiceClient();
  await supabase.from("products").update({ color_group_id: null }).eq("id", memberProductId);
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
}
