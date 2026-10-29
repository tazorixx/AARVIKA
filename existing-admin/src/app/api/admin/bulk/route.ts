import { NextResponse } from "next/server";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { getAdminDb, setInventory, updateProduct } from "@/lib/catalog/server";
import { parseProductInput } from "@/lib/catalog/validation";
import { bulkProductPatch, validateBulkIds, validateBulkQuantity } from "@/lib/admin/bulk";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]);
    const body = (await request.json()) as { entity?: unknown; action?: unknown; ids?: unknown; quantity?: unknown };
    const ids = validateBulkIds(body.ids);
    if (!ids.ok) return NextResponse.json({ error: ids.error }, { status: 400 });
    const db = getAdminDb();

    if (body.entity === "products") {
      const patch = bulkProductPatch(body.action);
      if (!patch) return NextResponse.json({ error: "Unsupported product bulk action." }, { status: 400 });
      const docs = await Promise.all(ids.ids.map((id) => db.collection("products").doc(id).get()));
      const missing = docs.filter((snap) => !snap.exists).map((snap) => snap.id);
      if (missing.length) return NextResponse.json({ error: `Products not found: ${missing.join(", ")}` }, { status: 404 });

      if (body.action === "publish") {
        const invalid: string[] = [];
        for (const snap of docs) {
          try { parseProductInput({ ...(snap.data() ?? {}), status: "live" }); } catch { invalid.push(snap.id); }
        }
        if (invalid.length) return NextResponse.json({ error: `These products are not ready to publish: ${invalid.join(", ")}. Edit them individually to see the required fields.` }, { status: 400 });
      }

      for (const snap of docs) await updateProduct(snap.id, parseProductInput({...snap.data(),...patch}));
      return NextResponse.json({ updated: ids.ids.length });
    }

    if (body.entity === "inventory") {
      const quantity = validateBulkQuantity(body.quantity);
      if (!quantity.ok) return NextResponse.json({ error: quantity.error }, { status: 400 });
      const docs = await Promise.all(ids.ids.map((id) => db.collection("products").doc(id).get()));
      const missing = docs.filter((snap) => !snap.exists).map((snap) => snap.id);
      if (missing.length) return NextResponse.json({ error: `Products not found: ${missing.join(", ")}` }, { status: 404 });
      if(docs.some(s=>s.data()?.aarvika)) return NextResponse.json({error:"Adjust canonical SKUs individually with a reason and stock revision."},{status:400});
      for (const snap of docs) {
        const inventory = (snap.data()?.inventory ?? {}) as Record<string, unknown>;
        await setInventory(snap.id, { quantity: quantity.quantity, reserved: Number(inventory.reserved ?? 0), sold: Number(inventory.sold ?? 0) });
      }
      return NextResponse.json({ updated: ids.ids.length });
    }

    return NextResponse.json({ error: "Unsupported bulk entity." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
