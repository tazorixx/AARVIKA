import AsyncStorage from '@react-native-async-storage/async-storage';
import {router} from 'expo-router';
import {RECENT_SEARCH_KEY,normalizeRecent,rememberSearch} from '../domain/recent-searches';
import {Icon} from './illustration';
import { useCatalogue } from '../state/catalogue';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, Platform, type ViewStyle } from 'react-native';
import type { DepartmentId } from '../domain/departments';
import type { Product, SearchQuery } from '../domain/contracts';

import { Button, IconButton, Input, Label, Sheet, SkeletonGrid, State, styles } from './ui';
import { Choices } from './facet-controls';
import { useStore } from '../state/store';
import { ProductGrid } from './product';
import { theme } from '../theme';
export function CatalogBrowser({ departmentId, categoryId, filters = {}, premium=false, filterSheet, onFilterSheetChange }: { departmentId?: DepartmentId; categoryId?: string; filters?: SearchQuery; premium?:boolean;filterSheet?:boolean;onFilterSheetChange?:(value:boolean)=>void }) { const { catalogService, catalogueRevision, products: allProducts, categories, meta } = useCatalogue();
  const store = useStore();
  const [recent,setRecent]=useState<string[]>([]),[historyError,setHistoryError]=useState('');
  useEffect(()=>{if(!premium)return;let active=true;AsyncStorage.getItem(RECENT_SEARCH_KEY).then(v=>{if(active)setRecent(normalizeRecent(v?JSON.parse(v):[]));}).catch(()=>{if(active)setHistoryError('Recent searches are unavailable on this device.');});return()=>{active=false;};},[premium]);
  function remember(text:string){const next=rememberSearch(recent,text);setRecent(next);void AsyncStorage.setItem(RECENT_SEARCH_KEY,JSON.stringify(next)).catch(()=>setHistoryError('Could not save recent searches locally.'));}
  const popular=categories.filter(c=>c.active&&c.level===1&&allProducts.some(p=>p.departmentIds.includes(c.departmentId))).slice(0,8);

  const [localFiltersOpen, setLocalFiltersOpen] = useState(false), [q, setQ] = useState(''), [recipient, setRecipient] = useState(''), [budget, setBudget] = useState(''), [color, setColor] = useState('');
  const [sort, setSort] = useState<SearchQuery['sort']>('relevance'), [result, setResult] = useState<Product[]>([]), [suggestions, setSuggestions] = useState<string[]>([]), [status, setStatus] = useState('loading'), [retry, setRetry] = useState(0), [next, setNext] = useState<string>(), [total, setTotal] = useState(0), [moreBusy, setMoreBusy] = useState(false);
  const filtersOpen=filterSheet??localFiltersOpen,setFiltersOpen=onFilterSheetChange??setLocalFiltersOpen;
  const key = JSON.stringify({ ...filters, text: q || filters.text, departmentId:departmentId??filters.departmentId, categoryId: categoryId ?? filters.categoryId, recipient: recipient || filters.recipient, color: color || filters.color, maxPrice: budget ? Number(budget) * 100 : filters.maxPrice, sort, limit: 20 });
  const generation = useRef('');
  useEffect(() => { let active = true; generation.current = key; const timer=setTimeout(()=>{if (active) setStatus('loading'); catalogService.search(JSON.parse(key)).then(r => { if (active) { setResult(r.products); setTotal(r.total); setNext(r.nextCursor); setStatus('ready'); } }).catch(e => { if (active) setStatus(e.message); }); catalogService.suggestions(q).then(s => { if (active) setSuggestions(q ? s : []); }).catch(() => {}); },180); return () => { active = false; clearTimeout(timer); }; }, [key, q, retry, catalogService, catalogueRevision]);
  async function more() { setMoreBusy(true); try { const r = await catalogService.search({ ...JSON.parse(key), cursor: next }); if (generation.current === key) { setResult(old => [...old, ...r.products.filter(p => !old.some(x => x.id === p.id))]); setNext(r.nextCursor); } } catch (e) { setStatus((e as Error).message); } finally { setMoreBusy(false); } }
  const source=allProducts.filter(p=>!(departmentId??filters.departmentId)||p.departmentIds.includes((departmentId??filters.departmentId)!));
  const recipients=[...new Set(source.flatMap(p=>p.recipientIds))],colors=[...new Set(source.map(p=>p.color))];
  return <View style={{gap:8}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
      <View style={{flex:1,minWidth:0,minHeight:44,paddingLeft:10,flexDirection:'row',alignItems:'center',gap:7,borderWidth:1,borderColor:theme.colors.border,borderRadius:10,backgroundColor:theme.colors.surface}}>
        <Icon name="search" size={17}/>
        <TextInput accessibilityLabel="Search catalogue" value={q} onChangeText={setQ} placeholder="Search gifts, categories…" placeholderTextColor={theme.colors.muted} selectionColor={theme.colors.primary} returnKeyType="search" onSubmitEditing={()=>remember(q)} style={{flex:1,minWidth:0,minHeight:42,paddingVertical:7,fontSize:13,color:theme.colors.text}}/>
      </View>
      {premium&&<IconButton label="Open visual search" icon="camera" onPress={()=>router.setParams({visual:'1'})}/>}
      {!!q&&<IconButton label="Clear search" icon="close" onPress={()=>setQ('')}/>}
    </View>
    {suggestions.length>0&&<ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} accessibilityLabel="Search suggestions" contentContainerStyle={{gap:6}}>{suggestions.map(s=><Button key={s} title={s} secondary onPress={()=>{setQ(s);remember(s);}}/>)}</ScrollView>}
    {premium&&!q&&<>
      {recent.length>0&&<View style={{gap:4}}><View style={{flexDirection:'row',alignItems:'center'}}><Text style={[styles.text,{flex:1,fontSize:12,fontWeight:'600',color:theme.colors.muted}]}>Recent · on this device</Text><IconButton label="Clear recent searches" icon="trash" onPress={()=>{setRecent([]);void AsyncStorage.removeItem(RECENT_SEARCH_KEY).catch(()=>setHistoryError('Could not clear local recent searches.'));}}/></View><ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} accessibilityLabel="Recent searches" contentContainerStyle={{gap:6}}>{recent.map(text=><Button key={text} title={text} secondary onPress={()=>{setQ(text);remember(text);}}/>)}</ScrollView></View>}
      <View style={{gap:4}}><Text style={[styles.text,{fontSize:12,fontWeight:'600',color:theme.colors.muted}]}>Shop by category</Text><ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} accessibilityLabel="Explore categories" contentContainerStyle={{gap:12,paddingRight:12}}>{popular.map(category=><Pressable key={category.id} accessibilityRole="link" accessibilityLabel={category.name} onPress={()=>router.push(`/category/${category.id}`)} style={({pressed})=>({minHeight:44,justifyContent:'center',opacity:pressed?.6:1})}><Text style={[styles.text,{fontSize:13,lineHeight:18,fontWeight:'600',color:theme.colors.primary}]}>{category.name}</Text></Pressable>)}</ScrollView></View>
    </>}
    {!!historyError&&<Label muted>{historyError}</Label>}
    {(!premium||Platform.OS==='web')&&<View style={[styles.row,{backgroundColor:theme.colors.base,paddingVertical:2},Platform.OS==='web'?({position:'sticky',top:0,zIndex:2} as unknown as ViewStyle):undefined]}><Button title="Refine your finds" icon="filter" secondary expanded={filtersOpen} onPress={()=>setFiltersOpen(true)}/><Button title={sort==='relevance'?'Sort designs':sort==='price-asc'?'Price ↑':'Price ↓'} secondary onPress={()=>setFiltersOpen(true)}/></View>}
    <Sheet title="Refine your finds" visible={filtersOpen} onClose={()=>setFiltersOpen(false)} closeLabel="Close filters"><Choices label="Recipient" values={recipients} selected={recipient} onSelect={setRecipient}/><Choices label="Colour" values={colors} selected={color} onSelect={setColor}/><Input label="Maximum budget (₹)" value={budget} onChangeText={v=>setBudget(v.replace(/[^0-9]/g,''))} keyboardType="number-pad" placeholder="Any budget"/><Choices label="Sort" values={['Catalogue order','Price: low to high','Price: high to low']} selected={sort==='price-asc'?'Price: low to high':sort==='price-desc'?'Price: high to low':'Catalogue order'} onSelect={v=>setSort(v==='Price: low to high'?'price-asc':v==='Price: high to low'?'price-desc':'relevance')}/><Button title="Clear filters" secondary onPress={()=>{setQ('');setRecipient('');setBudget('');setColor('');setSort('relevance');}}/><Button title="Show results" onPress={()=>setFiltersOpen(false)}/></Sheet>
    {status==='loading'?<><State title="Finding thoughtful things" message={`Loading ${meta.demo?'demo':'published'} catalogue…`} loading/><SkeletonGrid/></>:status!=='ready'?<State title="Could not load products" message={status} retry={()=>{store.networkMode('normal');setRetry(x=>x+1);}}/>:result.length?<><Label muted>{result.length} of {total} designs{meta.demo?' · demo prices':''}</Label><ProductGrid products={result}/>{!!next&&<Button title={moreBusy?'Loading more…':'Load more designs'} disabled={moreBusy} secondary onPress={()=>{void more();}}/>}</>:<State title="No matching gifts" message="Try a broader search or clear your filters."/>}
  </View>;
}
