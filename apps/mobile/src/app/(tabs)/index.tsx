import {useCatalogue} from '../../state/catalogue';
import {Page, State} from '../../components/ui';
import {HomeDiscovery} from '../../components/home-discovery';
import {resolveHomeLayout} from '../../../../../packages/catalogue/src/home-layout';

export default function Home() {
  const {layout: publishedLayout, meta, products, bundleTemplates} = useCatalogue();
  const layout = resolveHomeLayout(publishedLayout, {
    demo: meta.demo,
    productIds: products.map(product => product.id),
    hasBundleTemplates: bundleTemplates.length > 0,
    hasRecipients: products.some(product => product.recipientIds.length > 0),
  });
  return <Page headerTools="home" sideRailActive="all">
    {!layout.sections.some(section => section.enabled) && !meta.demo
      ? <State title="Catalogue is being prepared" message="Published collections and featured gifts will appear here when they are ready." />
      : <HomeDiscovery layout={layout} />}
  </Page>;
}
