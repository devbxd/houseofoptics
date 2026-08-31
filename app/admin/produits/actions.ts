"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { processImage } from "@/lib/process-image";
import { uploadToR2 } from "@/lib/r2";

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
  const existingImageLists = formData.getAll("variant_existing_images") as string[];
  return colors
    .map((color, i) => {
      // Every color photo — newly picked or already saved — is uploaded
      // ahead of time by uploadVariantPhoto() as soon as it's picked in the
      // admin, one small request per photo, and arrives here purely as a
      // URL in this JSON list. Nothing about a save's size depends on how
      // many photos a color has anymore — see uploadVariantPhoto below for
      // why that used to silently cap a color at 1 photo.
      let existingImageUrls: string[] = [];
      try {
        const parsed = existingImageLists[i] ? JSON.parse(existingImageLists[i]) : [];
        if (Array.isArray(parsed)) existingImageUrls = parsed.filter((u) => typeof u === "string" && u);
      } catch {
        // malformed JSON — treat as no extra photos rather than failing the save
      }
      return {
        colorLabel: color.trim() || null,
        sizeLabel: sizes[i]?.trim() || null,
        stock: stocks[i]?.trim() ? Number(stocks[i]) : null,
        price: prices[i]?.trim() ? Number(prices[i]) : null,
        description: descriptions[i]?.trim() || null,
        existingImageUrl: existingImages[i]?.trim() || null,
        imageFile: images[i] && images[i].size > 0 ? images[i] : null,
        existingImageUrls,
      };
    })
    .filter((v) => v.colorLabel || v.sizeLabel);
}

// Uploads one variant photo the moment it's picked in the admin, instead of
// bundling every color's photos into the one big product-save submission.
// That submission has a 15MB total body cap (see next.config.ts) shared by
// the base photos, packaging photo AND every color's photos combined — a
// handful of full-size phone photos blows past that easily, and the whole
// save was silently rejected, which looked like "stuck at 1 photo" since
// nothing after the first upload survived. Each call here is its own tiny
// request, so the count of photos a color can have is no longer bounded by
// the save's total size at all.
export async function uploadVariantPhoto(formData: FormData): Promise<string> {
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) throw new Error("No photo provided");
  const { buffer, contentType, ext } = await processImage(file);
  const path = `variants/${crypto.randomUUID()}.${ext}`;
  return uploadToR2(path, buffer, contentType);
}

async function uploadVariantImage(productSlug: string, file: File) {
  const { buffer, contentType, ext } = await processImage(file);
  const path = `${productSlug}/variants/${crypto.randomUUID()}.${ext}`;
  try {
    return await uploadToR2(path, buffer, contentType);
  } catch {
    return null;
  }
}

async function saveVariants(
  supabase: ReturnType<typeof createServiceClient>,
  productId: string,
  productSlug: string,
  formData: FormData
) {
  const rows = parseVariantRows(formData);

  // Snapshot stock before the delete-and-reinsert below, keyed by
  // color/size label pair rather than row id — every save destroys and
  // recreates all variant rows, so a variant's id never survives a save
  // and can't be used to tell "was this out of stock before this save".
  const { data: oldVariants } = await supabase
    .from("product_variants")
    .select("color_label, size_label, stock")
    .eq("product_id", productId);
  const oldStockByKey = new Map<string, number | null>();
  for (const v of oldVariants ?? []) {
    oldStockByKey.set(`${v.color_label ?? ""}|${v.size_label ?? ""}`, v.stock);
  }

  const resolved = await Promise.all(
    rows.map(async (v) => {
      // Every photo in existingImageUrls was already uploaded (via
      // uploadVariantPhoto, called as soon as it was picked in the admin) —
      // nothing left to upload here. Sizes and legacy rows never have any.
      const imageUrls = v.existingImageUrls;

      return {
        product_id: productId,
        color_label: v.colorLabel,
        size_label: v.sizeLabel,
        // label/kind are the older columns product_variants started with —
        // label is still NOT NULL, so an insert that only sets
        // color_label/size_label always fails and silently falls back to
        // the legacy-only insert below, which never writes color_label/
        // size_label at all. Setting both column pairs here means every
        // save writes color_label/size_label directly instead of relying
        // on the fallback (search and anything else reading color_label
        // straight, without the label/kind fallback fetchProductBySlug
        // applies, was never seeing these rows as a result).
        label: v.colorLabel || v.sizeLabel || "",
        kind: v.colorLabel ? "color" : "size",
        stock: v.stock,
        price: v.price,
        description: v.description,
        // Kept in sync as a single-photo fallback for any code path still
        // reading image_url instead of the real image_urls gallery.
        image_url: imageUrls[0] ?? (v.imageFile ? await uploadVariantImage(productSlug, v.imageFile) : v.existingImageUrl),
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      };
    })
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

  // A null stock means "not tracked, always available" — never "out of
  // stock" — so only a non-null, <=0 old value counts as out.
  const { notifyStockRestocked } = await import("@/lib/notify-stock");
  await Promise.all(
    fields.map((v) => {
      const oldStock = oldStockByKey.get(`${v.color_label ?? ""}|${v.size_label ?? ""}`);
      const wasOut = oldStock != null && oldStock <= 0;
      const isIn = v.stock == null || v.stock > 0;
      return wasOut && isIn ? notifyStockRestocked(productId, v.color_label, v.size_label) : Promise.resolve();
    })
  );
}

async function uploadImages(productSlug: string, files: File[]) {
  const urls: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const { buffer, contentType, ext } = await processImage(file);
    const path = `${productSlug}/${crypto.randomUUID()}.${ext}`;
    urls.push(await uploadToR2(path, buffer, contentType));
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
    const [url] = await uploadImages(productSlug, [file]);
    if (url) await supabase.from("products").update({ packaging_image_url: url }).eq("id", productId);
  } else if (remove) {
    await supabase.from("products").update({ packaging_image_url: null }).eq("id", productId);
  }
}

