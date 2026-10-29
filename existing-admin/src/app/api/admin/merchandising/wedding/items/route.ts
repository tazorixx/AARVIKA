import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import {
  createWeddingItem,
  getWeddingMerchandising,
  normalizeItemInput,
  serializeMerchandising,
} from "@/lib/merchandising/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireCatalogAdmin(request);
    const data = await getWeddingMerchandising();
    return NextResponse.json({ items: serializeMerchandising(data.items) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireCatalogAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const data = normalizeItemInput(body);
    const id = await createWeddingItem(data);
    return NextResponse.json({ id, item: { id, ...data } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
