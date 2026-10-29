import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { buildCustomerSummary, toIso } from "@/lib/admin/customers";

export const runtime = "nodejs";

function serialize(value: unknown) { return toIso(value); }
function plain(data: FirebaseFirestore.DocumentData | undefined) { return data ? { ...data } : {}; }

export async function GET(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN", "SUPPORT"]);
    const uid = (await params).customerId;
    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    const [orderSnap, addressSnap, reviewSnap, supportSnap, wishlistSnap, abandonedSnap] = await Promise.all([
      db.collection("orders").where("userId", "==", uid).limit(200).get(),
      userRef.collection("addresses").limit(50).get(),
      db.collection("reviews").where("userId", "==", uid).limit(100).get(),
      db.collection("support_tickets").where("userId", "==", uid).limit(100).get(),
      db.collection("wishlists").doc(uid).get(),
      db.collection("abandoned_carts").doc(uid).get(),
    ]);

    const orders: Array<Record<string, unknown> & { id: string; createdAt: string | null; updatedAt: string | null }> = orderSnap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return { id: doc.id, ...data, createdAt: toIso(data.createdAt), updatedAt: toIso(data.updatedAt) };
    }).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    const addresses = addressSnap.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...plain(data), createdAt: serialize(data.createdAt), updatedAt: serialize(data.updatedAt) };
    });

    const reviews = reviewSnap.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, productId: String(data.productId || ""), productTitle: String(data.productTitle || ""), rating: Number(data.rating || 0), title: String(data.title || ""), body: String(data.body || ""), status: String(data.status || "pending"), createdAt: serialize(data.createdAt), updatedAt: serialize(data.updatedAt) };
    }).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    const supportTickets = supportSnap.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, orderId: data.orderId || null, subject: String(data.subject || ""), status: String(data.status || "open"), priority: String(data.priority || "normal"), createdAt: serialize(data.createdAt), updatedAt: serialize(data.updatedAt) };
    }).sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));

    const wishlistData = wishlistSnap.exists ? wishlistSnap.data() || {} : {};
    const wishlistItems = Array.isArray(wishlistData.items) ? wishlistData.items : [];

    const abandonedData = abandonedSnap.exists ? abandonedSnap.data() || {} : null;
    const couponUsage = orders
      .filter((order) => order.coupon && typeof order.coupon === "object")
      .map((order) => {
        const coupon = order.coupon as Record<string, unknown>;
        return { code: String(coupon.code || ""), discount: Number(coupon.discount || 0), orderId: order.id, createdAt: order.createdAt };
      })
      .filter((item) => item.code);

    const customer = buildCustomerSummary(uid, userSnap.data() || {}, orders);
    const stats = {
      wishlistCount: wishlistItems.length,
      reviewCount: reviews.length,
      approvedReviewCount: reviews.filter((review) => review.status === "approved").length,
      supportOpenCount: supportTickets.filter((ticket) => ["open", "in_progress"].includes(ticket.status)).length,
      supportTicketCount: supportTickets.length,
      addressCount: addresses.length,
      couponUseCount: couponUsage.length,
      couponDiscountTotal: couponUsage.reduce((sum, item) => sum + item.discount, 0),
      abandonedCartStatus: abandonedData?.status || null,
      abandonedCartValue: Number(abandonedData?.subtotal || 0),
    };

    return NextResponse.json({
      customer,
      stats,
      orders,
      addresses,
      reviews,
      supportTickets,
      wishlist: wishlistItems,
      couponUsage,
      abandonedCart: abandonedData ? { status: String(abandonedData.status || "flagged"), subtotal: Number(abandonedData.subtotal || 0), abandonedAt: serialize(abandonedData.abandonedAt), updatedAt: serialize(abandonedData.updatedAt), recoveredOrderId: abandonedData.recoveredOrderId || null } : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
