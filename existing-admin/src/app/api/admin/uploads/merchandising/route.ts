import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";

export const runtime = "nodejs";

const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_PAGES = new Set(["wedding", "birthday", "anniversary", "hampers", "personalised", "clothing", "stationery", "furniture", "lifestyle"]);

function safeFileName(value: string) {
  const name = value.trim().replace(/[^a-zA-Z0-9.-]+/g, "_").replace(/^\.+/, "").slice(0, 140);
  return name || `merchandising-${crypto.randomUUID()}.jpg`;
}

export async function POST(request: Request) {
  try {
    await requireCatalogAdmin(request);
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
    if (!privateKey) throw new Error("ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY.");

    const form = await request.formData();
    const file = form.get("file");
    const page = typeof form.get("page") === "string" ? String(form.get("page")).trim() : "";
    const section = typeof form.get("section") === "string" ? String(form.get("section")).trim() : "general";

    if (!ALLOWED_PAGES.has(page)) throw new Error("Invalid merchandising page.");
    if (!(file instanceof File)) throw new Error("Image file is required.");
    if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
    if (file.size <= 0) throw new Error("The selected image is empty.");
    if (file.size > MAX_BYTES) throw new Error("Merchandising images must be 10 MB or smaller.");

    const upstream = new FormData();
    upstream.append("file", file);
    upstream.append("fileName", safeFileName(file.name));
    upstream.append("useUniqueFileName", "true");
    const department = page === "personalised" ? "personalized" : page;
    const folder = page === "lifestyle"
      ? `/gift4u/merchandising/${page}/${section.replace(/[^a-zA-Z0-9_-]/g, "-")}`
      : `/aarvika/merchandising/${department}/${section.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    upstream.append("folder", folder);
    upstream.append("tags", `aarvika,merchandising,${department}`);

    const response = await fetch(IMAGEKIT_UPLOAD_URL, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}` },
      body: upstream,
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "ImageKit upload failed.");

    return NextResponse.json({
      url: typeof data.url === "string" ? data.url : "",
      fileId: typeof data.fileId === "string" ? data.fileId : undefined,
      filePath: typeof data.filePath === "string" ? data.filePath : undefined,
      thumbnailUrl: typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : typeof data.url === "string" ? data.url : "",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
