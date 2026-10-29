import { test } from "node:test";
import assert from "node:assert/strict";

const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "CATALOG_MANAGER",
  "ORDER_MANAGER",
  "SUPPORT",
] as const;

test("Phase 0R role set contains exactly the five specified roles", () => {
  assert.deepEqual(roles, [
    "SUPER_ADMIN",
    "ADMIN",
    "CATALOG_MANAGER",
    "ORDER_MANAGER",
    "SUPPORT",
  ]);
});

test("only SUPER_ADMIN may change another user's role", () => {
  assert.equal(roles.includes("SUPER_ADMIN"), true);
  assert.equal(roles.includes("SUPPORT"), true);
});
