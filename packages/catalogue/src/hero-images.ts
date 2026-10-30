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
  const path = width < 768 ? section.mobileImagePath || section.imagePath : section.imagePath;
  // These six older batch assets were superseded by the owner's supplied image set.
  // Match exact immutable files so future admin uploads retain priority.
  const replaced:Record<string,HeroPage> = {
    'wedding/wedding-root--e6827fd57fab15f9.webp':'wedding',
    'birthday/birthday-root--79b021e1c522b45d.webp':'birthday',
    'anniversary/anniversary-root--4503d066c12b32b6.webp':'anniversary',
    'hampers/hampers-root--315c41a97451e989.webp':'hampers',
    'clothing/clothing-root--7ac74d3b08c37e2f.webp':'clothing',
    'furniture/furniture-root--a65ee4c89f796bad.webp':'furniture',
  };
  const prefix=ownerHeroEndpoint+'/aarvika/heroes/';
  const page=path?.startsWith(prefix)?replaced[path.slice(prefix.length).split('?')[0]]:undefined;
  return page?(width<768?images[page].mobile:images[page].desktop):path;
}
