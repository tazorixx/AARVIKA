/** Artwork and small motion primitives faithfully translated from the supplied AARVIKA HTML.
 * Native images are self-contained PNGs from the provided SVG paths; no new runtime packages.
 */
import React, {useContext, useEffect, useState} from 'react';
import {Animated, Image, Platform, Pressable, Text, View, type ImageStyle, type StyleProp, type ViewStyle} from 'react-native';
import {MotionContext} from '../state/motion-context';
import {useCatalogue} from '../state/catalogue';
import {LocalDemoImage} from './local-demo-image';
import {ownerHeroImages, responsiveHeroPath} from '../../../../packages/catalogue/src/hero-images';
import type {DepartmentId} from '../domain/departments';

export const palette = {
  ink:'#1E1030', muted:'#6C5F80', line:'#E7DCF4', brand:'#4A1D7A', brand2:'#7B3FC4',
  soft:'#EBDDFB', peach:'#FFE3D4', mint:'#DDF3E8', sun:'#FFE9B8', rose:'#FFD9E6', gold:'#F5B94A', white:'#FFFFFF',
} as const;
export const displayFont = Platform.OS === 'web' ? 'Fraunces, Georgia, serif' : 'Georgia';
export const bodyFont = Platform.OS === 'web' ? 'Manrope, system-ui, sans-serif' : undefined;

