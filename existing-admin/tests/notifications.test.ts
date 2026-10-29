import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  NOTIFICATION_TEMPLATE_VARIABLES,
  extractNotificationPlaceholders,
  normalizeNotificationTemplate,
  renderNotificationTemplate,
  validateNotificationTemplateInput,
} from "../src/lib/notifications/templates";

test("notification templates contain all transactional events", () => {
  assert.deepEqual(
    DEFAULT_NOTIFICATION_TEMPLATES.map((template) => template.id),
    ["order_confirmed", "payment_failed", "order_shipped", "order_out_for_delivery", "order_delivered", "support_reply"],
  );
});

test("notification placeholders render safely", () => {
  const rendered = renderNotificationTemplate("Hello {{customerName}} - {{orderId}} {{missing}}", {
    customerName: "Roshan",
    orderId: "G4U-2609-12345",
  });
  assert.equal(rendered, "Hello Roshan - G4U-2609-12345 ");
});

test("notification template normalization preserves safe defaults", () => {
  const fallback = DEFAULT_NOTIFICATION_TEMPLATES[0];
  const normalized = normalizeNotificationTemplate({ subject: "", isActive: false }, fallback);
  assert.equal(normalized.id, fallback.id);
  assert.equal(normalized.subject, fallback.subject);
  assert.equal(normalized.body, fallback.body);
  assert.equal(normalized.isActive, false);
});

test("notification placeholders expose the variables supported by each event", () => {
  assert.deepEqual(NOTIFICATION_TEMPLATE_VARIABLES.order_shipped, [
    "customerName",
    "orderId",
    "courier",
    "trackingNumber",
    "trackingLink",
  ]);
  assert.deepEqual(extractNotificationPlaceholders("Hi {{customerName}} {{orderId}}"), ["customerName", "orderId"]);
});

test("notification template validation rejects unsupported placeholders", () => {
  const fallback = DEFAULT_NOTIFICATION_TEMPLATES[0];
  const result = validateNotificationTemplateInput({
    subject: "Order {{orderId}}",
    body: "Hi {{customerName}}, {{unknownValue}}",
    isActive: true,
  }, fallback);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /unknownValue/);
});

test("notification template validation accepts supported placeholders", () => {
  const fallback = DEFAULT_NOTIFICATION_TEMPLATES[2];
  const result = validateNotificationTemplateInput({
    subject: "Shipped {{orderId}}",
    body: "{{customerName}} {{courier}} {{trackingNumber}} {{trackingLink}}",
    isActive: true,
  }, fallback);
  assert.equal(result.ok, true);
});
