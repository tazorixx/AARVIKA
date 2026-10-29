import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import {
  archiveWeddingItem,
  normalizeItemInput,
  serializeMerchandising,
  updateWeddingItem,
} from "@/lib/merchandising/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireCatalogAdmin(request);
    const { id } = await params;
    const snap = await getAdminDb()
      .collection("merchandising_pages")
      .doc("wedding")
      .collection("items")
      .doc(id)
      .get();
    if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json(serializeMerchandising({ id: snap.id, ...snap.data() }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireCatalogAdmin(request);
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const data = normalizeItemInput(body);
    await updateWeddingItem(id, data);
    return NextResponse.json({ ok: true, item: serializeMerchandising({ id, ...data }) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireCatalogAdmin(request);
    const { id } = await params;
    await archiveWeddingItem(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
