import {notifyImageViewport} from './local-demo-image';
import React, { useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '../theme';
import { CartCountContext, DeliverySummaryContext } from '../state/header-context';
import { Icon, type IconName } from './illustration';
import { DepartmentSideRail } from './department-side-rail';
import type { DepartmentId } from '../domain/departments';

import {MotionContext} from '../state/motion-context';
export {MotionContext} from '../state/motion-context';
export function useReducedMotion() {
  const [reduced,setReduced]=useState(true);
  useEffect(()=>{AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(()=>setReduced(true));const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>sub.remove();},[]);
  return reduced;
}
export function Label({children,muted=false,heading=false}:{children:React.ReactNode;muted?:boolean;heading?:boolean}){return <Text accessibilityRole={heading?'header':undefined} style={[styles.text,muted&&styles.muted,heading&&styles.heading]}>{children}</Text>;}
export function Button({title,onPress,disabled=false,secondary=false,testID,expanded,selected,icon}:{title:string;onPress?:()=>void;disabled?:boolean;secondary?:boolean;testID?:string;expanded?:boolean;selected?:boolean;icon?:IconName}){
  const reduced=useContext(MotionContext),[opacity]=useState(()=>new Animated.Value(1));
  function feedback(value:number){opacity.stopAnimation();if(reduced)opacity.setValue(value);else Animated.timing(opacity,{toValue:value,duration:160,useNativeDriver:Platform.OS!=='web'}).start();}
  return <Animated.View style={{opacity,maxWidth:'100%'}}><Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{disabled,expanded,selected}} aria-expanded={expanded} {...(Platform.OS==='web'?{'aria-pressed':selected}:{})} disabled={disabled} onPress={onPress} onPressIn={()=>feedback(.76)} onPressOut={()=>feedback(1)} style={[styles.button,secondary&&styles.secondary,selected&&{backgroundColor:theme.colors.lavender,borderColor:theme.colors.primary},disabled&&{opacity:.45}]}>{icon&&<Icon name={icon} size={17} color={secondary||selected?theme.colors.primary:'white'}/>}<Text style={[styles.text,styles.buttonText,(secondary||selected)&&{color:theme.colors.primary}]}>{title}</Text></Pressable></Animated.View>;
}
export function IconButton({label,icon,onPress,selected,disabled=false}:{label:string;icon:IconName;onPress:()=>void;selected?:boolean;disabled?:boolean}){return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled,selected}} {...(Platform.OS==='web'?{'aria-pressed':selected}:{})} disabled={disabled} onPress={onPress} style={({pressed})=>[{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:selected?theme.colors.lavender:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border},pressed&&{opacity:.65},disabled&&{opacity:.4}]}><Icon name={icon} color={theme.colors.primary}/></Pressable>;}
export function Input({label,inputRef,style,onFocus,onBlur,...props}:TextInputProps&{label:string;inputRef?:React.Ref<React.ComponentRef<typeof TextInput>>}){
  const [focused,setFocused]=useState(false);
  return <View style={{gap:5}}><Text style={[styles.text,{fontSize:13,fontWeight:'500'}]}>{label}</Text><TextInput {...props} ref={inputRef} accessibilityLabel={label} selectionColor={theme.colors.primary} placeholderTextColor={theme.colors.muted} onFocus={e=>{setFocused(true);onFocus?.(e);}} onBlur={e=>{setFocused(false);onBlur?.(e);}} style={[styles.input,props.multiline&&{minHeight:88,textAlignVertical:'top'},focused&&{borderColor:theme.colors.primary,backgroundColor:'#FEFCFF'},style]}/></View>;
}
export function Card({children}:{children:React.ReactNode}){return <View style={styles.card}>{children}</View>;}
export function Notice({children}:{children:React.ReactNode}){return <View accessibilityLiveRegion="polite" style={{padding:10,backgroundColor:theme.colors.pale,borderRadius:10,borderLeftColor:theme.colors.primary,borderLeftWidth:3}}><Label>{children}</Label></View>;}
export function Sheet({title,visible,onClose,children,closeLabel}:{title:string;visible:boolean;onClose:()=>void;children:React.ReactNode;closeLabel?:string}){
  const reduced=useContext(MotionContext),insets=useSafeAreaInsets();
  useEffect(()=>{if(Platform.OS!=='web'||!visible)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose();}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[visible,onClose]);
  return <Modal visible={visible} transparent animationType={reduced?'none':'fade'} onRequestClose={onClose} accessibilityLabel={title}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':Platform.OS==='android'?'height':undefined} style={{flex:1,justifyContent:'flex-end',backgroundColor:'#23112E66'}}><Pressable accessible={false} onPress={onClose} style={StyleSheet.absoluteFill}/><View accessibilityViewIsModal style={{width:'100%',maxWidth:640,maxHeight:'88%',alignSelf:'center',backgroundColor:theme.colors.surface,borderTopLeftRadius:20,borderTopRightRadius:20,borderWidth:1,borderColor:theme.colors.border,paddingBottom:Math.max(insets.bottom,12)}}><View style={{width:34,height:4,borderRadius:2,backgroundColor:theme.colors.border,alignSelf:'center',marginTop:8}}/><View style={{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:16,paddingTop:4}}><View style={{flex:1}}><Label heading>{title}</Label></View><IconButton label={closeLabel??`Close ${title.toLowerCase()}`} icon="close" onPress={onClose}/></View><ScrollView keyboardShouldPersistTaps="handled" style={{flexGrow:0}} contentContainerStyle={{padding:16,gap:12}}>{children}</ScrollView></View></KeyboardAvoidingView></Modal>;
}
export function FilterDisclosure({title,children,summary,keepMounted=false}:{title:string;children:React.ReactNode;summary?:string;keepMounted?:boolean}){
  const [open,setOpen]=useState(false),[opened,setOpened]=useState(false);
  return <View style={{gap:6}}><Button title={title} secondary icon="filter" expanded={open} onPress={()=>{setOpened(true);setOpen(v=>!v);}}/>{!!summary&&<Label muted>{summary}</Label>}{(open||keepMounted&&opened)?<View style={!open?{display:'none'}:undefined}><Card>{children}</Card></View>:null}</View>;
}
export function CategoryRail({label,children}:{label:string;children:React.ReactNode}){
  if(!React.Children.count(children))return null;
  return <View style={{gap:4}}><Text style={[styles.text,{fontSize:12,color:theme.colors.muted}]}>{label} · scroll for more</Text><ScrollView horizontal accessibilityLabel={label} showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={{gap:8,paddingVertical:2,alignItems:'center'}}>{children}</ScrollView></View>;
}
type HeaderTools = 'none' | 'home' | 'categories';

