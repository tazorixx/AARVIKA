import type {PageLayout} from './contracts.ts';
import {withOwnerHero} from './hero-images.ts';

// Shared presentation only: no fixture products, prices or stock.
export const defaultHomeLayout: PageLayout = { id: 'home', version: 2, sections: [
  { id: 'departments', type: 'departments', title: 'Explore AARVIKA', dataSourceRef: 'departments', order: 0, enabled: true, responsivePresentation: 'compact', action: '/categories' },
  { id: 'hero', type: 'hero', title: 'Little things. Lasting memories.', dataSourceRef: 'editorial', order: 1, enabled: true, responsivePresentation: 'compact', action: '/search' },
  { id: 'wedding', type: 'collection', title: 'Wedding gifts', dataSourceRef: 'wedding', order: 2, enabled: true, responsivePresentation: 'compact', action: '/department/wedding' },
  { id: 'birthday', type: 'collection', title: 'Birthday gifts', dataSourceRef: 'birthday', order: 3, enabled: true, responsivePresentation: 'compact', action: '/department/birthday' },
  { id: 'anniversary', type: 'collection', title: 'Anniversary gifts', dataSourceRef: 'anniversary', order: 4, enabled: true, responsivePresentation: 'compact', action: '/department/anniversary' },
  { id: 'personalized', type: 'collection', title: 'Made just for them', dataSourceRef: 'personalized', order: 5, enabled: true, responsivePresentation: 'compact', action: '/department/personalized' },
  { id: 'picks', type: 'products', title: 'Thoughtfully picked', dataSourceRef: 'thoughtful', order: 6, enabled: true, responsivePresentation: 'compact', limit: 8, action: '/search' },
  { id: 'combo', type: 'combo', title: 'Put a little of you in every box', dataSourceRef: 'gift-box', order: 7, enabled: true, responsivePresentation: 'compact', action: '/builder' },
  { id: 'styles', type: 'departments', title: 'Shop by gift style', dataSourceRef: '@styles', order: 8, enabled: true, responsivePresentation: 'compact', action: '/categories' },
  { id: 'recipients', type: 'departments', title: 'Gifts for your people', dataSourceRef: '@recipients', order: 9, enabled: true, responsivePresentation: 'compact', action: '/search' },
  { id: 'more', type: 'products', title: 'More to explore', dataSourceRef: '@more', order: 10, enabled: true, responsivePresentation: 'compact', limit: 8, action: '/search' },
] };

export function resolveHomeLayout(layout:PageLayout, options:{demo:boolean;productIds:string[];hasBundleTemplates:boolean;hasRecipients:boolean}):PageLayout {
 if(options.demo||layout.version!==0||layout.sections.length)return layout;
 return {id:'home-default',version:0,sections:defaultHomeLayout.sections
  .filter(section=>(section.type!=='combo'||options.hasBundleTemplates)&&(section.dataSourceRef!=='@recipients'||options.hasRecipients))
  .map(section=>section.type==='products'?{...section,productIds:options.productIds.slice(section.id==='more'?8:0,section.id==='more'?16:8)}:withOwnerHero({...section},'home'))};
}
