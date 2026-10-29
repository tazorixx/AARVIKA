import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const MAX_BYTES = 10 * 1024 * 1024;
const DEPARTMENTS = new Set(["wedding","birthday","anniversary","personalized","hampers","clothing","stationery","furniture"]);

function authHeader() {
  const key = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  if (!key) throw new Error("ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY.");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    await requireCatalogAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    const type = form.get("type");
    if (!(file instanceof File)) throw new Error("Image file is required.");
    if (!file.type.startsWith("image/") || file.size <= 0 || file.size > MAX_BYTES) throw new Error("Select an image between 1 byte and 10 MB.");
    if (type !== "category" && type !== "occasion") throw new Error("Invalid merchandising type.");
    let folder = `/gift4u/merchandising/${type}-pages`;
    if (type === "category") {
      const taxonomyId = form.get("taxonomyId");
      if (typeof taxonomyId !== "string" || !taxonomyId.trim()) throw new Error("Select a category before uploading.");
      const category = await getAdminDb().collection("categories").doc(taxonomyId).get();
      const department = category.data()?.departmentId;
      if (!category.exists || typeof department !== "string" || !DEPARTMENTS.has(department)) throw new Error("Category department is unavailable.");
      folder = `/aarvika/merchandising/${department}/category-pages`;
    }
    const safeName = file.name.trim().replace(/[^a-zA-Z0-9.-]+/g, "_").replace(/^\.+/, "").slice(0, 150) || `${crypto.randomUUID()}.jpg`;
    const upstream = new FormData();
    upstream.append("file", file);
    upstream.append("fileName", safeName);
    upstream.append("useUniqueFileName", "true");
    upstream.append("folder", folder);
    upstream.append("tags", `aarvika,merchandising,${type}`);
    const response = await fetch(IMAGEKIT_UPLOAD_URL, { method: "POST", headers: { Authorization: authHeader() }, body: upstream });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "ImageKit upload failed.");
    return NextResponse.json({ url: typeof data.url === "string" ? data.url : "", fileId: typeof data.fileId === "string" ? data.fileId : undefined, filePath: typeof data.filePath === "string" ? data.filePath : undefined });
  } catch (error) { return errorResponse(error); }
}
