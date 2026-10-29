/** Existing API display shapes; no storage/schema or workflow changes. */
import type { CustomerProfile } from './customers';
import type { AdminReview } from './reviews';
export interface OrderItemView {
  productId: string; cartKey?: string; title?: string; image?: string; qty: number;
  priceAtAdd?: number; unitPrice?: number; deliveryDate?: string; deliverySlot?: string;
  giftMessage?: string; personalization?: Record<string, string>;
}
export interface OrderView {
  id: string; status: string; createdAt?: string; updatedAt?: string; userId?: string;
  address?: Record<string, string>; totals?: Record<string, number>;
  payment?: Record<string, string | number>; tracking?: Record<string, string>;
  items?: OrderItemView[]; fulfillmentNotes?: string;
}
export interface RefundView { id: string; amount: number; status?: string; reason?: string; createdAt?: string }
export interface CustomerDetailView {
  customer: CustomerProfile; stats: Record<string, number>; orders?: OrderView[];
  reviews?: AdminReview[];
  addresses?: { id: string; name?: string; label?: string; address?: string; city?: string; state?: string; pincode?: string; isDefault?: boolean }[];
  wishlist?: { id: string; name?: string; title?: string; price?: number }[];
  supportTickets?: { id: string; subject: string; status: string; priority: string; updatedAt?: string }[];
  couponUsage?: { orderId: string; code: string; discount: number }[];
  abandonedCart?: { status: string; subtotal: number; abandonedAt?: string; recoveredOrderId?: string };
}
