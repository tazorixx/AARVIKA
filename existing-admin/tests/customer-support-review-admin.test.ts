import test from "node:test";
import assert from "node:assert/strict";
import { buildCustomerSummary, matchesCustomerSearch } from "../src/lib/admin/customers";
import { normalizeReviewStatus } from "../src/lib/admin/reviews";
import { normalizeTicketPriority, normalizeTicketStatus, validateTicketUpdate } from "../src/lib/support/tickets";

test("customer summary calculates paid spend and last order", () => {
  const summary = buildCustomerSummary("u1", { name: "A", email: "a@example.com" }, [
    { status: "confirmed", totals: { grandTotal: 1200 }, createdAt: "2026-01-01T00:00:00Z" },
    { status: "cancelled", totals: { grandTotal: 5000 }, createdAt: "2026-02-01T00:00:00Z" },
  ]);
  assert.equal(summary.paidOrderCount, 1);
  assert.equal(summary.totalSpent, 1200);
  assert.equal(summary.lastOrderAt, "2026-02-01T00:00:00.000Z");
  assert.equal(matchesCustomerSearch(summary, "a@example.com"), true);
});

test("review and support normalizers reject unknown values", () => {
  assert.equal(normalizeReviewStatus("anything"), "pending");
  assert.equal(normalizeTicketStatus("anything"), "open");
  assert.equal(normalizeTicketPriority("anything"), "medium");
});

test("support update validates useful changes", () => {
  assert.equal(validateTicketUpdate({ status: "resolved" }).valid, true);
  assert.equal(validateTicketUpdate({ priority: "high" }).valid, true);
  assert.equal(validateTicketUpdate({ reply: "Thanks for contacting us." }).valid, true);
  assert.equal(validateTicketUpdate({}).valid, false);
});
