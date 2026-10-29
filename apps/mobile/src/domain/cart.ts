import type { Address, CartLine, Sku } from './contracts';
function canonical(values: Record<string, string>) { return Object.keys(values).sort().map(k => [k, values[k]]); }
export function lineKey(line: Omit<CartLine, 'id'>): string {
  return JSON.stringify([line.skuId, canonical(line.personalization), line.media.map(m => m.id).sort(), line.giftMessage, line.bundle ? [line.bundle.templateId, line.bundle.recipient, line.bundle.occasion, line.bundle.packaging, line.bundle.message, line.bundle.components.map(c => [c.skuId, c.quantity, canonical(c.personalization), c.media.map(m => m.id).sort()]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))] : null]);
}
export function validateCart(lines: CartLine[], skus: Sku[]): string[] {
  const errors: string[] = [], totals: Record<string, number> = {};
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 100) errors.push('Quantity must be a whole number from 1 to 100.');
    for (const item of line.bundle?.components ?? (line.skuId ? [{ skuId: line.skuId, quantity: 1 }] : [])) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) errors.push('Invalid component quantity.');
      totals[item.skuId] = (totals[item.skuId] ?? 0) + item.quantity * line.quantity;
    }
    if (!line.skuId && !line.bundle) errors.push('Choose a sellable SKU.');
  }
  for (const [id, quantity] of Object.entries(totals)) { const sku = skus.find(s => s.id === id); if (!sku) errors.push('A selected SKU is unavailable.'); else if (quantity > sku.inventory.available) errors.push(`${sku.label}: only ${sku.inventory.available} demo units available.`); }
  return errors;
}
export function addLine(lines: CartLine[], incoming: Omit<CartLine, 'id'>, skus: Sku[]) {
  const id = lineKey(incoming), match = lines.find(l => l.id === id);
  const next = match ? lines.map(l => l.id === id ? { ...l, quantity: l.quantity + incoming.quantity } : l) : [...lines, { ...incoming, id }];
  const errors = validateCart(next, skus); if (errors.length) throw new Error(errors[0]); return next;
}
export function validateAddress(address: Omit<Address, 'id'>) {
  if (!address.name.trim() || !address.line.trim() || !address.city.trim() || !address.state.trim()) return 'Complete all address fields.';
  if (!/^[6-9]\d{9}$/.test(address.phone)) return 'Enter a valid 10-digit Indian mobile number.';
  if (!/^[1-9]\d{5}$/.test(address.pincode)) return 'Enter a valid 6-digit PIN code.';
  return null;
}
