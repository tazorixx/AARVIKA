import {useCatalogue} from '../../state/catalogue';
import {Page, Button, Label} from '../../components/ui';
import {ProductGrid} from '../../components/product';
import {useStore} from '../../state/store';
import {router} from 'expo-router';
import {Text, View} from 'react-native';
import {GiftIcon, GiftHeading, palette, bodyFont, displayFont} from '../../components/aarvika-mobile';
export default function Wishlist(){
  const {products}=useCatalogue(),store=useStore(),selected=products.filter(p=>store.profile.wishlist.includes(p.id));
  return <Page><GiftHeading title="Wishlist"/>{selected.length?<><Label muted>{selected.length} saved design{selected.length===1?'':'s'} · kept on this device</Label><ProductGrid products={selected}/></>:<View style={{padding:30,alignItems:'center',backgroundColor:'white',borderWidth:1,borderStyle:'dashed',borderColor:palette.line,borderRadius:22,gap:8}}><GiftIcon name="heart" size={36} color={palette.brand2}/><Text accessibilityRole="header" style={{fontFamily:displayFont,fontSize:19,fontWeight:'700',color:palette.ink,textAlign:'center'}}>Your favourites belong here</Text><Text style={{fontFamily:bodyFont,fontSize:12,color:palette.muted,textAlign:'center',marginBottom:8}}>Save products as you explore.</Text><Button title="Explore departments" icon="heart" onPress={()=>router.navigate('/categories')}/></View>}{!!store.error&&<Text accessibilityLiveRegion="polite" style={{fontSize:12,color:palette.brand}}>{store.error}</Text>}</Page>;
}
