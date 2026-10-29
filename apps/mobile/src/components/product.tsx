import {LocalDemoImage,prefetchProductImages} from './local-demo-image';
import { useCatalogue } from '../state/catalogue';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import type { Product } from '../domain/contracts';
import { previewProductPrice } from '../domain/product-price';
import { money } from '../domain/money';
import { theme } from '../theme';
import { IconButton, Label, styles } from './ui';
import { artForType, DemoIllustration, Icon } from './illustration';
import { useStore } from '../state/store';
import { useState } from 'react';
import { gridGeometry, productColumns } from '../domain/layout';
export function ProductArt({ product, large = false, priority=false, zoom=false, imageIndex=0 }: { product: Product; large?: boolean; priority?:boolean; zoom?:boolean; imageIndex?:number }) {
  const color = theme.colors[product.art as keyof typeof theme.colors] ?? theme.colors.pale;
  return <View style={{width:'100%',...(large?{height:zoom?360:250}:{aspectRatio:1.15,maxHeight:132}),backgroundColor:color,borderRadius:10,justifyContent:'center',alignItems:'center',overflow:'hidden'}}><View style={{position:'absolute',width:180,height:180,borderRadius:90,backgroundColor:'#FFFFFF55',top:-30,right:-80}}/><LocalDemoImage use={zoom?'zoom':large?'detail':'grid'} priority={priority||large} path={product.media?.[imageIndex]?.path} label={product.media?.[imageIndex]?.alt||`${product.title}: local demo image`} style={{width:'100%',height:'100%'}} fallback={<DemoIllustration kind={artForType(product.productType)} size={large?185:112} label={`${product.title}: illustrative demo artwork`}/>}/><Text style={[styles.text,{position:'absolute',bottom:5,fontSize:9,lineHeight:12,color:theme.colors.plum,letterSpacing:.7}]}>DEMO DESIGN</Text></View>;
}
export function ProductCard({ product, priority=false }: { product: Product; priority?:boolean }) { const { skus, bundleTemplates } = useCatalogue();
  const {width:windowWidth}=useWindowDimensions();
  const store=useStore(),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[added,setAdded]=useState(false);
  const variants=skus.filter(s=>s.productId===product.id),sku=variants[0],available=variants.some(s=>s.inventory.available>0),saved=store.profile.wishlist.includes(product.id);
  const quick=variants.length===1&&!product.personalizationSchemaId&&!product.prebuiltBundle&&product.purchaseMode==='buy';
  const price=product.prebuiltBundle?previewProductPrice(product,skus,bundleTemplates):variants.length?Math.min(...variants.map(s=>s.price.amount)):undefined;
  async function add(){if(!sku)return;setBusy(true);try{await store.add({skuId:sku.id,quantity:1,personalization:{},media:[],giftMessage:'',previewUnitPrice:sku.price});setAdded(true);setNotice('');}catch(e){setNotice((e as Error).message);}finally{setBusy(false);}}
  const inquiry=product.purchaseMode==='inquiry';
  const soldOut=!inquiry&&!product.prebuiltBundle&&variants.length>0&&!available;
  const action=busy?'Adding…':quick?(soldOut?'Sold out':added?'Add again':'Add to cart'):inquiry?'Request quote':soldOut?'Sold out':'Choose & add';
  const disabled=busy||soldOut;
  return <View testID={`product-card-${product.id}`} style={{flex:1,padding:7,borderRadius:12,borderWidth:1,borderColor:theme.colors.border,backgroundColor:'white',gap:4}}>
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${product.title}`} onPressIn={()=>prefetchProductImages(product.media?.slice(0,1).map(m=>m.path)??[],Math.max(0,Math.min(windowWidth,960)-24))} onPress={()=>router.push(`/product/${product.id}`)} style={{gap:3}}>
      <ProductArt product={product} priority={priority}/>
      <Text numberOfLines={2} style={[styles.text,{fontSize:12.5,lineHeight:16,color:theme.colors.text}]}>{product.title}</Text>
      <Text numberOfLines={1} style={[styles.text,{fontSize:price===undefined?12:17,lineHeight:21,color:theme.colors.plum,fontWeight:'700'}]}>{price===undefined?'Price on request':`${variants.length>1?'From ':''}${money(price)}`}</Text>
      <Text numberOfLines={1} style={[styles.text,{fontSize:10,lineHeight:13,color:soldOut?theme.colors.danger:theme.colors.muted}]}>{product.prebuiltBundle?'Demo set':inquiry?'Inquiry only':soldOut?'Demo · sold out':`${variants.length>1?variants.length+' choices · ':''}Demo stock`}</Text>
    </Pressable>
    <View style={{position:'absolute',top:5,right:5}}><IconButton label={`${saved?'Remove':'Save'} ${product.title} ${saved?'from':'to'} wishlist`} icon="heart" selected={saved} onPress={()=>{void store.toggleWish(product.id).catch(e=>setNotice(e.message));}}/></View>
    <Pressable accessibilityRole="button" accessibilityLabel={quick?added?`${product.title} added; add another`:`Add ${product.title} to demo cart`:inquiry?`Request quote for ${product.title}`:`Choose options for ${product.title}`} accessibilityState={{disabled}} disabled={disabled} onPress={()=>quick?void add():router.push(inquiry?`/furniture/inquiry?productId=${product.id}`:`/product/${product.id}`)} style={({pressed})=>({minHeight:44,marginTop:'auto',paddingHorizontal:10,borderRadius:9,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:quick&&!soldOut?theme.colors.primary:theme.colors.pale,borderWidth:1,borderColor:quick&&!soldOut?theme.colors.primary:theme.colors.lavender,opacity:(pressed||disabled)?0.68:1})}>
      <Text numberOfLines={1} style={[styles.text,{fontSize:12,fontWeight:'700',lineHeight:16,color:quick&&!soldOut?'white':theme.colors.primary}]}>{action}</Text><Icon name={quick?'plus':'right'} color={quick&&!soldOut?'white':theme.colors.primary} size={15}/>
    </Pressable>
    {!!notice&&<Text accessibilityLiveRegion="polite" style={[styles.text,{fontSize:11,lineHeight:14,color:theme.colors.primary}]}>{notice}</Text>}
  </View>;
}
export function ProductGrid({ products }: { products: Product[] }) {
  const { width, fontScale } = useWindowDimensions();
  const [measured, setMeasured] = useState<number>();
  const available = measured ?? Math.max(0, Math.min(width, 960) - 24);
  const grid = gridGeometry(available, productColumns(available, fontScale));
  return <View onLayout={event => { const next = event.nativeEvent.layout.width; setMeasured(old => old !== undefined && Math.abs(old - next) < 0.5 ? old : next); }} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: grid.gap,alignItems:'stretch' }}>{products.map(p => <View key={p.id} style={{ width: grid.itemWidth }}><ProductCard product={p} priority={products.indexOf(p)<grid.columns} /></View>)}</View>;
}
export function ProductSpecs({ product }: { product: Product }) { return <View style={{ gap: 4 }}>{Object.entries(product.specs).map(([k, v]) => <Label key={k}>{k}: {v}</Label>)}</View>; }
