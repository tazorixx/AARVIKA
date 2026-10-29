import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]);
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) throw new Error("ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY.");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Homepage images must be 10 MB or smaller." }, { status: 400 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || "homepage-image";
    const upstream = new FormData();
    upstream.append("file", file);
    upstream.append("fileName", `${Date.now()}-${safeName}`);
    upstream.append("folder", "/gift4u/homepage");
    const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}` }, body: upstream });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "ImageKit upload failed.");
    return NextResponse.json({ url: data.url, fileId: data.fileId, name: data.name });
  } catch (error) { return errorResponse(error); }
}
