export interface WeddingPlan { ceremonyIds: string[]; customEvents: { id: string; name: string }[]; eventDate: string; guestCount: number; familyConfirmed: boolean }
export const emptyWeddingPlan: WeddingPlan = { ceremonyIds: [], customEvents: [], eventDate: '', guestCount: 1, familyConfirmed: false };
export function validateWeddingPlan(plan: WeddingPlan): string | null {
  if (!Number.isInteger(plan.guestCount) || plan.guestCount < 1 || plan.guestCount > 1000) return 'Guest count must be a whole number from 1 to 1000.';
  if (plan.eventDate) { const d = new Date(`${plan.eventDate}T12:00:00Z`); if (!/^\d{4}-\d{2}-\d{2}$/.test(plan.eventDate) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== plan.eventDate) return 'Use a valid date in YYYY-MM-DD format.'; }
  if (plan.customEvents.some(e => !e.name.trim() || e.name.length > 80)) return 'Custom event names must have 1–80 characters.';
  return null;
}
