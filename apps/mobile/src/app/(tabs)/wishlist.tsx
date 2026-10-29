import { useCatalogue } from '../../state/catalogue';
import { Page, State, Button, Label } from '../../components/ui';
import { ProductGrid } from '../../components/product';
import { useStore } from '../../state/store';
import { router } from 'expo-router';
export default function Wishlist(){const {products}=useCatalogue(),store=useStore(),selected=products.filter(p=>store.profile.wishlist.includes(p.id));return <Page title="Wishlist">{selected.length?<><Label muted>{selected.length} saved design{selected.length===1?'':'s'} · kept on this device</Label><ProductGrid products={selected}/></>:<><State title="Your favourites belong here" message="Save products as you explore the demo catalogue."/><Button title="Explore departments" icon="heart" onPress={()=>router.navigate('/categories')}/></>}{!!store.error&&<State title="Could not save change" message={store.error}/>}</Page>;}
