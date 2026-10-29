import {isCatalogueMedia} from '@aarvika/catalogue/media-policy';
import { parseAuthoring, validateAuthoring, validateVariants, departmentIds, stockInteger } from "@aarvika/catalogue/admin-contracts";
import type { DepartmentId } from "@aarvika/catalogue/departments";
import type { CatalogStatus, Product, ProductDelivery, ProductImage, ProductPersonalization, ProductServiceability, ProductVariant, TaxonomyBase } from "./types";
import { removeUndefinedDeep } from "../firestore-sanitize";

export function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))];
}

export function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

export function parseTaxonomyInput(body: Record<string, unknown>): Omit<TaxonomyBase, "id" | "createdAt" | "updatedAt"> {
  const name = cleanString(body.name);
  if (!name) throw new Error("Name is required.");
  const slug = slugify(cleanString(body.slug) || name);
  if (!slug) throw new Error("A valid slug is required.");

  return removeUndefinedDeep({
    name,
    slug,
    image: cleanString(body.image) || undefined,
    description: cleanString(body.description) || undefined,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    active: body.active !== false,
  });
}

export function parseCategoryInput(body: Record<string, unknown>) {
  // `null` is intentional: it lets PATCH move a subcategory back to the
  // top-level without sending Firestore an undefined value.
  const parentId = cleanString(body.parentId) || null;
  const departmentId = cleanString(body.departmentId);
  if (departmentId && !departmentIds.includes(departmentId as DepartmentId)) throw new Error("Select a confirmed department.");
  const furnitureSector=cleanString(body.furnitureSector);
  if(furnitureSector&&!['Home','Commercial'].includes(furnitureSector))throw new Error('Choose Home or Commercial furniture sector.');
  if(furnitureSector&&departmentId!=='furniture')throw new Error('Furniture sector requires Furniture department.');
  return { ...parseTaxonomyInput(body), parentId,...('furnitureSector' in body?{furnitureSector:furnitureSector as 'Home'|'Commercial'|''}:{}), ...(departmentId ? { departmentId: departmentId as DepartmentId } : {}) };
}

