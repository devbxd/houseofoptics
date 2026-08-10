"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

const BUCKET = "products";

// Lets the variant photo picker offer "reuse a photo already in this
// category" instead of only uploading a new file.
export async function getCategoryImages(categoryId: string | null): Promise<string[]> {
  if (!categoryId) return [];
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("images:product_images(url)")
    .eq("category_id", categoryId);

  const urls = new Set<string>();
  for (const p of data ?? []) {
    for (const img of (p as any).images ?? []) urls.add(img.url);
  }
  return Array.from(urls);
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
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${productSlug}/variants/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
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
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${productSlug}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(pub.publicUrl);
  }
  return urls;
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
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw ? Number(priceRaw) : null;
  const discountRaw = String(formData.get("discount_percent") ?? "").trim();
  const discountPercent = discountRaw ? Number(discountRaw) : null;
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const stock = stockRaw ? Number(stockRaw) : null;
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const baseColor = String(formData.get("base_color") ?? "").trim() || null;
  const files = (formData.getAll("images") as File[]).filter((f) => f.size > 0);

  if (!name) return;

  const supabase = createServiceClient();
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: product, error } = await insertProductSafe(supabase, {
    name,
    slug,
    category_id: categoryId,
    brand_id: brandId,
    description,
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

  revalidatePath("/admin/produits");
  revalidatePath("/", "layout");
  redirect("/admin/produits");
}

export async function updateProduct(productId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const brandId = String(formData.get("brand_id") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim();
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

  if (!name) return;

  const supabase = createServiceClient();
  const { data: product } = await supabase.from("products").select("slug").eq("id", productId).single();
  if (!product) return;

  await updateProductSafe(supabase, productId, {
    name,
    category_id: categoryId,
    brand_id: brandId,
    description,
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

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

// Additional info / shipping text applies to every product at once (set
// once here) rather than per product — only the description is per-product.
export async function updateGlobalProductInfo(formData: FormData) {
  const additionalInfo = String(formData.get("global_additional_info") ?? "").trim();
  const shippingInfo = String(formData.get("global_shipping_info") ?? "").trim();

  const supabase = createServiceClient();
  await supabase
    .from("site_settings")
    .update({ global_additional_info: additionalInfo, global_shipping_info: shippingInfo })
    .eq("id", true);

  revalidatePath("/admin/produits");
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
