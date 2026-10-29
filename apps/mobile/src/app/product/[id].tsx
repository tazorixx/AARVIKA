import {useEffect, useState, type ReactNode} from 'react';
import {Pressable, ScrollView, Text, View, useWindowDimensions} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {LocalDemoImage, prefetchProductImages} from '../../components/local-demo-image';
import {useCatalogue} from '../../state/catalogue';
import {useStore} from '../../state/store';
import {Page, Label, Button, Card, State, Sheet, Notice, styles} from '../../components/ui';
import {CustomerActions} from '../../components/customer-actions';
import {PersonalizationForm} from '../../components/personalization-form';
import {ProductArt} from '../../components/product';
import {ProductRail} from '../../components/visual-commerce';
import type {Product} from '../../domain/contracts';
import {previewProductPrice} from '../../domain/product-price';
import {money} from '../../domain/money';
import {rankRelatedProducts} from '../../../../../packages/catalogue/src/recommendations';
import {theme} from '../../theme';

function DetailDisclosure({title, children, initiallyOpen = false}: {title: string; children: ReactNode; initiallyOpen?: boolean}) {
  const [open, setOpen] = useState(initiallyOpen);
  return <View style={{borderTopWidth: 1, borderTopColor: theme.colors.border}}>
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{expanded: open}} onPress={() => setOpen(value => !value)} style={({pressed}) => ({minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: pressed ? .65 : 1})}>
      <Text style={[styles.text, {fontSize: 13, fontWeight: '700'}]}>{title}</Text><Text style={{fontSize: 19, color: theme.colors.primary}}>{open ? '−' : '+'}</Text>
    </Pressable>
    {open && <View style={{paddingBottom: 11, gap: 5}}>{children}</View>}
  </View>;
}

function detailsFor(product: Product, attributes: Record<string, string>) {
  const rows = new Map<string, {label: string; value: string}>();
  for (const [label, value] of [...Object.entries(product.specs), ...Object.entries(attributes)]) {
    const key = label.trim().toLowerCase();
    rows.set(key, {label: rows.get(key)?.label ?? label, value});
  }
  return [...rows.values()];
}