const artwork = {
  gift:require('./aarvika-assets/art-gift.png'),mug:require('./aarvika-assets/art-mug.png'),
  frame:require('./aarvika-assets/art-frame.png'),tee:require('./aarvika-assets/art-tee.png'),
  notebook:require('./aarvika-assets/art-notebook.png'),candle:require('./aarvika-assets/art-candle.png'),
  hamper:require('./aarvika-assets/art-hamper.png'),chair:require('./aarvika-assets/art-chair.png'),
  rings:require('./aarvika-assets/art-rings.png'),cake:require('./aarvika-assets/art-cake.png'),
  heartA:require('./aarvika-assets/art-heartA.png'),pen:require('./aarvika-assets/art-pen.png'),
};
const icons = {
  gift:require('./aarvika-assets/icon-gift.png'),bag:require('./aarvika-assets/icon-bag.png'),
  search:require('./aarvika-assets/icon-search.png'),cam:require('./aarvika-assets/icon-cam.png'),
  arrow:require('./aarvika-assets/icon-arrow.png'),home:require('./aarvika-assets/icon-home.png'),
  grid:require('./aarvika-assets/icon-grid.png'),tag:require('./aarvika-assets/icon-tag.png'),
  heart:require('./aarvika-assets/icon-heart.png'),user:require('./aarvika-assets/icon-user.png'),
  cal:require('./aarvika-assets/icon-cal.png'),help:require('./aarvika-assets/icon-help.png'),
  pin:require('./aarvika-assets/icon-pin.png'),plus:require('./aarvika-assets/icon-plus.png'),
};
export type GiftArtName = keyof typeof artwork;
export type GiftIconName = keyof typeof icons;
export const giftHeroBackgrounds = [require('./aarvika-assets/hero-1.png'),require('./aarvika-assets/hero-2.png'),require('./aarvika-assets/hero-3.png')];
export function GiftArt({kind,size=72,style}:{kind:GiftArtName;size?:number;style?:StyleProp<ImageStyle>}) {
  return <Image source={artwork[kind]} accessible={false} resizeMode="contain" style={[{width:size,height:size},style]}/>;
}
export function GiftIcon({name,size=22,color=palette.ink}:{name:GiftIconName;size?:number;color?:string}) {
  return <Image source={icons[name]} accessible={false} resizeMode="contain" style={{width:size,height:size,tintColor:color}}/>;
}
export function GiftHeading({title,action,onPress}:{title:string;action?:string;onPress?:()=>void}){
  return <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:22,marginBottom:10,gap:8}}>
    <Text accessibilityRole="header" style={{fontFamily:displayFont,fontWeight:'700',fontSize:19,color:palette.ink,flex:1}}>{title}</Text>
    {action&&<Pressable accessibilityRole="button" onPress={onPress} style={{minHeight:38,justifyContent:'center',paddingHorizontal:4}}><Text style={{fontSize:12,fontWeight:'700',color:palette.brand2,fontFamily:bodyFont}}>{action}</Text></Pressable>}
  </View>;
}
export function GiftRise({index=0,children,style}:{index?:number;children:React.ReactNode;style?:StyleProp<ViewStyle>}) {
  const reduced=useContext(MotionContext),[v]=useState(()=>new Animated.Value(reduced?1:0));
  useEffect(()=>{if(reduced){v.setValue(1);return;}v.setValue(0);const a=Animated.timing(v,{toValue:1,duration:600,delay:index*70,useNativeDriver:true});a.start();return()=>a.stop();},[v,reduced,index]);
  return <Animated.View style={[style,{opacity:v,transform:[{translateY:v.interpolate({inputRange:[0,1],outputRange:[22,0]})},{scale:v.interpolate({inputRange:[0,1],outputRange:[.97,1]})}]}]}>{children}</Animated.View>;
}
export function GiftFloat({children,duration=4000,translate=8,style}:{children:React.ReactNode;duration?:number;translate?:number;style?:StyleProp<ViewStyle>}){
  const reduced=useContext(MotionContext),[v]=useState(()=>new Animated.Value(0));
  useEffect(()=>{if(reduced){v.setValue(0);return;}const anim=Animated.loop(Animated.sequence([Animated.timing(v,{toValue:1,duration:duration/2,useNativeDriver:true}),Animated.timing(v,{toValue:0,duration:duration/2,useNativeDriver:true})]));anim.start();return()=>anim.stop();},[reduced,v,duration]);
  return <Animated.View style={[style,{transform:[{translateY:v.interpolate({inputRange:[0,1],outputRange:[0,-translate]})}]}]}>{children}</Animated.View>;
}
function GiftShine(){
  const reduced=useContext(MotionContext),[v]=useState(()=>new Animated.Value(0));
  useEffect(()=>{if(reduced)return;const a=Animated.loop(Animated.sequence([Animated.timing(v,{toValue:1,duration:1600,delay:2700,useNativeDriver:true}),Animated.delay(700)]));a.start();return()=>a.stop();},[reduced,v]);
  if(reduced)return null;
  return <Animated.View pointerEvents="none" style={{position:'absolute',top:-45,width:32,height:190,backgroundColor:'#FFFFFF40',transform:[{rotate:'22deg'},{translateX:v.interpolate({inputRange:[0,1],outputRange:[-160,270]})}]}}/>;
}
export function DepartmentPhoto({id,style}:{id:DepartmentId|'home';style:StyleProp<ImageStyle>}){
  const {commercePages}=useCatalogue();
  const department=id==='home'?'furniture':id;
  // Reuse the owner's department imagery, not the earlier bulk-sourced thumbnails.
  // Explicitly published department hero edits remain the admin's source of truth.
  const visual=commercePages?.find(page=>page.key==='department:'+department)?.sections.find(section=>section.enabled&&section.type==='hero');
  const supplied=ownerHeroImages[department] ?? ownerHeroImages.home;
  const path=visual ? responsiveHeroPath(visual,390) : undefined;
  const selected=path?.startsWith('https://') ? path : supplied?.mobile;
  return <LocalDemoImage path={selected} label={visual?.imageAlt||supplied?.alt||'AARVIKA gifts'} fit="cover" use="grid" style={style} fallback={supplied?.mobile && selected!==supplied.mobile
    ? <LocalDemoImage path={supplied.mobile} label={supplied.alt} fit="cover" use="grid" style={style}/>
    : <View style={[style,{backgroundColor:palette.soft,alignItems:'center',justifyContent:'center'}]}><GiftArt kind="gift" size={44}/></View>}/>;
}
export function GiftTile({label,art,bg,onPress,small=false,departmentId}:{label:string;art:GiftArtName;bg:string;onPress:()=>void;small?:boolean;departmentId?:DepartmentId|'home'}){
  return <Pressable accessibilityRole="button" accessibilityLabel={`Explore ${label}`} onPress={onPress} style={({pressed})=>({flex:1,borderRadius:small?13:20,overflow:'hidden',borderWidth:1,borderColor:palette.line,backgroundColor:'white',opacity:pressed?.75:1,transform:[{scale:pressed?.97:1}]})}>
    <View style={{aspectRatio:small?1:4/3,backgroundColor:bg,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{departmentId?<DepartmentPhoto id={departmentId} style={{width:'100%',height:'100%'}}/>:<><GiftFloat duration={4000}><GiftArt kind={art} size={small?62:76}/></GiftFloat><GiftShine/></>}</View>
    <View style={{paddingHorizontal:small?5:12,paddingVertical:small?7:10,gap:2}}><Text numberOfLines={2} style={{fontFamily:bodyFont,fontWeight:'700',fontSize:small?11:13,color:palette.ink,textAlign:small?'center':'left'}}>{label}</Text>{!small&&<Text style={{fontFamily:bodyFont,fontSize:11,fontWeight:'700',color:palette.brand2}}>Explore gifts →</Text>}</View>
  </Pressable>;
}
