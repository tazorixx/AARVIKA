import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, products, searchCatalog } from '../src/services/catalog.ts';
import { furnitureGroups } from '../src/services/furniture-fixtures.ts';
import { saveInquiry, validateInquiry, withdrawInquiry, type InquiryDraft } from '../src/domain/furniture.ts';
const input: InquiryDraft = { kind: 'Custom design', familyId: 'furniture-1', width: 120, depth: 60, height: 80, unit: 'cm', material: 'Wood', finish: 'Matte', style: 'Modern', budgetPaise: 1500000, pincode: '411001', assemblyRequested: true, notes: 'Sample console with drawers', media: [] };
test('18 Furniture families and all 126 source groups are reachable with inquiry concepts', () => { assert.equal(furnitureGroups.length, 18); assert.equal(furnitureGroups.flat().length, 126); assert.equal(categories.filter(c => c.departmentId === 'furniture' && c.level === 3).length, 126); for (const c of categories.filter(c => c.departmentId === 'furniture' && c.level === 3)) { const p = products.find(p => p.categoryIds.includes(c.id)); assert.ok(p, c.name); assert.equal(p.purchaseMode, 'inquiry'); assert.equal(p.skuIds.length, 0); } });
test('dimensions/material/finish compose and unpriced inquiries stay honest under budget', () => { const r = searchCatalog({ departmentId: 'furniture', includeUnpriced: true, maxPrice: 100, maxWidth: 130, attributes: { Sector: 'Commercial', Material: 'Wood', Finish: 'Natural' } }); assert.ok(r.total); assert.ok(r.products.every(p => p.purchaseMode === 'inquiry' && Number(p.specs.Width) <= 130)); });
test('inquiry revisions preserve history, owner isolation and withdrawn state', () => { const first = saveInquiry(input, 'guest', 'q1', '2026-10-24'); const second = saveInquiry({ ...input, budgetPaise: 2000000 }, 'guest', 'q1', '2026-10-25', first, 1); assert.equal(second.revision, 2); assert.equal(second.history[0].budgetPaise, 1500000); assert.throws(() => saveInquiry(input, 'other', 'q1', 'now', first, 1)); assert.throws(() => saveInquiry(input, 'guest', 'q1', 'now', second, 1)); const withdrawn = withdrawInquiry(second, 'now'); assert.equal(withdrawn.status, 'withdrawn'); assert.throws(() => saveInquiry(input, 'guest', 'q1', 'now', withdrawn, 3)); });
test('invalid dimensions, budget, PIN and foreign media are rejected', () => { for (const patch of [{ width: -1 }, { budgetPaise: NaN }, { pincode: '000000' }, { media: [{ id: 'm', ownerId: 'other', localOnly: true, uri: 'local', mimeType: 'image/png', bytes: 100 }] }]) assert.ok(validateInquiry({ ...input, ...patch }, 'guest')); });

test('emulator-managed active furniture families work without accepting arbitrary or inactive IDs',()=>{
 const configured={...input,familyId:'demo-office-family'};
 assert.ok(validateInquiry(configured,'guest'));
 assert.equal(validateInquiry(configured,'guest',['demo-office-family']),null);
 assert.ok(validateInquiry(configured,'guest',[]));
 assert.equal(saveInquiry(configured,'guest','q','now',undefined,undefined,['demo-office-family']).input.familyId,'demo-office-family');
});
