import React, {useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {router} from 'expo-router';
import {Page, Button, Label, styles} from '../../../components/ui';
import {GiftHeading, GiftIcon, GiftTile, GiftRise, palette, bodyFont, displayFont, type GiftArtName} from '../../../components/aarvika-mobile';
import {VisualTiles, categoryTiles} from '../../../components/visual-commerce';
import {Icon, type IconName} from '../../../components/illustration';
import {useCatalogue} from '../../../state/catalogue';

const referenceTiles:{id:string;name:string;art:GiftArtName;bg:string}[]=[
  {id:'wedding',name:'Wedding',art:'rings',bg:palette.peach},
  {id:'birthday',name:'Birthday',art:'cake',bg:palette.rose},
  {id:'personalized',name:'Personalised',art:'frame',bg:palette.mint},
  {id:'anniversary',name:'Anniversary',art:'heartA',bg:palette.soft},
  {id:'hampers',name:'Hampers',art:'hamper',bg:palette.sun},
  {id:'clothing',name:'Clothing',art:'tee',bg:palette.peach},
  {id:'stationery',name:'Stationery',art:'notebook',bg:palette.mint},
  {id:'furniture',name:'Furniture',art:'chair',bg:palette.soft},
  {id:'home',name:'Home decor',art:'candle',bg:palette.rose},
];
export default function Categories(){
  const {departments,categories}=useCatalogue(),[query,setQuery]=useState(''),[expanded,setExpanded]=useState<string|null>(null),[limit,setLimit]=useState(20);
  const matches=categories.filter(c=>c.active&&c.name.toLowerCase().includes(query.trim().toLowerCase()));
  const q=query.trim();
  return <Page>
    <View style={{height:44,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12,borderWidth:1,borderColor:palette.line,borderRadius:14,backgroundColor:'white'}}><GiftIcon name="search" size={18} color={palette.muted}/><TextInput accessibilityLabel="Find a category" value={query} onChangeText={v=>{setQuery(v);setLimit(20);}} returnKeyType="search" placeholder="Try notebooks, mugs or living room" placeholderTextColor={palette.muted} style={{flex:1,minWidth:0,height:44,fontSize:12,color:palette.ink,fontFamily:bodyFont}}/></View>
    <View style={{gap:3,marginTop:5}}><Text accessibilityRole="header" style={{fontFamily:displayFont,fontSize:19,fontWeight:'700',color:palette.ink}}>Explore departments</Text><Text style={{fontFamily:bodyFont,fontSize:12,color:palette.muted}}>Find your next thoughtful detail.</Text></View>
    {!q&&<View testID="categories-nine-tile-grid" style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:5}}>{referenceTiles.filter(t=>t.id==='home'||departments.some(d=>d.id===t.id&&d.active)).map((t,i)=><GiftRise key={t.id} index={i} style={{width:'30.8%',flexGrow:1}}><GiftTile small label={t.name} art={t.art} bg={t.bg} onPress={()=>router.push(t.id==='home'?'/search?text=home%20decor':`/department/${t.id}`)}/></GiftRise>)}</View>}
    {q?<View style={{gap:8,marginTop:8}}><Label muted>{Math.min(limit,matches.length)} of {matches.length} matching categories</Label>{matches.slice(0,limit).map(c=><Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Open ${c.name} in ${c.departmentId}`} onPress={()=>router.push(`/category/${c.id}`)} style={{minHeight:58,padding:12,borderRadius:14,backgroundColor:'white',borderWidth:1,borderColor:palette.line,flexDirection:'row',alignItems:'center',gap:10}}><View style={{flex:1}}><Label>{c.name}</Label><Text style={[styles.text,{fontSize:11,color:palette.muted}]}>{departments.find(d=>d.id===c.departmentId)?.title}{c.parentId?` › ${categories.find(p=>p.id===c.parentId)?.name}`:''}</Text></View><Icon name="right" size={17}/></Pressable>)}{matches.length>limit&&<Button title="More matching categories" secondary onPress={()=>setLimit(v=>v+20)}/>}</View>
    :<View style={{gap:10,marginTop:18}}>
      <GiftHeading title="Browse the catalogue" />
      {departments.filter(d=>d.active).map(d=>{
        const groups=categories.filter(c=>c.departmentId===d.id&&c.active&&c.level===2);
        const root=categories.find(c=>c.departmentId===d.id&&c.active&&c.level===1);
        const allSubcategories=categories.filter(c=>c.departmentId===d.id&&c.active&&c.level>2);
        const open=expanded===d.id;
        return <View key={d.id} testID={`category-group-${d.id}`} style={{borderWidth:1,borderColor:palette.line,borderRadius:18,backgroundColor:'white',overflow:'hidden'}}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Browse ${d.title} categories`} accessibilityState={{expanded:open}} onPress={()=>setExpanded(open?null:d.id)} style={({pressed})=>({minHeight:62,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:pressed?palette.soft:'white'})}>
            <Icon name={d.id as IconName} size={23}/>
            <View style={{flex:1}}><Text style={[styles.text,{fontFamily:bodyFont,fontWeight:'700',fontSize:14,color:palette.ink}]}>{d.title}</Text><Text style={[styles.text,{fontSize:11,lineHeight:16,color:palette.muted}]}>{groups.length} collections · {allSubcategories.length} subcategories</Text></View>
            <View style={{transform:[{rotate:open?'90deg':'0deg'}]}}><Icon name="right" size={17}/></View>
          </Pressable>
          {open&&<View style={{padding:12,paddingTop:0,gap:10}}>
            <Button title={`Explore all ${d.title} gifts`} secondary onPress={()=>router.push(`/department/${d.id}`)}/>
            {root&&<Button title={`View ${d.title} category`} secondary onPress={()=>router.push(`/category/${root.id}`)}/>}
            {groups.length>0&&<VisualTiles tiles={categoryTiles(groups)} departmentId={d.id}/>}
            {allSubcategories.length>0&&<View style={{gap:7}}>
              <Text style={{fontFamily:bodyFont,fontSize:12,fontWeight:'800',color:palette.brand}}>More {d.title} categories</Text>
              {allSubcategories.map(c=><Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Open ${c.name}`} onPress={()=>router.push(`/category/${c.id}`)} style={({pressed})=>({padding:11,borderRadius:12,borderWidth:1,borderColor:palette.line,backgroundColor:pressed?palette.soft:'white',flexDirection:'row',alignItems:'center',gap:8})}>
                <Text style={{fontFamily:bodyFont,fontSize:12,color:palette.ink,flex:1}}>{c.name}</Text>
                <GiftIcon name="arrow" size={15} color={palette.brand2}/>
              </Pressable>)}
            </View>}
          </View>}
        </View>;
      })}
    </View>}
  </Page>;
}
