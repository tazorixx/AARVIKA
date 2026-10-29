import { getAdminDb } from "../../src/lib/firebase-admin";
import { sweepExpiredOrders } from "../../src/lib/checkout/inventory";

export const config = {
  schedule: "*/5 * * * *",
};

export default async function handler() {
  const swept = await sweepExpiredOrders(getAdminDb());
  console.log(`Gift4U inventory sweep released ${swept} expired order(s).`);
  return new Response(JSON.stringify({ ok: true, swept }), {
    headers: { "content-type": "application/json" },
  });
}
