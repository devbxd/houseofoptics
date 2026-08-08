"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

const BUCKET = "products";

function parseVariants(formData: FormData) {
  const labels = formData.getAll("variant_label") as string[];
  const stocks = formData.getAll("variant_stock") as string[];
  return labels
    .map((label, i) => ({ label: label.trim(), stock: stocks[i]?.trim() ? Number(stocks[i]) : null }))
    .filter((v) => v.label.length > 0);
}

async function saveVariants(supabase: ReturnType<typeof createServiceClient>, productId: string, formData: FormData) {
  const variants = parseVariants(formData);
  await supabase.from("product_variants").delete().eq("product_id", productId);
  if (variants.length > 0) {
    await supabase.from("product_variants").insert(
      variants.map((v, i) => ({ product_id: productId, label: v.label, stock: v.stock, sort_order: i }))
    );
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

  await saveVariants(supabase, product.id, formData);

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

  await saveVariants(supabase, productId, formData);

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
  revalidatePath("/", "layout");
  redirect("/admin/produits");
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
