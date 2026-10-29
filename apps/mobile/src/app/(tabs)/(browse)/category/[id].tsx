import {Image} from 'expo-image';
import {useLocalSearchParams, router} from 'expo-router';
import {Pressable, Text, View} from 'react-native';
import {CommerceHero, ProductRail, VisualTiles, categoryTiles} from '../../../../components/visual-commerce';
import {departmentVisuals} from '../../../../../../../packages/catalogue/src/visual-commerce';
import {useCatalogue} from '../../../../state/catalogue';
import {Page, Label, Button, State} from '../../../../components/ui';
import {FurnitureHome} from '../../../../components/furniture-home';
import {SpecificationBrowser} from '../../../../components/specification-browser';
import {CatalogBrowser} from '../../../../components/catalog-browser';
import {theme} from '../../../../theme';

export default function Category() {
  const {categories, products} = useCatalogue();
  const {id} = useLocalSearchParams<{id: string}>();
  const category = categories.find(item => item.id === id);
  const parent = categories.find(item => item.id === category?.parentId);
  if (!category) return <Page title="Category unavailable" back><State title="Category not found" message="Return to Categories to choose an available section." /></Page>;

  const browseAction = '/search?departmentId=' + category.departmentId + '&categoryId=' + category.id;
  const hero = {...departmentVisuals[category.departmentId], ...category.visual, ...category.page?.hero, title: category.page?.hero?.title || category.visual?.title || category.name, ctaLabel: 'Shop this category', ...(category.page?.hero?.imagePath ? {images: [{imagePath:category.page.hero.imagePath,imageAlt:category.page.hero.imageAlt||category.name,imageFit:category.page.hero.imageFit??'cover' as const}]} : {})};
  const featured = products.filter(product => category.page?.featuredProductIds.includes(product.id));
  const shortcutIds = category.page?.featuredCategoryIds ?? [];
  const shortcuts = shortcutIds.length ? categories.filter(item => shortcutIds.includes(item.id)) : categories.filter(item => item.parentId === category.id);
  const banner = category.page?.banner;

  return <Page title={category.name} back sideRailActive={category.departmentId}>
    <Label muted>{[parent?.name, category.name].filter(Boolean).join(' › ')}</Label>
    <CommerceHero departmentId={category.departmentId} visual={hero} action={browseAction} />
    {banner && <Pressable accessibilityRole="button" accessibilityLabel={'Explore ' + (banner.title || category.name)} onPress={() => router.push(browseAction)} style={{borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.pale}}>
      {banner.imagePath && <Image source={{uri: banner.imagePath}} accessibilityLabel={banner.imageAlt || banner.title || category.name} contentFit="cover" style={{height: 112, width: '100%'}} />}
      <View style={{paddingHorizontal: 12, paddingVertical: 9}}><Text style={{fontSize: 15, fontWeight: '700', color: theme.colors.plum}}>{banner.title}</Text>{!!banner.subtitle && <Text style={{fontSize: 12, color: theme.colors.muted}}>{banner.subtitle}</Text>}</View>
    </Pressable>}
    <VisualTiles horizontal tiles={categoryTiles(shortcuts)} departmentId={category.departmentId} />
    {!!featured.length && <ProductRail title="Featured gifts" products={featured} action={browseAction} />}
    {(category.id.startsWith('personalized-9') || category.id === 'hampers-10' || category.parentId === 'hampers-10') ? <Button title={'Build ' + category.name} onPress={() => router.push('/builder')} />
      : category.departmentId === 'furniture' ? <FurnitureHome categoryId={category.id} />
      : ['clothing', 'stationery'].includes(category.departmentId) ? <SpecificationBrowser departmentId={category.departmentId as 'clothing' | 'stationery'} categoryId={category.id} />
      : <CatalogBrowser departmentId={category.departmentId} categoryId={category.id} />}
  </Page>;
}