// base_color/base_size come from migrations that may not have run yet on
// this deployment — retry without them rather than failing the whole save
// if Postgres rejects them as unknown columns.
async function insertProductSafe(supabase: ReturnType<typeof createServiceClient>, fields: Record<string, unknown>) {
  const first = await supabase.from("products").insert(fields).select("id, slug").single();
  if (!first.error) return first;
  const { base_color, base_size, ...fallback } = fields;
  return supabase.from("products").insert(fallback).select("id, slug").single();
}

async function updateProductSafe(supabase: ReturnType<typeof createServiceClient>, productId: string, fields: Record<string, unknown>) {
  const { error } = await supabase.from("products").update(fields).eq("id", productId);
  if (!error) return;
  const { base_color, base_size, ...fallback } = fields;
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
  const baseSize = String(formData.get("base_size") ?? "").trim() || null;
  const files = (formData.getAll("images") as File[]).filter((f) => f.size > 0);
  const packagingFile = formData.get("packaging_image") as File | null;
  // Picked in "Also show in these categories/brands" before the product
  // existed to link them to — staged as plain form fields (see
  // ExtraCategoriesEditor/ExtraBrandsEditor) instead of the live
  // add/remove actions those use once a product already has an id.
  const extraCategoryIds = (formData.getAll("extra_category_id") as string[]).filter(Boolean);
  const extraBrandIds = (formData.getAll("extra_brand_id") as string[]).filter(Boolean);

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
    base_size: baseSize,
  });

  if (error || !product) throw error;

  await saveVariants(supabase, product.id, product.slug, formData);

  if (extraCategoryIds.length > 0) {
    await supabase
      .from("product_category_links")
      .insert(extraCategoryIds.map((category_id) => ({ product_id: product.id, category_id })));
  }
  if (extraBrandIds.length > 0) {
    await supabase.from("product_brand_links").insert(extraBrandIds.map((brand_id) => ({ product_id: product.id, brand_id })));
  }

  const urls = await uploadImages(product.slug, files);
  if (urls.length > 0) {
    await supabase
      .from("product_images")
      .insert(urls.map((url, i) => ({ product_id: product.id, url, sort_order: i })));
  }

  await savePackagingImage(supabase, product.id, product.slug, packagingFile, false);

  revalidatePath("/admin/produits");
  revalidatePath("/", "layout");
  revalidateTag("products");
  // Straight to the edit page, not the list — "Also show in these
  // categories/brands", "Other colors" and "Related sunglasses" all need
  // an existing product id, so they're invisible on the create form no
  // matter what. Landing here right after saving is what actually makes
  // them reachable without an extra click back into the list.
  redirect(`/admin/produits/${product.id}`);
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
  const baseSize = String(formData.get("base_size") ?? "").trim() || null;
  const isActive = formData.get("is_active") === "on";
  const files = (formData.getAll("images") as File[]).filter((f) => f.size > 0);
  const packagingFile = formData.get("packaging_image") as File | null;
  const removePackaging = formData.get("remove_packaging_image") === "on";

  if (!name) return;

  const supabase = createServiceClient();
  const { data: product } = await supabase.from("products").select("slug, stock").eq("id", productId).single();
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
    base_size: baseSize,
    is_active: isActive,
  });

  // Base product stock (no variant) went from out to in — anyone waiting
  // on it gets an email. A null stock is "not tracked, always available",
  // never "out of stock".
  const wasOut = product.stock != null && product.stock <= 0;
  const isIn = stock == null || stock > 0;
  if (wasOut && isIn) {
    const { notifyStockRestocked } = await import("@/lib/notify-stock");
    await notifyStockRestocked(productId, null, null);
  }

  await saveVariants(supabase, productId, product.slug, formData);

  const urls = await uploadImages(product.slug, files);
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
  revalidateTag("products");
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
  revalidateTag("settings");
}


