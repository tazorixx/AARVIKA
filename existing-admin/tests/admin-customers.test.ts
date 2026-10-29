import test from "node:test";
import assert from "node:assert/strict";
import { buildCustomerSummary, matchesCustomerSearch } from "../src/lib/admin/customers";

test("customer summary counts only paid orders as spend", () => {
  const customer = buildCustomerSummary("u1", { name: "A", email: "a@example.com" }, [
    { status: "confirmed", totals: { grandTotal: 500 }, createdAt: "2026-09-01T00:00:00Z" },
    { status: "pending_payment", totals: { grandTotal: 900 }, createdAt: "2026-09-02T00:00:00Z" },
  ]);
  assert.equal(customer.orderCount, 2); assert.equal(customer.paidOrderCount, 1); assert.equal(customer.totalSpent, 500); assert.equal(customer.lastOrderAt, "2026-09-02T00:00:00.000Z");
});

test("customer search matches name, email, phone and uid", () => {
  const customer = buildCustomerSummary("u1", { name: "Roshan", email: "roshan@example.com", phone: "9876543210" }, []);
  assert.equal(matchesCustomerSearch(customer, "roshan"), true); assert.equal(matchesCustomerSearch(customer, "9876543210"), true); assert.equal(matchesCustomerSearch(customer, "missing"), false);
});
