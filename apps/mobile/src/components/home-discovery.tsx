import React, {useContext, useEffect, useRef, useState} from 'react';
import {Animated, Easing, Image, Pressable, ScrollView, Text, TextInput, View, type LayoutChangeEvent} from 'react-native';
import {router, type Href} from 'expo-router';
import type {DepartmentId} from '../domain/departments';
import type {PageLayout, Product, Section} from '../domain/contracts';
import {useCatalogue} from '../state/catalogue';
import {useStore} from '../state/store';
import {MotionContext} from '../state/motion-context';
import {LocalDemoImage} from './local-demo-image';
import {previewProductPrice} from '../domain/product-price';
import {money} from '../domain/money';
import {responsiveHeroPath, ownerHeroImages} from '../../../../packages/catalogue/src/hero-images';
import {DepartmentPhoto, GiftArt, GiftIcon, GiftFloat, GiftHeading, GiftRise, GiftTile, bodyFont, displayFont, giftHeroBackgrounds, palette, type GiftArtName} from './aarvika-mobile';

function go(path:string){router.push(path as Href);}
const occasionIcons:{id:DepartmentId;name:string;art:GiftArtName}[]=[
  {id:'wedding',name:'Wedding',art:'rings'},{id:'birthday',name:'Birthday',art:'cake'},
  {id:'anniversary',name:'Anniversary',art:'heartA'},{id:'personalized',name:'Custom',art:'pen'},
  {id:'hampers',name:'Hampers',art:'hamper'},
];
const cards:{id:DepartmentId;name:string;art:GiftArtName;bg:string}[]=[
  {id:'wedding',name:'Wedding gifts',art:'hamper',bg:palette.peach},
  {id:'birthday',name:'Birthday gifts',art:'cake',bg:palette.soft},
  {id:'anniversary',name:'Anniversary',art:'heartA',bg:palette.rose},
  {id:'personalized',name:'Personalised',art:'frame',bg:palette.mint},
];
const giftStyles = ['All','Personalised','Hampers','Clothing','Stationery','Home'];
const slides:[string,string,string,GiftArtName,string][]=[
  ['THE ART OF THOUGHTFUL GIVING','Little things. Lasting memories.','Find a gift that feels like them.','gift','Explore'],
  ['MADE JUST FOR THEM','Add their name. Make it theirs.','Names, photos and tiny details.','frame','Personalise'],
  ['FOR WORK, SCHOOL & DESK','Make room for bright ideas.','Notebooks, pens and creative kits.','notebook','Shop'],
];
function MobileHero({first}:{first?:Section}) {
  const reduced=useContext(MotionContext),[cur,setCur]=useState(0),[width,setWidth]=useState(350);
  const [x]=useState(()=>new Animated.Value(0)),touch=useRef<number|null>(null),[progress]=useState(()=>new Animated.Value(0));
  useEffect(()=>{if(reduced){x.setValue(-cur*width);return;}
    const anim=Animated.timing(x,{toValue:-cur*width,duration:700,easing:Easing.bezier(.65,0,.2,1),useNativeDriver:true});anim.start();
    return()=>anim.stop();},[cur,width,reduced,x]);
  useEffect(()=>{if(reduced)return;progress.setValue(0);const a=Animated.timing(progress,{toValue:1,duration:4200,easing:Easing.linear,useNativeDriver:false});a.start();const timer=setTimeout(()=>setCur(v=>(v+1)%3),4200);return()=>{clearTimeout(timer);a.stop();};},[cur,reduced,progress]);
  const targets=[first?.action||'/categories','/department/personalized','/department/stationery'];
  return <View testID="home-editorial-hero" onLayout={(event:LayoutChangeEvent)=>{const next=event.nativeEvent.layout.width;if(next>0&&Math.abs(next-width)>1)setWidth(next);}} onTouchStart={event=>{touch.current=event.nativeEvent.pageX;}} onTouchEnd={event=>{if(touch.current!==null){const dx=event.nativeEvent.pageX-touch.current;if(Math.abs(dx)>40)setCur(v=>(v+(dx<0?1:2))%3);touch.current=null;}}} style={{height:210,borderRadius:24,overflow:'hidden',backgroundColor:palette.brand,shadowColor:palette.brand,shadowOffset:{width:0,height:10},shadowOpacity:.24,shadowRadius:20,elevation:5}}>
    <Animated.View style={{flexDirection:'row',width:width*3,height:210,transform:[{translateX:x}]}}>{slides.map((s,i)=>
      <View key={i} style={{width,height:210,overflow:'hidden'}}>
        <Image source={giftHeroBackgrounds[i]} resizeMode="stretch" style={{width:'100%',height:'100%',position:'absolute'}}/>
        <LocalDemoImage path={i===0?((first?responsiveHeroPath(first,width):undefined)||ownerHeroImages.home?.mobile):i===1?ownerHeroImages.personalized?.mobile:ownerHeroImages.stationery?.mobile} label={i===0?(first?.imageAlt||ownerHeroImages.home?.alt||'AARVIKA gifts'):i===1?(ownerHeroImages.personalized?.alt||'Personalised gifts'):(ownerHeroImages.stationery?.alt||'Stationery gifts')} fit="cover" use="hero" priority={i===0} style={{width:'100%',height:'100%',position:'absolute'}}/>
        <View pointerEvents="none" style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#2F0F5555'}}/>
        <View pointerEvents="none" style={{position:'absolute',left:0,right:0,bottom:0,height:128,backgroundColor:'#2F0F5577'}}/>
        <View style={{flex:1,padding:20,justifyContent:'flex-end',paddingBottom:28,gap:6}}>
          <Text style={{fontFamily:bodyFont,fontSize:10,color:'white',letterSpacing:1.6,fontWeight:'800',opacity:.85}}>{s[0]}</Text>
          <Text accessibilityRole="header" style={{fontFamily:displayFont,fontSize:25,lineHeight:28,fontWeight:'700',color:'white',maxWidth:240}}>{i===0&&first?.title?first.title:s[1]}</Text>
          <Text style={{fontFamily:bodyFont,fontSize:12,color:'white',opacity:.88,maxWidth:225}}>{i===0&&first?.subtitle?first.subtitle:s[2]}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={s[4]+' gifts'} onPress={()=>go(targets[i])} style={({pressed})=>({alignSelf:'flex-start',marginTop:8,backgroundColor:'white',paddingVertical:9,paddingHorizontal:16,borderRadius:24,flexDirection:'row',alignItems:'center',gap:6,transform:[{scale:pressed?.94:1}]})}><Text style={{fontSize:12,fontWeight:'800',color:'#3B1266',fontFamily:bodyFont}}>{s[4]}</Text><GiftIcon name="arrow" size={14} color="#3B1266"/></Pressable>
        </View>
      </View>)}</Animated.View>
    <View style={{position:'absolute',left:20,bottom:12,flexDirection:'row',gap:6}}>{slides.map((_,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={`Show gift banner ${i+1}`} onPress={()=>setCur(i)} style={{height:8,width:i===cur?26:7,borderRadius:5,backgroundColor:'#FFFFFF66',overflow:'hidden'}}>{i===cur&&<Animated.View style={{height:8,backgroundColor:'white',width:26,transform:[{translateX:progress.interpolate({inputRange:[0,1],outputRange:[-26,0]})}]}}/>}</Pressable>)}</View>
  </View>;
}
function MovingOfferStrip(){
  const reduced=useContext(MotionContext),[scroll]=useState(()=>new Animated.Value(0)),[groupWidth,setGroupWidth]=useState(900);
  const labels=['THOUGHTFUL GIFT IDEAS','CELEBRATE EVERY OCCASION','PERSONALISED COLLECTIONS','EXPLORE AARVIKA'];
  useEffect(()=>{if(reduced){scroll.setValue(0);return;}scroll.setValue(0);const a=Animated.loop(Animated.timing(scroll,{toValue:1,duration:22000,easing:Easing.linear,useNativeDriver:true}));a.start();return()=>a.stop();},[reduced,scroll]);
  const content=(key:number)=><View key={key} onLayout={key===0?e=>{const next=e.nativeEvent.layout.width;if(Math.abs(next-groupWidth)>2)setGroupWidth(next);}:undefined} style={{flexDirection:'row',alignItems:'center'}}>{labels.map(s=><View key={s} style={{paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:18}}><Text style={{fontSize:12,color:palette.gold}}>✦</Text><Text numberOfLines={1} style={{fontSize:11,color:'white',fontWeight:'800',letterSpacing:.8,fontFamily:bodyFont}}>{s}</Text></View>)}</View>;
  return <View style={{marginHorizontal:-16,marginTop:18,height:38,backgroundColor:palette.brand,overflow:'hidden',transform:[{rotate:'-1.2deg'}]}}><Animated.View style={{height:38,flexDirection:'row',alignItems:'center',transform:[{translateX:scroll.interpolate({inputRange:[0,1],outputRange:[0,-groupWidth]})}]}}>{content(0)}{content(1)}</Animated.View></View>;
}
function productIllustration(p:Product):GiftArtName{
  const t=(p.title+' '+p.productType).toLowerCase();
  if(t.includes('mug')||t.includes('cup')||t.includes('drink'))return 'mug';
  if(t.includes('frame')||t.includes('photo'))return 'frame';
  if(t.includes('hamper')||t.includes('box')||t.includes('basket'))return 'hamper';
  if(t.includes('tee')||t.includes('shirt')||t.includes('cloth'))return 'tee';
  if(t.includes('notebook')||t.includes('journal')||t.includes('diary'))return 'notebook';
  if(t.includes('candle')||t.includes('lamp'))return 'candle';
  if(t.includes('chair')||t.includes('furniture'))return 'chair';
  if(t.includes('pen'))return 'pen';
  return 'gift';
}
function ProductPreview({product,index}:{product:Product;index:number}){
  const data=useCatalogue(),store=useStore(),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const saved=store.profile.wishlist.includes(product.id);
  const variants=data.skus.filter(s=>s.productId===product.id),sku=variants[0];
  const available=variants.some(s=>s.inventory.available>0),quick=variants.length===1&&!product.personalizationSchemaId&&!product.prebuiltBundle&&product.purchaseMode==='buy'&&available;
  const price=product.prebuiltBundle?previewProductPrice(product,data.skus,data.bundleTemplates):variants.length?Math.min(...variants.map(s=>s.price.amount)):undefined;
  const kind=productIllustration(product),bg=[palette.soft,palette.peach,palette.sun,palette.mint,palette.rose][index%5];
  async function add(){if(!sku||busy)return;setBusy(true);setError('');try{await store.add({skuId:sku.id,quantity:1,personalization:{},media:[],giftMessage:'',previewUnitPrice:sku.price});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <View testID={`gift-style-product-${product.id}`} style={{width:160,borderWidth:1,borderColor:palette.line,borderRadius:20,backgroundColor:'white',overflow:'hidden'}}>
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${product.title}`} onPress={()=>go(`/product/${product.id}`)} style={{height:132,backgroundColor:bg,justifyContent:'center',alignItems:'center'}}>
      {product.media?.[0]?.path ? <LocalDemoImage path={product.media[0].path} label={product.title} style={{width:'100%',height:'100%'}} use="grid" fallback={<GiftArt kind={kind} size={88}/>}/> : <GiftFloat duration={5000}><GiftArt kind={kind} size={88}/></GiftFloat>}
    </Pressable>
    <View style={{position:'absolute',top:8,left:8,backgroundColor:palette.gold,borderRadius:8,paddingHorizontal:7,paddingVertical:4}}><Text style={{fontSize:9,fontWeight:'800',color:'#2B1700'}}>{product.personalizationSchemaId?'PERSONALISE':product.prebuiltBundle?'GIFT SET':'GIFT IDEA'}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={`${saved?'Remove':'Add'} ${product.title} ${saved?'from':'to'} wishlist`} onPress={()=>{void store.toggleWish(product.id).catch(e=>setError(e.message));}} style={{position:'absolute',top:8,right:8,width:32,height:32,borderRadius:16,backgroundColor:'white',alignItems:'center',justifyContent:'center',elevation:3,shadowColor:'#000',shadowOpacity:.12,shadowOffset:{width:0,height:3},shadowRadius:5}}><GiftIcon name="heart" size={16} color={saved?'#E0245E':palette.muted}/></Pressable>
    <Pressable accessibilityRole="button" onPress={()=>go(`/product/${product.id}`)} style={{paddingHorizontal:12,paddingTop:10,paddingBottom:3,minHeight:53}}><Text numberOfLines={2} style={{fontSize:13,color:palette.ink,fontFamily:bodyFont,fontWeight:'700',lineHeight:17}}>{product.title}</Text></Pressable>
    <View style={{paddingHorizontal:12,paddingBottom:12,paddingTop:4,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:2}}><Text numberOfLines={1} style={{fontSize:price===undefined?11:14,fontFamily:bodyFont,fontWeight:'800',color:palette.ink,flex:1}}>{price===undefined?'Price on request':money(price)}</Text>
      <Pressable disabled={busy||(!available&&!product.prebuiltBundle&&product.purchaseMode!=='inquiry')} accessibilityRole="button" accessibilityLabel={quick?`Add ${product.title} to cart`:`Choose ${product.title}`} onPress={()=>quick?void add():go(product.purchaseMode==='inquiry'?`/furniture/inquiry?productId=${product.id}`:`/product/${product.id}`)} style={({pressed})=>({width:32,height:32,borderRadius:10,backgroundColor:palette.brand,justifyContent:'center',alignItems:'center',opacity:busy||pressed?.6:1})}><GiftIcon name="plus" size={16} color="white"/></Pressable>
    </View>{!!error&&<Text accessibilityLiveRegion="polite" style={{paddingHorizontal:8,paddingBottom:8,color:'#A52642',fontSize:10}}>{error}</Text>}
  </View>;
}
function PersonalisedBanner(){
  const [name,setName]=useState('');const reduced=useContext(MotionContext),[swing]=useState(()=>new Animated.Value(0));
  useEffect(()=>{if(reduced){swing.setValue(0);return;}const a=Animated.loop(Animated.sequence([Animated.timing(swing,{toValue:1,duration:2000,useNativeDriver:true}),Animated.timing(swing,{toValue:0,duration:2000,useNativeDriver:true})]));a.start();return()=>a.stop();},[reduced,swing]);
  return <View style={{marginTop:8,backgroundColor:palette.brand,borderRadius:24,padding:20,overflow:'hidden',minHeight:215,shadowColor:palette.brand,shadowOpacity:.25,shadowOffset:{width:0,height:10},shadowRadius:16,elevation:4}}>
    <Text style={{color:palette.gold,fontSize:10,fontWeight:'800',letterSpacing:1.5,fontFamily:bodyFont}}>MAKE IT PERSONAL</Text>
    <Text style={{fontSize:22,fontFamily:displayFont,fontWeight:'700',color:'white',lineHeight:26,maxWidth:'58%',marginTop:6}}>Made just for them</Text>
    <Text style={{fontSize:12,color:'#FFFFFFDD',maxWidth:'60%',marginTop:5,lineHeight:17,fontFamily:bodyFont}}>Type a name and see it on a gift tag.</Text>
    <Animated.View style={{position:'absolute',right:16,top:22,width:120,backgroundColor:'white',borderRadius:14,padding:12,shadowColor:'#000',shadowOffset:{width:0,height:14},shadowOpacity:.3,shadowRadius:12,elevation:6,transform:[{rotate:swing.interpolate({inputRange:[0,1],outputRange:['6deg','-4deg']})}]}}>
      <View style={{position:'absolute',top:-7,left:'49%',width:12,height:12,borderRadius:6,backgroundColor:palette.gold}}/>
      <Text style={{fontSize:9,fontWeight:'800',letterSpacing:1.2,color:palette.brand2}}>FOR</Text><Text numberOfLines={1} style={{fontFamily:displayFont,fontSize:20,fontWeight:'700',color:'#2F0F55',marginTop:2}}>{name.trim()||'Aarav'}</Text><Text style={{fontSize:10,color:palette.muted,marginTop:3}}>with love</Text>
    </Animated.View>
    <View style={{flexDirection:'row',alignItems:'center',gap:7,marginTop:14}}><TextInput accessibilityLabel="Their name" placeholder="Their name" placeholderTextColor="#FFFFFFBB" maxLength={12} value={name} onChangeText={setName} style={{height:38,flex:1,minWidth:0,paddingHorizontal:12,borderRadius:12,backgroundColor:'#FFFFFF29',color:'white',fontSize:13,fontFamily:bodyFont}}/><Pressable accessibilityRole="button" accessibilityLabel="Discover personalised gifts" onPress={()=>go('/department/personalized')} style={({pressed})=>({backgroundColor:'white',borderRadius:22,paddingVertical:10,paddingHorizontal:13,opacity:pressed?.7:1})}><Text style={{color:palette.brand,fontWeight:'800',fontSize:12}}>Discover</Text></Pressable></View>
  </View>;
}
export function HomeDiscovery({layout}:{layout:PageLayout}){
  const {products,meta}=useCatalogue(),[selectedOccasion,setSelectedOccasion]=useState('wedding'),[style,setStyle]=useState('All');
  const enabled=layout.sections.filter(s=>s.enabled).slice().sort((a,b)=>a.order-b.order);
  const hero=enabled.find(s=>s.type==='hero');
  const productSections=enabled.filter(s=>s.type==='products');
  const configured=productSections.flatMap(section=>section.productIds?.length?section.productIds.map(id=>products.find(p=>p.id===id)).filter((p):p is Product=>!!p):products.filter(p=>section.dataSourceRef.startsWith('@')||p.collectionIds.includes(section.dataSourceRef)));
  const unique=Array.from(new Map((configured.length?configured:products).map(p=>[p.id,p])).values());
  const matching=unique.filter(p=>style==='All'||(style==='Personalised'?p.departmentIds.includes('personalized'):style==='Home'?p.departmentIds.includes('furniture'):p.departmentIds.includes(style.toLowerCase() as 'hampers'|'clothing'|'stationery')));
  const extra=enabled.filter(section=>section.type==='combo'||section.type==='departments'||section.type==='products'&&section.action&&section.action!=='/search');
  const destination=(id:string)=>`/department/${id}`;
  // Existing published layout flags still determine which major content families are visible.
  const showHero=meta.demo||enabled.some(s=>s.type==='hero');
  const showOccasions=meta.demo||enabled.some(s=>s.type==='collection'&&['wedding','birthday','anniversary'].includes(s.dataSourceRef));
  const showProducts=meta.demo||productSections.length>0;
  const showPersonal=meta.demo||enabled.some(s=>s.type==='collection'&&s.dataSourceRef==='personalized');
  return <View testID="home-discovery" style={{gap:0,paddingBottom:8}}>
    {showHero&&<GiftRise index={0}><MobileHero first={hero}/></GiftRise>}
    {showOccasions&&<><GiftRise index={2}><GiftHeading title="Gifts for every occasion"/></GiftRise>
    <GiftRise index={3}><ScrollView accessibilityLabel="Gifts for every occasion" horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal:-16}} contentContainerStyle={{paddingHorizontal:16,gap:14,paddingTop:4,paddingBottom:8}}>{occasionIcons.map(o=>{const active=selectedOccasion===o.id;return <Pressable key={o.id} accessibilityRole="button" accessibilityLabel={`Shop ${o.name}`} accessibilityState={{selected:active}} onPress={()=>{setSelectedOccasion(o.id);go(destination(o.id));}} style={{width:68,alignItems:'center',gap:5}}><View style={{width:64,height:64,borderRadius:32,backgroundColor:active?palette.brand:palette.soft,borderWidth:2,borderColor:active?palette.brand2:'transparent',alignItems:'center',justifyContent:'center',overflow:'hidden',transform:[{scale:active?1.06:1}]}}><DepartmentPhoto id={o.id} style={{width:'100%',height:'100%'}}/></View><Text style={{fontSize:11,fontFamily:bodyFont,fontWeight:'700',color:palette.ink}}>{o.name}</Text></Pressable>})}</ScrollView></GiftRise>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:12}}>{cards.map((c,i)=><GiftRise key={c.id} index={4+i} style={{width:'48.2%',flexGrow:1}}><GiftTile departmentId={c.id} label={c.name} art={c.art} bg={c.bg} onPress={()=>go(destination(c.id))}/></GiftRise>)}</View>
    </>}
    <MovingOfferStrip/>
    {showProducts&&<><GiftHeading title="Shop by gift style" action="See all" onPress={()=>router.navigate('/categories')}/>
    <ScrollView horizontal accessibilityLabel="Shop by gift style" showsHorizontalScrollIndicator={false} style={{marginHorizontal:-16}} contentContainerStyle={{paddingHorizontal:16,paddingTop:2,paddingBottom:7,gap:8}}>{giftStyles.map(s=><Pressable key={s} accessibilityRole="button" accessibilityState={{selected:s===style}} onPress={()=>setStyle(s)} style={({pressed})=>({borderRadius:24,borderWidth:1,borderColor:style===s?palette.brand:palette.line,backgroundColor:style===s?palette.brand:'white',paddingHorizontal:14,paddingVertical:9,minHeight:39,justifyContent:'center',opacity:pressed?.7:1})}><Text style={{fontSize:12,fontFamily:bodyFont,fontWeight:'700',color:style===s?'white':palette.ink}}>{s}</Text></Pressable>)}</ScrollView>
    <ScrollView testID="home-gift-style-products" accessibilityLabel="Gift style products" horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal:-16}} contentContainerStyle={{paddingHorizontal:16,gap:12,paddingTop:6,paddingBottom:14}}>{matching.length?matching.slice(0,12).map((p,i)=><GiftRise key={p.id} index={i}><ProductPreview product={p} index={i}/></GiftRise>):<Pressable onPress={()=>router.navigate('/categories')} style={{padding:20,borderRadius:20,backgroundColor:'white',borderWidth:1,borderColor:palette.line}}><Text style={{color:palette.muted}}>More designs to discover soon. Explore categories →</Text></Pressable>}</ScrollView>
    </>}
    {showPersonal&&<PersonalisedBanner/>}
    {extra.map(section=><View key={section.id} style={{marginTop:9}}><GiftHeading title={section.title} action="Explore" onPress={()=>go(section.action)}/><Pressable accessibilityRole="button" accessibilityLabel={`Explore ${section.title}`} onPress={()=>go(section.action)} style={{backgroundColor:palette.soft,borderRadius:18,padding:16,flexDirection:'row',alignItems:'center',gap:12}}><GiftArt kind={section.type==='combo'?'hamper':'gift'} size={55}/><Text style={{color:palette.brand,fontWeight:'700',flex:1}}>{section.subtitle||'Discover thoughtful gifts and special details'}</Text><GiftIcon name="arrow" color={palette.brand}/></Pressable></View>)}
  </View>;
}
