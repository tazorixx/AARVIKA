import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { REVIEW_ADMIN_ROLES, normalizeReviewStatus } from "@/lib/admin/reviews";

export const runtime = "nodejs";

function serialize(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...REVIEW_ADMIN_ROLES]);
    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.trim();
    const ratingParam = Number(url.searchParams.get("rating") || 0);
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const requestedLimit = Number(url.searchParams.get("limit") || 50);
    const limit = Math.min(100, Math.max(1, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 50));
    const db = getAdminDb();
    let query = db.collection("reviews").orderBy("createdAt", "desc").limit(limit);
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query = db.collection("reviews").where("status", "==", status).limit(limit);
    }
    const snap = await query.get();
    let reviews = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        productId: String(data.productId || ""),
        productTitle: String(data.productTitle || ""),
        userId: String(data.userId || ""),
        userName: String(data.userName || "Customer"),
        rating: Math.min(5, Math.max(1, Number(data.rating || 0))),
        title: String(data.title || ""),
        body: String(data.body || ""),
        status: normalizeReviewStatus(data.status),
        createdAt: serialize(data.createdAt),
        updatedAt: serialize(data.updatedAt),
        verifiedPurchase: Boolean(data.verifiedPurchase),
        photoUrls: Array.isArray(data.photoUrls) ? data.photoUrls.filter((x): x is string => typeof x === "string").slice(0, 5) : [],
        adminResponse: String(data.adminResponse || ""),
        adminResponseAt: serialize(data.adminResponseAt),
        reportCount: Math.max(0, Number(data.reportCount || 0)),
      };
    });
    if (ratingParam >= 1 && ratingParam <= 5) reviews = reviews.filter((review) => review.rating === ratingParam);
    if (q) reviews = reviews.filter((review) => [review.id, review.productId, review.productTitle, review.userId, review.userName, review.title, review.body].join(" ").toLowerCase().includes(q));
    return NextResponse.json({ reviews });
  } catch (error) {
    return errorResponse(error);
  }
}
