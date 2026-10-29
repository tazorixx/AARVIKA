export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewReportStatus = "open" | "resolved" | "dismissed";

export type AdminReview = {
  id: string;
  productId: string;
  productTitle: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  verifiedPurchase?: boolean;
  photoUrls?: string[];
  adminResponse?: string;
  adminResponseAt?: unknown;
  reportCount?: number;
};

export const REVIEW_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPPORT"] as const;

export function normalizeReviewStatus(value: unknown): ReviewStatus {
  return value === "approved" || value === "rejected" ? value : "pending";
}

export function normalizeRating(value: unknown) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  return Math.min(5, Math.max(1, Math.round(rating)));
}

export function validateReviewUpdate(body: Record<string, unknown>) {
  const status = normalizeReviewStatus(body.status);
  if (body.status !== undefined && !["pending", "approved", "rejected"].includes(String(body.status))) {
    return { valid: false as const, error: "Invalid review status." };
  }
  return { valid: true as const, status };
}
