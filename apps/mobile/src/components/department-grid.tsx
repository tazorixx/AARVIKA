import {VisualArtwork} from './visual-commerce';
import {departmentVisuals} from '../../../../packages/catalogue/src/visual-commerce';
import { useCatalogue } from '../state/catalogue';
import { router } from 'expo-router';
import { useState } from 'react';
import { gridGeometry } from '../domain/layout';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { styles } from './ui';
export function DepartmentGrid({horizontal=false,compact=false}:{horizontal?:boolean;compact?:boolean}){
 const {departments,categories}=useCatalogue(),{width,fontScale}=useWindowDimensions(),[measured,setMeasured]=useState<number>();
 const available=measured??Math.max(0,Math.min(width,960)-24),grid=gridGeometry(available,available>=700?(fontScale>1.4?6:8):(fontScale>1.4||compact&&available<260?3:4));
 const items=departments.map((d,i)=><Pressable key={d.id} accessibilityRole="button" accessibilityLabel={d.title} onPress={()=>router.push(`/department/${d.id}`)} style={({pressed})=>({width:horizontal?fontScale>1.4?100:compact?70:78:grid.itemWidth,minHeight:compact?100:120,alignItems:'center',justifyContent:'center',gap:4,opacity:pressed?.7:1})}><VisualArtwork departmentId={d.id} visual={{...departmentVisuals[d.id],...categories.find(c=>c.departmentId===d.id&&c.level===1)?.visual}} index={i} compact={compact}/><Text style={[styles.text,{fontSize:compact?10:11,lineHeight:compact?13:15,textAlign:'center'}]}>{d.title}</Text></Pressable>);
 return horizontal?<ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Shop all eight departments" style={{flexGrow:0}} contentContainerStyle={{gap:8,paddingVertical:2}}>{items}</ScrollView>:<View onLayout={e=>{const next=e.nativeEvent.layout.width;setMeasured(old=>old!==undefined&&Math.abs(old-next)<.5?old:next);}} style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{items}</View>;
}
