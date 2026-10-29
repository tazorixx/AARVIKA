import {DepartmentShowcase} from '../../../../../components/visual-commerce';
import { useCatalogue } from '../../../../../state/catalogue';
import { router, useLocalSearchParams } from 'expo-router';
import { Switch, View } from 'react-native';
import { Page, Card, Label, Button, State, FilterDisclosure, styles } from '../../../../../components/ui';

import { useStore } from '../../../../../state/store';
import { emptyWeddingPlan } from '../../../../../domain/wedding';
export default function Tradition() { const { wedding: { traditions, ceremonies } } = useCatalogue();
  const { id } = useLocalSearchParams<{ id: string }>(), store = useStore(); const t = traditions.find(x => x.id === id); const plan = store.profile.weddingPlan ?? emptyWeddingPlan;
  return <Page title={t?.name ?? 'Tradition unavailable'} back sideRailActive={t?'wedding':undefined}>{!t ? <State title="Not found" message="Choose a tradition from Wedding." /> : <><DepartmentShowcase departmentId="wedding" pageKey={'tradition:'+t.id} heading={t.name} shortcuts={ceremonies.filter(c=>c.traditionId===id).map(c=>({key:'function:'+c.id,title:c.name,action:`/wedding/function/${c.id}`}))}/><FilterDisclosure keepMounted title="Planning notes / Family guidance"><Label muted>{t.faith} · {t.regions.join(', ')}</Label><Card><Label heading>Choose only what fits your family</Label><Label muted>Research template, not a verified ritual list. Every function is optional. Product suggestions need family/officiant review.</Label></Card>{ceremonies.filter(c => c.traditionId === id).map(c => <Card key={c.id}><Label heading>{c.name}</Label><Label muted>{c.stage} · optional</Label><View style={styles.row}><Switch accessibilityLabel={`Include ${c.name}`} value={plan.ceremonyIds.includes(c.id)} onValueChange={enabled => { void store.saveWeddingPlan({ ...plan, ceremonyIds: enabled ? [...plan.ceremonyIds, c.id] : plan.ceremonyIds.filter(x => x !== c.id) }).catch(() => {}); }} /><Label>Include in family plan</Label></View><Button title={`Explore ${c.name}`} secondary onPress={() => router.push(`/wedding/function/${c.id}`)} /></Card>)}{!!store.error && <Label>{store.error}</Label>}</FilterDisclosure></>}</Page>;
}