function numberValue(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function optionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function validateProductForPublish(product: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  const errors: string[] = [];

  if (!product.title.trim()) errors.push("Title is required.");
  if (!product.sku.trim()) errors.push("SKU is required.");
  if (!product.slug.trim()) errors.push("A valid slug is required.");
  if (product.images.length === 0) errors.push("At least one product image is required.");
  if (!product.thumbnail.trim()) errors.push("A primary product image is required.");
  if (product.images.length > 0 && !product.images.some((image) => image.url === product.thumbnail)) {
    errors.push("The primary product image must belong to the product image gallery.");
  }
  if (product.aarvika?.purchaseMode !== "inquiry" && product.price <= 0) errors.push("Selling price must be greater than 0.");
  if (!product.aarvika && product.mrp <= 0) errors.push("MRP must be greater than 0.");
  if (product.mrp > 0 && product.price > product.mrp) errors.push("Selling price cannot be greater than MRP.");
  if (product.categoryIds.length === 0) errors.push("At least one category is required before publishing.");
  if (!product.aarvika && product.occasionIds.length === 0) errors.push("At least one occasion is required before publishing.");
  if (!product.aarvika && product.recipientIds.length === 0) errors.push("At least one recipient is required before publishing.");

  if (product.delivery.minDays !== undefined && product.delivery.maxDays !== undefined && product.delivery.minDays > product.delivery.maxDays) {
    errors.push("Minimum delivery days cannot be greater than maximum delivery days.");
  }

  if (
    product.personalization.enabled &&
    (product.personalization.fields?.length ?? 0) === 0 &&
    product.personalization.imageUpload !== true
  ) {
    errors.push("Add at least one personalization field, allow image upload, or disable personalization.");
  }

  if (product.aarvika) validateAuthoring(product.aarvika, true);

  if (errors.length > 0) {
    throw new Error(`Product cannot be published: ${errors.join(" ")}`);
  }
}

export function parseProductInput(body: Record<string, unknown>): Omit<Product, "id" | "createdAt" | "updatedAt"> {
  const title = cleanString(body.title);
  if (!title) throw new Error("Title is required.");

  const sku = cleanString(body.sku);
  if (!sku && !(body.aarvika && body.status === "draft")) throw new Error("SKU is required.");

  const slug = slugify(cleanString(body.slug) || title);
  if (!slug) throw new Error("A valid slug is required.");

  const status = cleanString(body.status) as CatalogStatus;
  if (!["draft", "live", "archived"].includes(status)) throw new Error("Invalid product status.");

  const images: ProductImage[] = Array.isArray(body.images)
    ? body.images
        .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
        .map((x) => removeUndefinedDeep({
          url: cleanString(x.url),
          alt: cleanString(x.alt) || undefined,
          fileId: cleanString(x.fileId) || undefined,
          filePath: cleanString(x.filePath) || undefined,
          thumbnailUrl: cleanString(x.thumbnailUrl) || undefined,
          width: optionalNumber(x.width),
          height: optionalNumber(x.height),
        }))
        .filter((x) => x.url)
    : [];

  const variants: ProductVariant[] = Array.isArray(body.variants)
    ? body.variants
        .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
        .map((x, i) => {
          const options = cleanStringArray(x.options);
          return removeUndefinedDeep({
            id: cleanString(x.id) || `variant-${i + 1}`,
            name: cleanString(x.name) || `Variant ${i + 1}`,
            value: cleanString(x.value) || undefined,
            options: options.length > 0 ? options : undefined,
            price: optionalNumber(x.price),
            priceDelta: optionalNumber(x.priceDelta),
            sku: cleanString(x.sku) || undefined,
            quantity: optionalNumber(x.quantity),
            attributes: x.attributes && typeof x.attributes === "object" && !Array.isArray(x.attributes) ? Object.fromEntries(Object.entries(x.attributes).map(([k,v]) => [k,cleanString(v)])) : undefined,
          });
        })
    : [];

  const aarvika = body.aarvika !== undefined ? parseAuthoring(body.aarvika) : undefined;
  if (aarvika) {
    validateVariants(variants, body.status === "live");
    if (images.some(image=>!isCatalogueMedia(image.url))) throw new Error("Use a local demo image path or public ImageKit CDN reference. External uploads remain disabled.");
  }

  const personalizationBody = record(body.personalization);
  const personalizationFields = cleanStringArray(personalizationBody.fields);
  const personalization: ProductPersonalization = removeUndefinedDeep({
    enabled: bool(personalizationBody.enabled),
    fields: personalizationFields,
    maxCharacters: optionalNumber(personalizationBody.maxCharacters),
    maxLength: optionalNumber(personalizationBody.maxLength),
    imageUpload: bool(personalizationBody.imageUpload),
    instructions: cleanString(personalizationBody.instructions) || undefined,
  });

  const deliveryBody = record(body.delivery);
  const delivery: ProductDelivery = removeUndefinedDeep({
    minDays: optionalNumber(deliveryBody.minDays),
    maxDays: optionalNumber(deliveryBody.maxDays),
    sameDay: bool(deliveryBody.sameDay),
    express: typeof deliveryBody.express === "boolean" ? deliveryBody.express : undefined,
    scheduled: typeof deliveryBody.scheduled === "boolean" ? deliveryBody.scheduled : undefined,
    midnight: typeof deliveryBody.midnight === "boolean" ? deliveryBody.midnight : undefined,
    courier: typeof deliveryBody.courier === "boolean" ? deliveryBody.courier : undefined,
    fee: optionalNumber(deliveryBody.fee),
    slotFees: deliveryBody.slotFees && typeof deliveryBody.slotFees === "object"
      ? Object.fromEntries(Object.entries(deliveryBody.slotFees as Record<string, unknown>).map(([key, value]) => [key, numberValue(value)]))
      : undefined,
    slotCapacities: deliveryBody.slotCapacities && typeof deliveryBody.slotCapacities === "object"
      ? Object.fromEntries(Object.entries(deliveryBody.slotCapacities as Record<string, unknown>).map(([key, value]) => [key, Math.max(0, numberValue(value))]))
      : undefined,
    cutoffHour: optionalNumber(deliveryBody.cutoffHour),
    capacityPerSlot: optionalNumber(deliveryBody.capacityPerSlot),
    zoneMode: deliveryBody.zoneMode === "legacy" || deliveryBody.zoneMode === "inherit" ? deliveryBody.zoneMode : undefined,
  });

  const serviceabilityBody = record(body.serviceability);
  const serviceability: ProductServiceability = removeUndefinedDeep({
    pincodes: cleanStringArray(serviceabilityBody.pincodes),
    cities: cleanStringArray(serviceabilityBody.cities),
    nationwide: bool(serviceabilityBody.nationwide, true),
  });

  const inventoryBody = record(body.inventory);
  const seoBody = record(body.seo);

  const parsed: Omit<Product, "id" | "createdAt" | "updatedAt"> = removeUndefinedDeep({
    aarvika,
    sku,
    title,
    slug,
    shortDescription: cleanString(body.shortDescription),
    description: cleanString(body.description),
    categoryIds: cleanStringArray(body.categoryIds),
    occasionIds: cleanStringArray(body.occasionIds),
    recipientIds: cleanStringArray(body.recipientIds),
    cultureTagIds: cleanStringArray(body.cultureTagIds),
    stateTagIds: cleanStringArray(body.stateTagIds),
    tagIds: cleanStringArray(body.tagIds),
    collectionIds: cleanStringArray(body.collectionIds),
    images,
    thumbnail: cleanString(body.thumbnail) || images[0]?.url || "",
    price: aarvika && variants.length ? Math.min(...variants.map(v=>v.price ?? (numberValue(body.price)+(v.priceDelta??0)))) : numberValue(body.price),
    mrp: numberValue(body.mrp),
    discount: numberValue(body.discount),
    variants,
    personalization,
    inventory: {
      quantity: aarvika?stockInteger(inventoryBody.quantity??0):Math.max(0, numberValue(inventoryBody.quantity)),
      reserved: aarvika?stockInteger(inventoryBody.reserved??0):Math.max(0, numberValue(inventoryBody.reserved)),
      sold: aarvika?stockInteger(inventoryBody.sold??0):Math.max(0, numberValue(inventoryBody.sold)),
    },
    delivery,
    serviceability,
    status,
    featured: bool(body.featured),
    bestseller: bool(body.bestseller),
    newArrival: bool(body.newArrival),
    rating: numberValue(body.rating),
    reviewCount: Math.max(0, numberValue(body.reviewCount)),
    seo: removeUndefinedDeep({
      title: cleanString(seoBody.title) || undefined,
      description: cleanString(seoBody.description) || undefined,
      keywords: cleanStringArray(seoBody.keywords),
    }),
  });

  // Even draft products must not point the primary image at a URL outside the
  // gallery. Publishing adds the stricter business checks below.
  if (parsed.thumbnail && parsed.images.length > 0 && !parsed.images.some((image) => image.url === parsed.thumbnail)) {
    throw new Error("Primary image must be one of the product images.");
  }

  if (parsed.status === "live") {
    validateProductForPublish(parsed);
  }

  return parsed;
}
