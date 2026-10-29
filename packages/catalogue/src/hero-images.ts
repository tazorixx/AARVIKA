import images from './fixtures/hero-images.json' with {type:'json'};
import type {Section} from './contracts.ts';

export const ownerHeroImages = images;
export type HeroPage = keyof typeof images;
const approvedPaths = new Set(Object.values(images).flatMap(pair => [pair.desktop, pair.mobile]));
export const ownerHeroEndpoint = new URL(images.home.desktop).origin + '/' + new URL(images.home.desktop).pathname.split('/')[1];
export function isOwnerHeroPath(path: string | undefined): boolean { return !!path && approvedPaths.has(path); }

/** Apply only to the selected fixture's hero sections; never to category artwork. */
export function withOwnerHero(section: Section, page: HeroPage): Section {
  if (section.type !== 'hero') return section;
  const pair = images[page];
  return {...section, imagePath: pair.desktop, mobileImagePath: pair.mobile, imageAlt: pair.alt, imageFit: 'contain'};
}

export function responsiveHeroPath(section: Pick<Section, 'imagePath' | 'mobileImagePath'>, width: number) {
  return width < 768 ? section.mobileImagePath || section.imagePath : section.imagePath;
}
