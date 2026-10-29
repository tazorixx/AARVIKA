import {defaultCommerceSections} from './visual-commerce.ts';
import {withOwnerHero} from './hero-images.ts';
import type {DepartmentId} from './departments.ts';
/** Reuse approved layout and artwork, never fixture products, stock or prices. */
export function publishedDepartmentPresentation(id: DepartmentId, hasBundles: boolean) {
  return defaultCommerceSections(id)
    .filter(section => section.type !== 'combo' || hasBundles || id === 'personalized' || id === 'furniture')
    .map(section => withOwnerHero(section,id));
}
