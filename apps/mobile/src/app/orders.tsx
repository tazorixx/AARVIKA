import {router} from 'expo-router';
import {Page, State, Button, Card, Label} from '../components/ui';
import {useStore} from '../state/store';

export default function Orders() {
  const store = useStore();
  return <Page title="My orders" back>
    <State title="No placed orders yet" message="This preview cannot take payment or create a merchant order. Your local gift review appears below when saved." />
    {store.profile.review && <Card><Label heading>Saved gift review</Label><Label muted>Local draft · not an order</Label><Button title="Open saved review" secondary onPress={() => router.push('/review')} /></Card>}
    <Button title="Explore gifts" onPress={() => router.navigate('/categories')} />
  </Page>;
}
