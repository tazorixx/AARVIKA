import type { MediaAsset, PersonalizationSchema, PersonalizationValues } from './contracts';
export function validateMedia(asset: MediaAsset, schema: PersonalizationSchema) {
  if (!schema.photoMimeTypes.includes(asset.mimeType)) return 'Choose a JPEG, PNG or WebP photo.';
  if (!Number.isFinite(asset.bytes) || asset.bytes < 1 || asset.bytes > schema.photoMaxBytes) return 'Photo must be no larger than 5 MB.';
  if (!asset.localOnly || !asset.ownerId) return 'A local demo photo must belong to this profile.';
  return null;
}
export function validatePersonalization(schema: PersonalizationSchema, values: PersonalizationValues, media: MediaAsset[]): string[] {
  const errors: string[] = [];
  for (const field of schema.fields) {
    const value = values[field.key] ?? '';
    if (field.kind === 'photo') { if (field.required && !media.length) errors.push(`${field.label} is required.`); continue; }
    if (field.required && !value.trim()) errors.push(`${field.label} is required.`);
    if (field.maxLength && [...value].length > field.maxLength) errors.push(`${field.label} is limited to ${field.maxLength} characters.`);
    if (field.kind === 'choice' && value && !field.choices?.includes(value)) errors.push(`${field.label} is not supported.`);
  }
  for (const key of Object.keys(values)) if (!schema.fields.some(f => f.key === key)) errors.push('Unsupported personalization field.');
  if (media.length > 1) errors.push('Choose one photo for this design.');
  for (const asset of media) { const error = validateMedia(asset, schema); if (error) errors.push(error); }
  return errors;
}
export function imageMime(base64: string) { if (base64.startsWith('/9j/')) return 'image/jpeg'; if (base64.startsWith('iVBORw0KGgo')) return 'image/png'; if (base64.startsWith('UklGR')) return 'image/webp'; return null; }