function HeaderAction({label,hint,onPress,disabled,children}:{label:string;hint?:string;onPress:()=>void;disabled:boolean;children:React.ReactNode}){
  const reduced=useContext(MotionContext),[scale]=useState(()=>new Animated.Value(1));
  function feedback(pressed:boolean){
    scale.stopAnimation();
    if(reduced){scale.setValue(1);return;}
    Animated.timing(scale,{toValue:pressed?.97:1,duration:pressed?120:180,useNativeDriver:Platform.OS!=='web'}).start();
  }
  return <Animated.View style={{flex:1,minWidth:0,transform:[{scale}]}}><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} disabled={disabled} onPress={onPress} onPressIn={()=>feedback(true)} onPressOut={()=>feedback(false)} style={({pressed})=>[styles.headerAction,pressed&&{backgroundColor:theme.colors.lavender}]}>{children}</Pressable></Animated.View>;
}

export function Header({navigationEnabled=true,tools='none'}:{navigationEnabled?:boolean;tools?:HeaderTools}){
  const count=useContext(CartCountContext),delivery=useContext(DeliverySummaryContext);
  const home=tools==='home',hasDelivery=delivery!=='Choose delivery location';
  return <View style={styles.headerSurface}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="AARVIKA home" disabled={!navigationEnabled} onPress={()=>router.navigate('/')} style={{flexDirection:'row',alignItems:'center',minHeight:44,gap:8}}><View style={{width:32,height:36,backgroundColor:theme.colors.pale,borderRadius:10,alignItems:'center',justifyContent:'center'}}><Icon name="gift" size={22}/></View><View><Text style={[styles.text,styles.brand]}>{theme.brand}</Text><Text style={[styles.text,styles.tagline]}>Gifts with a little more meaning</Text></View></Pressable><View><IconButton label={count?`Cart (${count})`:'Cart'} icon="cart" disabled={!navigationEnabled} onPress={()=>router.push('/cart')}/>{count>0&&<View pointerEvents="none" style={{position:'absolute',top:-3,right:-3,minWidth:18,height:18,paddingHorizontal:3,borderRadius:9,backgroundColor:theme.colors.primary,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:10,color:'white',fontWeight:'700'}}>{count>99?'99+':count}</Text></View>}</View></View>
    {tools!=='none'&&<View style={styles.headerTools}>
      <View testID="header-search" style={[styles.compactSearch,{flex:home?7:1}]}>
        <HeaderAction label="Search gifts" disabled={!navigationEnabled} onPress={()=>router.navigate('/search')}><Icon name="search" size={18}/><Text numberOfLines={1} style={[styles.text,styles.searchPrompt]}>Search gifts</Text></HeaderAction>
        <View style={styles.photoSearch}><IconButton label="Search with a photo" icon="camera" disabled={!navigationEnabled} onPress={()=>router.push('/search?visual=1')}/></View>
      </View>
      {home&&<View testID="header-delivery" style={styles.compactDelivery}><HeaderAction label="Change delivery location" hint={delivery} disabled={!navigationEnabled} onPress={()=>router.push('/location')}><View style={{flex:1,minWidth:0}}><Text numberOfLines={1} style={[styles.text,styles.deliveryCaption]}>Deliver to</Text><Text numberOfLines={1} style={[styles.text,styles.deliveryValue]}>{hasDelivery?delivery:'Choose'}</Text></View><Icon name="right" size={11}/></HeaderAction></View>}
    </View>}
  </View>;
}
export function Page({title,children,back=false,navigationEnabled=true,headerTools='none',sideRailActive,footer}:{title?:string;children:React.ReactNode;back?:boolean;navigationEnabled?:boolean;headerTools?:HeaderTools;sideRailActive?:DepartmentId|'all';footer?:React.ReactNode}){
  const insets=useSafeAreaInsets();
  const [pageHeight,setPageHeight]=useState(0);
  return <SafeAreaView edges={['top','left','right']} style={styles.safe} onLayout={event=>{const next=event.nativeEvent.layout.height;setPageHeight(old=>Math.abs(old-next)<1?old:next);}}><Header navigationEnabled={navigationEnabled} tools={headerTools}/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':Platform.OS==='android'?'height':undefined}><ScrollView onScroll={notifyImageViewport} scrollEventThrottle={120} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[styles.page,{paddingBottom:Math.max(24,insets.bottom+12)}]}>{(back||!!title)&&<View style={{flexDirection:'row',alignItems:'center',gap:10}}>{back&&<IconButton label="‹ Back" icon="back" onPress={()=>router.canGoBack()?router.back():router.replace('/')}/>}{!!title&&<View style={{flex:1}}><Label heading>{title}</Label></View>}</View>}{children}</ScrollView>{footer&&<View style={{paddingHorizontal:12,paddingTop:8,paddingBottom:Math.max(8,insets.bottom+6),borderTopWidth:1,borderTopColor:theme.colors.border,backgroundColor:theme.colors.surface}}><View style={{width:'100%',maxWidth:936,alignSelf:'center',gap:6}}>{footer}</View></View>}</KeyboardAvoidingView>{sideRailActive&&pageHeight>0&&<DepartmentSideRail activeId={sideRailActive} pageHeight={pageHeight}/>}</SafeAreaView>;
}
export function SkeletonGrid(){return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{flexDirection:'row',gap:8}}>{[0,1].map(i=><View key={i} style={{flex:1,borderRadius:12,padding:8,backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border,gap:10}}><View style={{height:126,borderRadius:9,backgroundColor:theme.colors.pale}}/><View style={{height:12,width:'90%',borderRadius:4,backgroundColor:theme.colors.border}}/><View style={{height:12,width:'60%',borderRadius:4,backgroundColor:theme.colors.pale}}/><View style={{height:16,width:'40%',borderRadius:4,backgroundColor:theme.colors.lavender}}/></View>)}</View>;}
export function State({title,message,retry,loading=false}:{title:string;message:string;retry?:()=>void;loading?:boolean}){return <View accessibilityLiveRegion="polite" style={{padding:14,borderRadius:12,backgroundColor:theme.colors.pale,gap:8}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}>{loading?<ActivityIndicator color={theme.colors.primary}/>:<Icon name={retry?'search':'bag'} size={22}/>}<View style={{flex:1}}><Label heading>{title}</Label></View></View><Label muted>{message}</Label>{retry&&<Button title="Try again" onPress={retry}/>}</View>;}
export const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:theme.colors.base},page:{width:'100%',maxWidth:960,alignSelf:'center',padding:12,gap:12},
 text:{fontSize:14,lineHeight:21,color:theme.colors.text,fontFamily:Platform.select({ios:'System',android:'sans-serif',default:'system-ui'})},muted:{color:theme.colors.muted,fontSize:13},heading:{fontSize:19,lineHeight:25,fontWeight:'700'},
 header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12,paddingVertical:6,backgroundColor:'white',gap:8},brand:{color:theme.colors.primary,fontWeight:'800',fontSize:19,lineHeight:24,letterSpacing:1.6},tagline:{fontSize:9,lineHeight:13,color:theme.colors.muted},
 headerSurface:{backgroundColor:theme.colors.surface,borderBottomColor:theme.colors.border,borderBottomWidth:1},
 headerTools:{width:'100%',maxWidth:960,alignSelf:'center',flexDirection:'row',gap:8,paddingHorizontal:12,paddingBottom:8},
 compactSearch:{minWidth:0,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:theme.colors.border,borderRadius:12,backgroundColor:theme.colors.base,overflow:'hidden'},
 compactDelivery:{flex:3,minWidth:0,borderWidth:1,borderColor:theme.colors.lavender,borderRadius:12,backgroundColor:theme.colors.pale,overflow:'hidden'},
 headerAction:{flex:1,minHeight:44,minWidth:44,paddingHorizontal:9,paddingVertical:5,flexDirection:'row',alignItems:'center',gap:6,borderRadius:11},
 searchPrompt:{flex:1,minWidth:0,fontSize:13,lineHeight:18,color:theme.colors.muted},
 photoSearch:{borderLeftWidth:1,borderLeftColor:theme.colors.border},
 deliveryCaption:{fontSize:10,lineHeight:13,color:theme.colors.muted},
 deliveryValue:{fontSize:11,lineHeight:16,fontWeight:'600',color:theme.colors.plum},
 button:{minWidth:44,minHeight:44,paddingHorizontal:12,paddingVertical:10,backgroundColor:theme.colors.primary,borderWidth:1,borderColor:'transparent',borderRadius:10,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center'},secondary:{backgroundColor:theme.colors.pale,borderColor:theme.colors.border},buttonText:{color:'white',fontWeight:'600',fontSize:13,lineHeight:18,flexShrink:1,textAlign:'center'},
 input:{minHeight:46,paddingHorizontal:12,paddingVertical:10,borderWidth:1,borderColor:theme.colors.border,borderRadius:10,backgroundColor:'white',color:theme.colors.text,fontSize:14},card:{padding:12,borderWidth:1,borderColor:theme.colors.border,borderRadius:12,backgroundColor:'white',gap:8},row:{flexDirection:'row',flexWrap:'wrap',gap:8}
});
