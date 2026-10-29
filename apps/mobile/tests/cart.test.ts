import test from 'node:test';
import assert from 'node:assert/strict';
import { addLine, lineKey, validateAddress, validateCart } from '../src/domain/cart.ts';
import { skus } from '../src/services/catalog.ts';
import type { CartLine } from '../src/domain/contracts';
const line = (skuId = 'cotton-kurta-standard'): Omit<CartLine, 'id'> => ({ skuId, quantity: 1, personalization: {}, media: [], giftMessage: '', previewUnitPrice: { amount: 0, currency: 'INR' } });
test('variants remain separate, identical lines merge and stock limits are enforced', () => { const a = addLine([], line(), skus), b = addLine(a, line('cotton-kurta-large'), skus); assert.equal(b.length, 2); assert.equal(addLine(b, line(), skus)[0].quantity, 2); assert.throws(() => addLine([], { ...line('cotton-kurta-large'), quantity: 5 }, skus)); assert.throws(() => addLine([], line('bead-bracelet-standard'), skus)); assert.ok(validateCart([{ ...line(), id: 'x', quantity: -1 }], skus).length); });
test('personalization, message and media identify separate lines; field key order does not', () => { const a = { ...line(), personalization: { name: 'A', font: 'Classic' } }; assert.equal(lineKey(a), lineKey({ ...a, personalization: { font: 'Classic', name: 'A' } })); assert.notEqual(lineKey(a), lineKey({ ...a, giftMessage: 'Happy day' })); });
test('address validation rejects missing fields and invalid phone/PIN', () => { assert.ok(validateAddress({ name: '', phone: '', line: '', city: '', state: '', pincode: '' })); assert.equal(validateAddress({ name: 'Demo', phone: '9876543210', line: 'Sample lane', city: 'Pune', state: 'Maharashtra', pincode: '411001' }), null); });
