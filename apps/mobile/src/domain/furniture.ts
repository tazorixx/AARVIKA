import type { MediaAsset, QuoteRequest } from './contracts';
export interface InquiryDraft { kind: 'Custom design' | 'Modify existing' | 'Room set' | 'Commercial project'; familyId: string; productId?: string; width: number; depth: number; height: number; unit: 'cm' | 'mm' | 'in'; material: string; finish: string; style: string; budgetPaise: number; pincode: string; assemblyRequested: boolean; notes: string; media: MediaAsset[] }
export interface FurnitureInquiry extends QuoteRequest { status: 'local-draft' | 'withdrawn'; input: InquiryDraft; revision: number; history: { revision: number; at: string; status: string; dimensions: string; material: string; budgetPaise: number; mediaIds: string[]; notes: string }[] }
const confirmedFamilyIds=Array.from({length:18},(_,i)=>`furniture-${i+1}`);
export function validateInquiry(draft: InquiryDraft, ownerId: string, familyIds: readonly string[]=confirmedFamilyIds): string | null {
  if (!['Custom design', 'Modify existing', 'Room set', 'Commercial project'].includes(draft.kind)) return 'Choose an inquiry type.';
  if (!familyIds.includes(draft.familyId)) return 'Choose an active furniture family.';
  if (!['cm', 'mm', 'in'].includes(draft.unit)) return 'Choose a supported measurement unit.';
  const factor = draft.unit === 'mm' ? 0.1 : draft.unit === 'in' ? 2.54 : 1;
  if ([draft.width, draft.depth, draft.height].some(n => !Number.isFinite(n) || n <= 0 || n * factor > 10000)) return 'Enter positive dimensions no larger than 100 metres.';
  if (draft.material.trim().length < 2 || draft.material.length > 80) return 'Describe a material in 2–80 characters.';
  if (!Number.isSafeInteger(draft.budgetPaise) || draft.budgetPaise <= 0) return 'Enter a positive budget in rupees.';
  if (!/^[1-9]\d{5}$/.test(draft.pincode)) return 'Enter a valid 6-digit delivery PIN.';
  if (draft.notes.length > 1000 || draft.finish.length > 80 || draft.style.length > 80) return 'Shorten the request details.';
  if (draft.media.length > 3 || draft.media.some(m => m.ownerId !== ownerId || !m.localOnly || !['image/jpeg', 'image/png', 'image/webp'].includes(m.mimeType) || m.bytes <= 0 || m.bytes > 5 * 1024 * 1024)) return 'Use up to three local photos belonging to this profile, each no larger than 5 MB.';
  return null;
}
export function saveInquiry(input: InquiryDraft, ownerId: string, id: string, at: string, existing?: FurnitureInquiry, expectedRevision?: number, familyIds:readonly string[]=confirmedFamilyIds): FurnitureInquiry {
  const error = validateInquiry(input, ownerId, familyIds); if (error) throw new Error(error);
  if (existing && (existing.customerId !== ownerId || existing.status !== 'local-draft' || existing.revision !== expectedRevision)) throw new Error('This inquiry changed or was withdrawn. Reload before revising.');
  const revision = (existing?.revision ?? 0) + 1, dimensions = `${input.width} × ${input.depth} × ${input.height} ${input.unit}`;
  return { id, customerId: ownerId, dimensions, material: input.material, budget: { amount: input.budgetPaise, currency: 'INR' }, mediaIds: input.media.map(m => m.id), status: 'local-draft', input: JSON.parse(JSON.stringify(input)), revision, history: [...(existing?.history ?? []), { revision, at, status: 'local-draft', dimensions, material: input.material, budgetPaise: input.budgetPaise, mediaIds: input.media.map(m => m.id), notes: input.notes }] };
}
export function withdrawInquiry(inquiry: FurnitureInquiry, at: string): FurnitureInquiry { if (inquiry.status !== 'local-draft') throw new Error('Inquiry is already withdrawn.'); return { ...inquiry, status: 'withdrawn', revision: inquiry.revision + 1, history: [...inquiry.history, { ...inquiry.history[inquiry.history.length - 1], revision: inquiry.revision + 1, at, status: 'withdrawn' }] }; }
