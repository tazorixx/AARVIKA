import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { getAdminDb } from "@/lib/firebase-admin";
import { uploadMediaBatchAsset } from '@/lib/catalog/media-batch-upload';

export const runtime = "nodejs";

const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const IMAGEKIT_API_URL = "https://api.imagekit.io/v1/files";
const PRODUCT_IMAGE_FOLDER = "/gift4u/products";
const MAX_PRODUCT_IMAGE_BYTES = 10 * 1024 * 1024;

function getImageKitPrivateKey() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();

  if (!privateKey) {
    throw new Error("ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY.");
  }

  return privateKey;
}

function imageKitAuthHeader(privateKey: string) {
  return `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;
}

function safeFileName(fileName: string) {
  const trimmed = fileName.trim();
  const normalized = trimmed.replace(/[^a-zA-Z0-9.-]+/g, "_");
  const safe = normalized.replace(/^\.+/, "").slice(0, 160);

  return safe || `product-image-${crypto.randomUUID()}.jpg`;
}

export async function GET(request: Request) {
  try {
    await requireCatalogAdmin(request);

    const privateKey = getImageKitPrivateKey();
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();

    if (!publicKey) {
      throw new Error(
        "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY.",
      );
    }

    const expire = Math.floor(Date.now() / 1000) + 3600;
    const token = crypto.randomUUID();
    const signature = crypto
      .createHmac("sha1", privateKey)
      .update(token + expire)
      .digest("hex");

    return NextResponse.json({ token, expire, signature, publicKey });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireCatalogAdmin(request);

    const privateKey = getImageKitPrivateKey();
    const form = await request.formData();
    if(form.has('batchId'))return NextResponse.json(await uploadMediaBatchAsset(form));
    const file = form.get("file");
    const assetKind = form.get('assetKind');
    let folder = assetKind === 'category' ? '/gift4u/categories' : assetKind === 'collection' ? '/gift4u/collections' : PRODUCT_IMAGE_FOLDER;
    if (assetKind === 'category') {
      const recordId = form.get('recordId');
      if (typeof recordId !== 'string' || !recordId.trim()) throw new Error('Select a category before uploading.');
      const category = await getAdminDb().collection('categories').doc(recordId).get();
      const department = category.data()?.departmentId;
      if (!category.exists || typeof department !== 'string' || !['wedding','birthday','anniversary','personalized','hampers','clothing','stationery','furniture'].includes(department)) throw new Error('Category department is unavailable.');
      folder = `/aarvika/merchandising/${department}/categories`;
    }

    if (!(file instanceof File)) {
      throw new Error("Image file is required.");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }

    if (file.size <= 0) {
      throw new Error("The selected image is empty.");
    }

    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      throw new Error("Product images must be 10 MB or smaller.");
    }

    const uploadName = safeFileName(file.name);
    const upstream = new FormData();
    upstream.append("file", file);
    upstream.append("fileName", uploadName);
    upstream.append("useUniqueFileName", "true");
    upstream.append("folder", folder);
    upstream.append("tags", `gift4u,${assetKind === 'category' || assetKind === 'collection' ? assetKind : 'product'}`);

    const response = await fetch(IMAGEKIT_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: imageKitAuthHeader(privateKey),
      },
      body: upstream,
    });

    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (!response.ok) {
      throw new Error(
        typeof data.message === "string"
          ? data.message
          : "ImageKit upload failed.",
      );
    }

    return NextResponse.json({
      fileId: typeof data.fileId === "string" ? data.fileId : undefined,
      name: typeof data.name === "string" ? data.name : uploadName,
      filePath:
        typeof data.filePath === "string" ? data.filePath : undefined,
      url: typeof data.url === "string" ? data.url : "",
      thumbnailUrl:
        typeof data.thumbnailUrl === "string"
          ? data.thumbnailUrl
          : typeof data.url === "string"
            ? data.url
            : "",
      width: typeof data.width === "number" ? data.width : undefined,
      height: typeof data.height === "number" ? data.height : undefined,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCatalogAdmin(request);

    const privateKey = getImageKitPrivateKey();
    const body = (await request.json().catch(() => ({}))) as {
      fileId?: unknown;
    };
    const fileId = typeof body.fileId === "string" ? body.fileId.trim() : "";

    if (!fileId) {
      throw new Error("ImageKit fileId is required.");
    }

    const detailsResponse = await fetch(
      `${IMAGEKIT_API_URL}/${encodeURIComponent(fileId)}`,
      {
        headers: {
          Authorization: imageKitAuthHeader(privateKey),
        },
      },
    );

    const details = (await detailsResponse.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (!detailsResponse.ok) {
      throw new Error(
        typeof details.message === "string"
          ? details.message
          : "Unable to verify the ImageKit asset.",
      );
    }

    const filePath =
      typeof details.filePath === "string" ? details.filePath : "";

    if (
      !filePath.startsWith(`${PRODUCT_IMAGE_FOLDER}/`) &&
      filePath !== PRODUCT_IMAGE_FOLDER
    ) {
      throw new Error("This asset is not a Gift4U product image.");
    }

    const deleteResponse = await fetch(
      `${IMAGEKIT_API_URL}/${encodeURIComponent(fileId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: imageKitAuthHeader(privateKey),
        },
      },
    );

    if (!deleteResponse.ok && deleteResponse.status !== 204) {
      const result = (await deleteResponse.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      throw new Error(
        typeof result.message === "string"
          ? result.message
          : "ImageKit asset deletion failed.",
      );
    }

    return NextResponse.json({ ok: true, fileId });
  } catch (error) {
    return errorResponse(error);
  }
}
