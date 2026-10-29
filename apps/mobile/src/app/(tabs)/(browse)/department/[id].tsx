import {DepartmentShowcase} from '../../../../components/visual-commerce';
import { useCatalogue } from '../../../../state/catalogue';
import { useLocalSearchParams, router } from 'expo-router';
import { View } from 'react-native';
import { FurnitureHome } from '../../../../components/furniture-home';
import { SpecificationBrowser } from '../../../../components/specification-browser';
import { HamperHome } from '../../../../components/hamper-home';
import { GiftDiscovery } from '../../../../components/gift-discovery';
import { WeddingHome } from '../../../../components/wedding-home';

import { Page, State, Label, Button, FilterDisclosure, styles } from '../../../../components/ui';
import { CatalogBrowser } from '../../../../components/catalog-browser';

export default function Department() { const { categories, departments } = useCatalogue(); const { id,region } = useLocalSearchParams<{ id: string;region?:string }>(); const d = departments.find(x => x.id === id); return <Page title={d?.title ?? 'Department unavailable'} back sideRailActive={d?.id}>{d&&<DepartmentShowcase departmentId={d.id} region={region}/>}<FilterDisclosure keepMounted title={d?.id==='wedding'?'Wedding planning & tradition finder':d?.id==='furniture'?'Furniture specifications & inquiries':d?.id==='clothing'?'Fit, fabric & clothing filters':d?.id==='stationery'?'Stationery specification filters':'More ways to find your gift'}>{d?.id === 'wedding' ? <WeddingHome /> : d && ['birthday', 'personalized', 'anniversary'].includes(d.id) ? <GiftDiscovery departmentId={d.id as 'birthday' | 'personalized' | 'anniversary'} /> : d?.id === 'hampers' ? <HamperHome /> : d && ['clothing', 'stationery'].includes(d.id) ? <SpecificationBrowser departmentId={d.id as 'clothing' | 'stationery'} /> : d?.id === 'furniture' ? <FurnitureHome /> : d ? <><Label muted>{d.description}</Label><View style={styles.row}>{categories.filter(c => c.departmentId === id && c.level === 2).map(c => <Button key={c.id} title={c.name} secondary onPress={() => router.push(`/category/${c.id}`)} />)}</View><CatalogBrowser departmentId={d.id} /></> : <State title="Not found" message="Choose a confirmed department from Categories." />}</FilterDisclosure></Page>; }
