export type TransactionalEmail = {
  to: { email: string; name?: string };
  subject: string;
  textContent: string;
};

function getBrevoConfig() {
  return {
    apiKey: process.env.BREVO_API_KEY || "",
    senderEmail: process.env.BREVO_SENDER_EMAIL || "",
    senderName: process.env.BREVO_SENDER_NAME || "Gift4U",
  };
}

export async function sendTransactionalEmail(email: TransactionalEmail): Promise<{ provider: "brevo" | "mock"; messageId: string }> {
  const { apiKey, senderEmail, senderName } = getBrevoConfig();

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.");
    }

    console.info("[Gift4U email mock]", {
      to: email.to.email,
      subject: email.subject,
      textContent: email.textContent,
    });
    return { provider: "mock", messageId: `mock_${Date.now()}` };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [email.to],
      subject: email.subject,
      textContent: email.textContent,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brevo email failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { messageId?: string };
  return { provider: "brevo", messageId: data.messageId || `brevo_${Date.now()}` };
}
