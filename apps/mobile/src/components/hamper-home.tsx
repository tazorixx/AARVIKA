import { useCatalogue } from '../state/catalogue';
import { router } from 'expo-router';
import { Button, Card, CategoryRail, Label } from './ui';

import { CatalogBrowser } from './catalog-browser';
export function HamperHome() { const { categories } = useCatalogue(); return <><Card><Label heading>A box of thoughtful little things</Label><Label muted>Durable, nonperishable demo sets. No food, fresh flowers or unverified delivery promises. Prebuilt sets share component stock with individual products.</Label><Button title="Build your own hamper" onPress={() => router.push('/builder')} /></Card><CategoryRail label="Hamper families">{categories.filter(c => c.departmentId === 'hampers' && c.level === 2).map(c => <Button key={c.id} title={c.name} secondary onPress={() => router.push(`/category/${c.id}`)} />)}</CategoryRail><CatalogBrowser departmentId="hampers" filters={{ bundleOnly: true }} /></>; }