export default function ProductDetail() {
  const {catalogService, products, categories, skus, bundleTemplates, catalogueRevision} = useCatalogue();
  const store = useStore();
  const {width} = useWindowDimensions();
  const {id} = useLocalSearchParams<{id: string}>();
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState('loading');
  const [selected, setSelected] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {if (active) {setStatus('loading'); setProduct(null); setImageIndex(0);}});
    catalogService.getProduct(id).then(next => {
      if (!active) return;
      setProduct(next);
      setSelected(current => next?.skuIds.includes(current) ? current : next?.skuIds[0] ?? '');
      setStatus(next ? 'ready' : 'missing');
    }).catch(error => {if (active) setStatus((error as Error).message);});
    return () => {active = false;};
  }, [id, attempt, catalogService, catalogueRevision]);

  useEffect(() => {
    if (product) prefetchProductImages(product.media?.slice(1, 3).map(media => media.path) ?? [], Math.max(0, Math.min(width, 960) - 24));
  }, [product, width]);

  const sku = skus.find(value => value.id === selected);
  const price = product ? sku?.price.amount ?? (product.prebuiltBundle ? previewProductPrice(product, skus, bundleTemplates) : undefined) : undefined;
  const related = product ? rankRelatedProducts(product, products, categories, skus, 16) : [];
  const similar = related.slice(0, 8);
  const more = product ? related.slice(8).filter(candidate => candidate.departmentIds.some(department => product.departmentIds.includes(department))).slice(0, 8) : [];
  const draftKey = product ? 'product:' + product.id : '';
  const draft = store.profile.drafts[draftKey] ?? {values: {font: 'Classic'}, media: []};
  const saved = !!product && store.profile.wishlist.includes(product.id);

  return <Page key={id} title="The thoughtful details" back footer={product ? <View style={{gap: 4}}><View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}><Text style={[styles.text, {fontSize: 15, fontWeight: '700', color: theme.colors.plum}]}>{price === undefined ? 'Price on request' : money(price)}</Text><Text style={[styles.text, {fontSize: 10, color: theme.colors.muted}]}>{price === undefined ? 'Vendor quote' : 'Demo price'}</Text></View><CustomerActions product={product} skuId={selected} presentation="footer" /></View> : undefined}>
    {status === 'loading' ? <State title="Loading design" message="Fetching demo details…" loading /> : !product ? <State title={status === 'missing' ? 'Product unavailable' : 'Could not load product'} message={status === 'missing' ? 'This design may have moved. Return to the catalogue.' : status} retry={status === 'missing' ? undefined : () => setAttempt(value => value + 1)} /> : <>
      <Pressable testID="product-gallery-main" accessibilityRole="button" accessibilityLabel={'Expand image of ' + product.title} onPress={() => setZoom(true)} style={({pressed}) => ({borderRadius: 12, overflow: 'hidden', opacity: pressed ? .84 : 1})}>
        <ProductArt product={sku?.image ? {...product, art: sku.image.art, glyph: sku.image.glyph} : product} large imageIndex={imageIndex} />
        <View style={{position: 'absolute', bottom: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: '#3E155CD9'}}><Text style={{color: 'white', fontSize: 10}}>{product.media?.length ? String(imageIndex + 1) + ' / ' + product.media.length : 'Tap to enlarge'}</Text></View>
      </Pressable>
      {(product.media?.length ?? 0) > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Product images" contentContainerStyle={{gap: 7}}>{product.media!.map((media, index) => <Pressable key={media.path + index} accessibilityRole="button" accessibilityLabel={'Show product image ' + (index + 1)} accessibilityState={{selected: imageIndex === index}} onPress={() => setImageIndex(index)} style={{width: 62, height: 62, borderRadius: 9, padding: 3, borderWidth: imageIndex === index ? 2 : 1, borderColor: imageIndex === index ? theme.colors.primary : theme.colors.border, backgroundColor: 'white'}}><LocalDemoImage path={media.path} label={media.alt} style={{width: '100%', height: '100%', borderRadius: 6}} /></Pressable>)}</ScrollView>}
      <Sheet title="Product image" visible={zoom} onClose={() => setZoom(false)}><ProductArt product={sku?.image ? {...product, art: sku.image.art, glyph: sku.image.glyph} : product} large zoom imageIndex={imageIndex} /><Label muted>{product.media?.[imageIndex]?.alt ?? 'Illustrative demo design'}</Label>{(product.media?.length ?? 0) > 1 && <View style={styles.row}>{product.media!.map((media, index) => <Button key={media.path + index} title={'Image ' + (index + 1)} secondary selected={imageIndex === index} onPress={() => setImageIndex(index)} />)}</View>}</Sheet>
      <View style={{gap: 4}}><Text accessibilityRole="header" style={[styles.text, {fontSize: 19, lineHeight: 24, fontWeight: '700'}]}>{product.title}</Text><Text style={[styles.text, {fontSize: 20, lineHeight: 25, fontWeight: '700', color: theme.colors.plum}]}>{price === undefined ? 'Price on request' : money(price)}</Text><Label muted>{price === undefined ? 'A vendor quote is required before any purchase.' : 'Demo catalogue price · final checkout is unavailable.'}</Label></View>
      <Button title={saved ? '♥ Saved to wishlist' : '♡ Save to wishlist'} secondary onPress={() => {void store.toggleWish(product.id).catch(error => setNotice((error as Error).message));}} />
      {!!notice && <Notice>{notice}</Notice>}
      {product.skuIds.length > 0 && <View style={{gap: 7}}><Label heading>Choose your option</Label><View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>{product.skuIds.map(skuId => {const option = skus.find(value => value.id === skuId); if (!option) return null; const active = skuId === selected; return <Pressable key={skuId} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{selected: active, disabled: option.inventory.available === 0}} onPress={() => {setSelected(skuId); setImageIndex(0);}} style={({pressed}) => ({minWidth: 120, minHeight: 57, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: active ? 2 : 1, borderColor: active ? theme.colors.primary : theme.colors.border, backgroundColor: active ? theme.colors.pale : 'white', opacity: pressed ? .72 : 1})}><Text style={[styles.text, {fontSize: 12, lineHeight: 16, fontWeight: '700'}]}>{option.label}</Text><Text style={[styles.text, {fontSize: 12, lineHeight: 16, color: theme.colors.primary}]}>{money(option.price.amount)}{option.inventory.available === 0 ? ' · Sold out' : ''}</Text></Pressable>;})}</View></View>}
      <Card><Label heading>Delivery & availability</Label><Label muted>{sku ? sku.inventory.available ? String(sku.inventory.available) + ' demo units available' : 'Sold out in demo catalogue' : product.prebuiltBundle ? 'Availability depends on each component.' : 'Availability requires a vendor quote.'}</Label><Label muted>Delivery eligibility and date have not been verified.</Label><Button title="Choose delivery location" secondary onPress={() => router.push('/location')} /></Card>
      {product.personalizationSchemaId && <PersonalizationForm product={product} values={draft.values} media={draft.media} ownerId={store.profile.customer?.id ?? 'guest'} onChange={(values, media) => store.saveDraft(draftKey, values, media)} />}
      {product.prebuiltBundle && <Button title="Edit this gift box" secondary onPress={() => {void store.saveBundleDraft(product.prebuiltBundle!).then(() => router.push('/builder')).catch(error => setNotice((error as Error).message));}} />}
      <Card><DetailDisclosure title="About this product" initiallyOpen><Label>{product.description}</Label></DetailDisclosure><DetailDisclosure title="Product details">{detailsFor(product, sku?.attributes ?? {}).map(({label, value}) => <Label key={label}>{label}: {value}</Label>)}</DetailDisclosure>{product.sizeGuide && <DetailDisclosure title={'Size guide · ' + product.sizeGuide.unit}><Label muted>{product.sizeGuide.instructions}</Label>{product.sizeGuide.rows.map(row => <Label key={row.size}>{row.size} · Chest {row.chest} cm · Length {row.length} cm</Label>)}</DetailDisclosure>}<DetailDisclosure title="Delivery & returns"><Label muted>Delivery dates and serviceability are unverified.</Label><Label muted>{product.returnsPolicy || 'Return terms will be shown when a verified merchant policy is available.'}</Label></DetailDisclosure><DetailDisclosure title="Customer reviews"><Label muted>No verified customer reviews yet.</Label></DetailDisclosure></Card>
      {similar.length > 0 && <ProductRail title="You may also like" products={similar} />}
      {more.length > 0 && <ProductRail title="More from this department" products={more} />}
    </>}
  </Page>;
}
