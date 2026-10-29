import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";

export const runtime = "nodejs";
const ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"] as const;

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...ROLES]);
    const db = getAdminDb();
    const [synonyms, redirects, pins, queries] = await Promise.all([
      db.collection("search_synonyms").orderBy("term").limit(200).get(),
      db.collection("search_redirects").orderBy("query").limit(200).get(),
      db.collection("search_pins").orderBy("query").limit(500).get(),
      db.collection("search_queries").orderBy("createdAt", "desc").limit(1000).get(),
    ]);
    type SearchQueryRecord = {
      query?: unknown;
      resultCount?: unknown;
      createdAt?: unknown;
    };
    const grouped = new Map<string, { query: string; searches: number; zeroResults: number; lastSearchedAt: unknown }>();
    queries.docs.forEach((d) => {
      const data = d.data() as SearchQueryRecord;
      const createdAt = data.createdAt && typeof data.createdAt === "object" && "toDate" in data.createdAt && typeof data.createdAt.toDate === "function"
        ? data.createdAt.toDate().toISOString()
        : data.createdAt ?? null;
      const q = String(data.query || "").trim();
      if (!q) return;
      const existing = grouped.get(q) || { query: q, searches: 0, zeroResults: 0, lastSearchedAt: createdAt };
      existing.searches += 1;
      if (Number(data.resultCount || 0) === 0) existing.zeroResults += 1;
      if (!existing.lastSearchedAt) existing.lastSearchedAt = createdAt;
      grouped.set(q, existing);
    });
    return NextResponse.json({
      synonyms: synonyms.docs.map((d) => ({ id: d.id, ...d.data() })),
      redirects: redirects.docs.map((d) => ({ id: d.id, ...d.data() })),
      pins: pins.docs.map((d) => ({ id: d.id, ...d.data() })),
      analytics: Array.from(grouped.values()).sort((a, b) => b.searches - a.searches),
    });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const caller = await requireAdmin(request, [...ROLES]);
    const body = await request.json() as { type?: string; term?: string; synonyms?: string[]; query?: string; target?: string; productId?: string; position?: number; active?: boolean };
    const db = getAdminDb();
    if (body.type === "synonym") {
      const term = String(body.term || "").trim().toLowerCase();
      if (!term || !Array.isArray(body.synonyms) || !body.synonyms.length) throw new Error("Term and at least one synonym are required.");
      const ref = await db.collection("search_synonyms").add({ term, synonyms: body.synonyms.map((v) => String(v).trim().toLowerCase()).filter(Boolean), updatedAt: new Date() });
      return NextResponse.json({ id: ref.id }, { status: 201 });
    }
    if (body.type === "redirect") {
      const query = String(body.query || "").trim().toLowerCase();
      const target = String(body.target || "").trim();
      if (!query || !target) throw new Error("Query and target are required.");
      const id = query.replace(/[^a-z0-9_-]+/g, "-");
      await db.collection("search_redirects").doc(id).set({ query, target, updatedAt: new Date() });
      return NextResponse.json({ id }, { status: 201 });
    }
    if (body.type === "pin") {
      const query = String(body.query || "").trim().toLowerCase();
      const productId = String(body.productId || "").trim();
      if (!query || !productId) throw new Error("Query and product are required.");
      const ref = await db.collection("search_pins").add({ query, productId, position: Number(body.position || 1), active: body.active !== false, updatedAt: new Date() });
      return NextResponse.json({ id: ref.id }, { status: 201 });
    }
    throw new Error("Unknown search management type.");
  } catch (error) { return errorResponse(error); }
}
