import { useCatalogue } from '../state/catalogue';
import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import type { SearchQuery } from '../domain/contracts';


import { Button, Card, CategoryRail, FilterDisclosure, Input, Label, styles } from './ui';
import { Choices } from './facet-controls';
import { CatalogBrowser } from './catalog-browser';
export function SpecificationBrowser({ departmentId, categoryId }: { categoryId?: string; departmentId: 'clothing' | 'stationery' }) { const { categories, products, skus, clothingColumns } = useCatalogue();
  const clothing = departmentId === 'clothing', [axis, setAxis] = useState(''), [query, setQuery] = useState<SearchQuery>({}), [notice, setNotice] = useState('');
  function attribute(key: string, value: string) { setQuery(q => ({ ...q, attributes: { ...q.attributes, [key]: value } })); }
  const keys = clothing ? ['Audience', 'Clothing type', 'Size', 'Colour', 'Fabric', 'Fit', 'Age group'] : ['Paper size', 'GSM', 'Sheets', 'Ruling', 'Ink', 'Point', 'Refill', 'Lead', 'Volume', 'Pack count', 'Age group', 'Grade', 'Medium', ...(categoryId ? ['Format'] : [])];
  const source = products.filter(p => p.departmentIds.includes(departmentId) && (!categoryId || p.categoryIds.includes(categoryId)));
  return <><Card><Label heading>{clothing ? 'Find your fit, in every detail' : 'Tools for your next bright idea'}</Label><Label muted>Demo specifications and availability. Real fit, age suitability, returns and delivery require supplier verification.</Label></Card><CategoryRail label={clothing ? "Clothing paths" : "Stationery families"}>{clothing ? clothingColumns.map(c => <Button key={c.name} title={c.name} selected={axis === c.name} secondary onPress={() => { setAxis(c.name); if (['Men', 'Women', 'Kids'].includes(c.name)) attribute('Audience', c.name); }} />) : categories.filter(c => !categoryId && c.departmentId === 'stationery' && c.level === 2).map(c => <Button key={c.id} title={c.name} secondary onPress={() => router.push(`/category/${c.id}`)} />)}</CategoryRail>
    {clothing && axis === 'Shop by Clothing Type' && <Choices label="Clothing type" values={clothingColumns[3].children} selected={query.attributes?.['Clothing type']} onSelect={v => attribute('Clothing type', v)} />}
    {clothing && axis === 'Shop by Style' && <Choices label="Style" values={clothingColumns[4].children} selected={query.attributes?.Style} onSelect={v => attribute('Style', v)} />}
    {clothing && axis === 'Shop by Occasion' && <Choices label="Occasion" values={clothingColumns[5].children} selected={query.attributes?.Occasion} onSelect={v => attribute('Occasion', v)} />}
    {clothing && axis === 'Trending & Collections' && <><Choices label="Collection" values={clothingColumns[6].children} onSelect={v => { setNotice(`${v || 'Collection'}: unranked demo assortment; no verified sales or sustainability claim.`); setQuery(q => ({ ...q, collectionId: 'thoughtful' })); }} />{!!notice && <Label>{notice}</Label>}</>}
    {clothing && axis === 'Deals & Budget' && <Card><Label muted>No verified discounts or BOGO promotion is active.</Label><View style={styles.row}>{[299, 499, 999, 1999].map(n => <Button key={n} title={`Clothing up to ₹${n}`} secondary onPress={() => setQuery(q => ({ ...q, maxPrice: n * 100 }))} />)}</View></Card>}
    <FilterDisclosure title="Edit specifications" summary={Object.entries(query.attributes ?? {}).filter(([, v]) => !!v).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'Size, material and type-specific details'}>{keys.map(key => { const skuValues = [...source.map(p => p.specs[key]),...(clothing?skus.filter(s=>source.some(p=>p.id===s.productId)).map(s=>s.attributes[key]):[])].filter(Boolean); const values = [...new Set(skuValues)]; return values.length ? <Choices key={key} label={key} values={values} selected={query.attributes?.[key]} onSelect={v => attribute(key, v)} /> : null; })}<Input label="Specification keyword" value={query.text ?? ''} onChangeText={text => setQuery(q => ({ ...q, text }))} /><Button title="Reset specification filters" secondary onPress={() => setQuery({})} /></FilterDisclosure><CatalogBrowser departmentId={departmentId} categoryId={categoryId} filters={query} /></>;
}
