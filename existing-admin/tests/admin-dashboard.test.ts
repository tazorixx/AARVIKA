import test from "node:test";
import assert from "node:assert/strict";
import { buildDashboardMetrics } from "../src/lib/admin/dashboard";

test("dashboard counts today's orders and paid revenue", () => {
  const now = new Date("2026-09-17T12:00:00");
  const result = buildDashboardMetrics([
    { status: "confirmed", totals: { grandTotal: 1000 }, createdAt: "2026-09-17T09:00:00" },
    { status: "payment_failed", totals: { grandTotal: 500 }, createdAt: "2026-09-17T10:00:00" },
    { status: "delivered", totals: { grandTotal: 750 }, createdAt: "2026-09-16T10:00:00" },
  ], [], now);
  assert.equal(result.todayOrders, 2);
  assert.equal(result.todayRevenue, 1000);
  assert.equal(result.statusCounts.confirmed, 1);
  assert.equal(result.statusCounts.payment_failed, 1);
});

test("dashboard identifies products with five or fewer available units", () => {
  const result = buildDashboardMetrics([], [
    { id: "a", title: "Gift A", inventory: { quantity: 7, reserved: 2 } },
    { id: "b", title: "Gift B", inventory: { quantity: 8, reserved: 4 } },
    { id: "c", title: "Gift C", inventory: { quantity: 20, reserved: 1 } },
  ]);
  assert.deepEqual(result.lowStock.map((item) => item.id), ["b", "a"]);
});

test('inquiry-only designs and component-backed kits cannot become independent low-stock pools',()=>{
 const result=buildDashboardMetrics([], [{id:'quote',aarvika:{purchaseMode:'inquiry'},inventory:{quantity:0}},{id:'kit',aarvika:{purchaseMode:'buy',bundle:true},inventory:{quantity:0}},{id:'component',aarvika:{purchaseMode:'buy'},inventory:{quantity:2,reserved:1}}]);
 assert.deepEqual(result.lowStock.map(p=>p.id),['component']);
});
