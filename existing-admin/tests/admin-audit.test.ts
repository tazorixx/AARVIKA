import assert from "node:assert/strict";
import test from "node:test";
import { buildAdminAuditEntry, serializeAuditValue } from "../src/lib/admin/audit";

test("buildAdminAuditEntry creates the expected audit contract", () => {
  const entry = buildAdminAuditEntry({
    actorUid: "actor-1",
    actorRole: "SUPER_ADMIN",
    action: "ADMIN_CREATED",
    entityType: "admin_user",
    entityId: "target-1",
    summary: "Created ADMIN admin account",
    metadata: { role: "ADMIN", disabled: false },
  });
  assert.equal(entry.actorUid, "actor-1");
  assert.equal(entry.action, "ADMIN_CREATED");
  assert.deepEqual(entry.metadata, { role: "ADMIN", disabled: false });
  assert.ok(entry.createdAt);
});

test("serializeAuditValue handles dates and primitive values", () => {
  assert.equal(serializeAuditValue("hello"), "hello");
  assert.equal(serializeAuditValue(42), "42");
  assert.equal(serializeAuditValue(false), "false");
  assert.equal(serializeAuditValue(new Date("2026-01-01T00:00:00.000Z")), "2026-01-01T00:00:00.000Z");
  assert.equal(serializeAuditValue(null), null);
});
