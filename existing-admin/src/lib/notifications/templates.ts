export const NOTIFICATION_TEMPLATE_KEYS = [
  "order_confirmed",
  "payment_failed",
  "order_shipped",
  "order_out_for_delivery",
  "order_delivered",
  "support_reply",
] as const;

export type NotificationTemplateKey = (typeof NOTIFICATION_TEMPLATE_KEYS)[number];

export const NOTIFICATION_TEMPLATE_VARIABLES: Record<NotificationTemplateKey, readonly string[]> = {
  order_confirmed: ["customerName", "orderId"],
  payment_failed: ["customerName", "orderId"],
  order_shipped: ["customerName", "orderId", "courier", "trackingNumber", "trackingLink"],
  order_out_for_delivery: ["customerName", "orderId", "courier", "trackingNumber", "trackingLink"],
  order_delivered: ["customerName", "orderId"],
  support_reply: ["customerName", "ticketId"],
};

export type NotificationTemplate = {
  id: NotificationTemplateKey;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
};

export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "order_confirmed",
    name: "Order confirmed",
    subject: "Your Gift4U order {{orderId}} is confirmed",
    body: "Hi {{customerName}}, your Gift4U order {{orderId}} has been confirmed. Your gift is now being prepared.",
    isActive: true,
  },
  {
    id: "payment_failed",
    name: "Payment failed",
    subject: "Payment update for Gift4U order {{orderId}}",
    body: "Hi {{customerName}}, the payment for Gift4U order {{orderId}} could not be completed. Please return to Gift4U and try again.",
    isActive: true,
  },
  {
    id: "order_shipped",
    name: "Order shipped",
    subject: "Your Gift4U order {{orderId}} has shipped",
    body: "Hi {{customerName}}, your Gift4U order {{orderId}} has been shipped. Courier: {{courier}}. Tracking number: {{trackingNumber}}.{{trackingLink}}",
    isActive: true,
  },
  {
    id: "order_out_for_delivery",
    name: "Out for delivery",
    subject: "Your Gift4U order {{orderId}} is out for delivery",
    body: "Hi {{customerName}}, your Gift4U order {{orderId}} is out for delivery today. Courier: {{courier}}. Tracking number: {{trackingNumber}}.{{trackingLink}}",
    isActive: true,
  },
  {
    id: "order_delivered",
    name: "Order delivered",
    subject: "Your Gift4U order {{orderId}} was delivered",
    body: "Hi {{customerName}}, your Gift4U order {{orderId}} has been marked delivered. We hope the gift brings a smile!",
    isActive: true,
  },
  {
    id: "support_reply",
    name: "Support reply",
    subject: "Gift4U Support replied to request {{ticketId}}",
    body: "Hi {{customerName}}, Gift4U Support has replied to your support request {{ticketId}}. Sign in to Gift4U to view the conversation.",
    isActive: true,
  },
];

export function isNotificationTemplateKey(value: string): value is NotificationTemplateKey {
  return (NOTIFICATION_TEMPLATE_KEYS as readonly string[]).includes(value);
}

export function extractNotificationPlaceholders(template: string): string[] {
  const values = new Set<string>();
  const pattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(template)) !== null) {
    values.add(match[1]);
  }

  return [...values];
}

export function normalizeNotificationTemplate(value: unknown, fallback: NotificationTemplate): NotificationTemplate {
  const input = (value || {}) as Record<string, unknown>;
  const subject = typeof input.subject === "string" ? input.subject.trim() : fallback.subject;
  const body = typeof input.body === "string" ? input.body.trim() : fallback.body;
  return {
    id: fallback.id,
    name: fallback.name,
    subject: subject || fallback.subject,
    body: body || fallback.body,
    isActive: typeof input.isActive === "boolean" ? input.isActive : fallback.isActive,
  };
}

export function validateNotificationTemplateInput(
  input: unknown,
  fallback: NotificationTemplate,
): { ok: true; value: NotificationTemplate } | { ok: false; error: string } {
  const normalized = normalizeNotificationTemplate(input, fallback);
  if (normalized.subject.length > 180) {
    return { ok: false, error: "Notification subject must be 180 characters or fewer." };
  }
  if (normalized.body.length > 10000) {
    return { ok: false, error: "Notification body must be 10,000 characters or fewer." };
  }

  const allowed = new Set(NOTIFICATION_TEMPLATE_VARIABLES[fallback.id]);
  const placeholders = [
    ...extractNotificationPlaceholders(normalized.subject),
    ...extractNotificationPlaceholders(normalized.body),
  ];
  const unsupported = [...new Set(placeholders)].filter((key) => !allowed.has(key));

  if (unsupported.length > 0) {
    return {
      ok: false,
      error: `Unsupported placeholder(s): ${unsupported.map((key) => `{{${key}}}`).join(", ")}.`,
    };
  }

  return { ok: true, value: normalized };
}

export function renderNotificationTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => values[key] ?? "");
}
