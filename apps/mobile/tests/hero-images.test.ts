import test from 'node:test';
import assert from 'node:assert/strict';
import {demoSnapshot} from '../../../packages/catalogue/src/fixture-adapter.ts';
import {defaultCommerceSections} from '../../../packages/catalogue/src/visual-commerce.ts';
import {defaultHomeLayout} from '../../../packages/catalogue/src/home-layout.ts';
import {ownerHeroImages, responsiveHeroPath, withOwnerHero} from '../../../packages/catalogue/src/hero-images.ts';
import {validateSnapshot} from '../../../packages/catalogue/src/validation.ts';

test('only fixture hero media changes; headings, actions and other sections stay intact', () => {
  const snapshot = demoSnapshot();
  for (const department of snapshot.departments) {
    const original = defaultCommerceSections(department.id);
    const updated = snapshot.commercePages!.find(page => page.key === 'department:' + department.id)!.sections;
    assert.deepEqual(updated.filter(section => section.type !== 'hero'), original.filter(section => section.type !== 'hero'));
    const {imagePath, mobileImagePath, imageAlt, imageFit, ...unchanged} = updated[0];
    assert.deepEqual(unchanged, original[0]);
    assert.equal(imagePath, ownerHeroImages[department.id].desktop);
    assert.equal(mobileImagePath, ownerHeroImages[department.id].mobile);
    assert.ok(imageAlt && imageFit === 'contain');
  }
  assert.deepEqual(snapshot.layout.sections.filter(s => s.type !== 'hero'), defaultHomeLayout.sections.filter(s => s.type !== 'hero'));
  validateSnapshot(snapshot);
});

test('all nine landing pages select their own mobile image without using desktop as a slide', () => {
  const section = defaultHomeLayout.sections.find(section => section.type === 'hero')!;
  const paths = new Set<string>();
  for (const page of Object.keys(ownerHeroImages) as (keyof typeof ownerHeroImages)[]) {
    const hero = withOwnerHero(section, page);
    assert.equal(responsiveHeroPath(hero, 390), ownerHeroImages[page].mobile);
    assert.equal(responsiveHeroPath(hero, 1280), ownerHeroImages[page].desktop);
    paths.add(hero.imagePath!); paths.add(hero.mobileImagePath!);
  }
  assert.equal(paths.size, 18);
  assert.equal(responsiveHeroPath({imagePath: '/demo-art/box.png'}, 390), '/demo-art/box.png');
});

test('responsive media keeps the existing safe-image validation', () => {
  const snapshot = demoSnapshot();
  snapshot.layout.sections.find(section => section.type === 'hero')!.mobileImagePath = 'https://untrusted.invalid/image.webp';
  assert.throws(() => validateSnapshot(snapshot));
});
