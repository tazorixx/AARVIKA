import test from "node:test";
import assert from "node:assert/strict";
import { buildAnalyticsMetrics, isWithinDateRange } from "../src/lib/admin/analytics";

test("analytics includes only orders inside the selected date range", () => {
  const start = new Date("2026-09-01T00:00:00Z");
  const end = new Date("2026-10-01T00:00:00Z");
  assert.equal(isWithinDateRange("2026-09-15T12:00:00Z", start, end), true);
  assert.equal(isWithinDateRange("2026-10-01T00:00:00Z", start, end), false);
});

test("analytics calculates revenue, refunds, product/category performance and daily trend", () => {
  const result = buildAnalyticsMetrics(
    [
      { id: "a", status: "confirmed", createdAt: "2026-09-10T10:00:00Z", totals: { grandTotal: 1250 }, payment: { refundedAmount: 100 }, items: [{ productId: "p1", title: "Gift A", qty: 2, unitPrice: 500, lineTotal: 1000 }] },
      { id: "b", status: "payment_failed", createdAt: "2026-09-11T10:00:00Z", totals: { grandTotal: 900 }, items: [{ productId: "p1", title: "Gift A", qty: 1, unitPrice: 900, lineTotal: 900 }] },
    ],
    [{ id: "p1", title: "Gift A", categoryIds: ["c1"], inventory: { quantity: 10, reserved: 2, sold: 5 } }],
    [{ id: "c1", name: "Birthday" }],
    new Date("2026-09-01T00:00:00Z"),
    new Date("2026-10-01T00:00:00Z"),
    [{ id: "SAVE10", active: true, usedCount: 3 }],
  );
  assert.equal(result.totalOrders, 2);
  assert.equal(result.paidOrders, 1);
  assert.equal(result.totalRevenue, 1250);
  assert.equal(result.refundedAmount, 100);
  assert.equal(result.netRevenue, 1150);
  assert.equal(result.averageOrderValue, 1250);
  assert.equal(result.inventory.availableUnits, 8);
  assert.equal(result.inventory.lowStock, 0);
  assert.equal(result.couponSummary.redemptions, 3);
  assert.equal(result.dailyTrend.length, 30);
  assert.equal(result.dailyTrend.find((item) => item.date === "2026-09-10")?.revenue, 1250);
  assert.deepEqual(result.topProducts[0], { productId: "p1", title: "Gift A", units: 2, revenue: 1000 });
  assert.deepEqual(result.topCategories[0], { categoryId: "c1", name: "Birthday", units: 2, revenue: 1000 });
});
