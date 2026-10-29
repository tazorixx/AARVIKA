import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { assertIsolatedServer } from "@/lib/isolated";

export const runtime = "nodejs";
const MAX_BYTES = 10 * 1024 * 1024;

function imageType(bytes: Buffer): { extension: string; mime: string } | null {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { extension: "png", mime: "image/png" };
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return { extension: "jpg", mime: "image/jpeg" };
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return { extension: "webp", mime: "image/webp" };
  return null;
}

export async function POST(request: Request) {
  try {
    assertIsolatedServer();
    await requireCatalogAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Choose an image file.");
    if (file.size < 1 || file.size > MAX_BYTES) throw new Error("Use an image from 1 byte to 10 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = imageType(bytes);
    if (!type || file.type !== type.mime) throw new Error("Use a PNG, JPEG or WebP image.");
    const directory = path.join(process.cwd(), "public", "demo-uploads");
    await mkdir(directory, { recursive: true });
    const name = `${randomUUID()}.${type.extension}`;
    await writeFile(path.join(directory, name), bytes, { flag: "wx" });
    return NextResponse.json({ url: `/demo-uploads/${name}` }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