export async function deleteProduct(productId: string) {
  const supabase = createServiceClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/admin/produits");
  revalidatePath("/", "layout");
  revalidateTag("products");
}

export async function updateDiscount(productId: string, discountPercent: number | null) {
  // The 0-95 range is only enforced client-side (input min/max) — clamp
  // here too so a malformed/direct call can't store e.g. 150%, which would
  // make price * (1 - discount/100) go negative everywhere it's displayed.
  const clamped = discountPercent == null ? null : Math.min(95, Math.max(0, Math.round(discountPercent)));
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("products")
    .update({ discount_percent: clamped })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/discounts");
  revalidatePath("/", "layout");
  revalidateTag("products");
}

// Toggling this on immediately shows the product as out of stock
// everywhere on the site (product page, cards, search, checkout) without
// touching the real stock numbers underneath — flipping it back off
// restores exactly what was there before, colors/sizes included, with no
// need to re-enter anything.
export async function toggleSoldOut(productId: string) {
  const supabase = createServiceClient();
  const { data: product } = await supabase.from("products").select("is_sold_out").eq("id", productId).single();
  if (!product) return;

  await supabase.from("products").update({ is_sold_out: !product.is_sold_out }).eq("id", productId);

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
  revalidateTag("products");
}

export async function deleteProductImage(imageId: string) {
  const supabase = createServiceClient();
  await supabase.from("product_images").delete().eq("id", imageId);
  revalidatePath("/admin/produits");
  revalidateTag("products");
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
  revalidateTag("products");
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
  revalidateTag("products");
}

export async function removeRelatedProduct(id: string, productId: string) {
  const supabase = createServiceClient();
  await supabase.from("product_related_products").delete().eq("id", id);
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
  revalidateTag("products");
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
  revalidateTag("products");
}

// "Also show in these categories" picker — tags this product into an extra
// category (e.g. New Drop) without touching its real category_id. New Drop
// drops products out on its own after NEW_PRODUCT_DAYS (lib/products.ts);
// every other quick-added category tag is permanent.
export async function addProductCategoryLink(
  productId: string,
  categoryId: string
): Promise<{ id: string; added_at: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_category_links")
    .insert({ product_id: productId, category_id: categoryId })
    .select("id, added_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Already linked — return the existing row instead of failing.
      const { data: existing } = await supabase
        .from("product_category_links")
        .select("id, added_at")
        .eq("product_id", productId)
        .eq("category_id", categoryId)
        .single();
      if (existing) return existing;
    }
    throw new Error(error.message);
  }

  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
  revalidateTag("products");
  return data;
}

export async function removeProductCategoryLink(linkId: string, productId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("product_category_links").delete().eq("id", linkId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
  revalidateTag("products");
}

// Symmetric "also show under these brands" picker, using brand_id's own
// quick-add table.
export async function addProductBrandLink(
  productId: string,
  brandId: string
): Promise<{ id: string; added_at: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_brand_links")
    .insert({ product_id: productId, brand_id: brandId })
    .select("id, added_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("product_brand_links")
        .select("id, added_at")
        .eq("product_id", productId)
        .eq("brand_id", brandId)
        .single();
      if (existing) return existing;
    }
    throw new Error(error.message);
  }

  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
  revalidateTag("products");
  return data;
}

export async function removeProductBrandLink(linkId: string, productId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("product_brand_links").delete().eq("id", linkId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
  revalidateTag("products");
}

export async function removeColorLink(productId: string, memberProductId: string) {
  const supabase = createServiceClient();
  await supabase.from("products").update({ color_group_id: null }).eq("id", memberProductId);
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
  revalidateTag("products");
}
