"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

const BUCKET = "products";

function parseVariantRows(formData: FormData, prefix: string) {
  const labels = formData.getAll(`${prefix}_label`) as string[];
  const stocks = formData.getAll(`${prefix}_stock`) as string[];
  const prices = formData.getAll(`${prefix}_price`) as string[];
  const descriptions = formData.getAll(`${prefix}_description`) as string[];
  const existingImages = formData.getAll(`${prefix}_existing_image`) as string[];
  const images = formData.getAll(`${prefix}_image`) as File[];
  return labels
    .map((label, i) => ({
      label: label.trim(),
      stock: stocks[i]?.trim() ? Number(stocks[i]) : null,
      price: prices[i]?.trim() ? Number(prices[i]) : null,
      description: descriptions[i]?.trim() || null,
      existingImageUrl: existingImages[i]?.trim() || null,
      imageFile: images[i] && images[i].size > 0 ? images[i] : null,
    }))
    .filter((v) => v.label.length > 0);
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
  const colorRows = parseVariantRows(formData, "variant_color");
  const sizeRows = parseVariantRows(formData, "variant_size");
  const rows = [
    ...colorRows.map((v) => ({ ...v, kind: "color" as const })),
    ...sizeRows.map((v) => ({ ...v, kind: "size" as const })),
  ];

  const resolved = await Promise.all(
    rows.map(async (v) => ({
      product_id: productId,
      label: v.label,
      stock: v.stock,
      price: v.price,
      description: v.description,
      kind: v.kind,
      image_url: v.imageFile ? await uploadVariantImage(supabase, productSlug, v.imageFile) : v.existingImageUrl,
    }))
  );

  await supabase.from("product_variants").delete().eq("product_id", productId);
  if (resolved.length > 0) {
    await supabase.from("product_variants").insert(resolved.map((v, i) => ({ ...v, sort_order: i })));
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
  const files = (formData.getAll("images") as File[]).filter((f) => f.size > 0);

  if (!name) return;

  const supabase = createServiceClient();
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: product, error } = await supabase
    .from("products")
    .insert({ name, slug, category_id: categoryId, brand_id: brandId, description, price, discount_percent: discountPercent, stock, sku })
    .select("id, slug")
    .single();

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
  const isActive = formData.get("is_active") === "on";
  const files = (formData.getAll("images") as File[]).filter((f) => f.size > 0);

  if (!name) return;

  const supabase = createServiceClient();
  const { data: product } = await supabase.from("products").select("slug").eq("id", productId).single();
  if (!product) return;

  await supabase
    .from("products")
    .update({ name, category_id: categoryId, brand_id: brandId, description, price, discount_percent: discountPercent, stock, sku, is_active: isActive })
    .eq("id", productId);

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
