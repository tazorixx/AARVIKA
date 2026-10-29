import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveHomeLayout, defaultHomeLayout} from '../../../packages/catalogue/src/home-layout.ts';

const empty = {id: 'admin-home', version: 0, sections: []};
const options = {demo: false, productIds: [] as string[], hasBundleTemplates: false, hasRecipients: false};

test('unconfigured real catalogue keeps the original homepage without fake merchandise', () => {
  const layout = resolveHomeLayout(empty, options);
  assert.ok(layout.sections.some(section => section.type === 'hero'));
  assert.ok(layout.sections.some(section => section.dataSourceRef === 'departments'));
  assert.ok(layout.sections.some(section => section.dataSourceRef === 'personalized'));
  assert.ok(!layout.sections.some(section => section.type === 'combo' || section.dataSourceRef === '@recipients'));
  assert.ok(layout.sections.filter(section => section.type === 'products').every(section => section.productIds?.length === 0));
  assert.deepEqual(empty.sections, []);
});

test('published empty and explicitly disabled homepages are not overridden', () => {
  const published = {...empty, version: 1};
  assert.equal(resolveHomeLayout(published, options), published);
  const disabled = {...empty, sections: [{...defaultHomeLayout.sections[0], enabled: false}]};
  assert.equal(resolveHomeLayout(disabled, options), disabled);
  assert.equal(resolveHomeLayout(defaultHomeLayout, {...options, demo: true}), defaultHomeLayout);
});

test('default product placements use only supplied real product IDs', () => {
  const productIds = Array.from({length: 11}, (_, n) => `published-${n}`);
  const result = resolveHomeLayout(empty, {...options, productIds});
  assert.deepEqual(result.sections.filter(section => section.type === 'products').flatMap(section => section.productIds ?? []), productIds);
});
