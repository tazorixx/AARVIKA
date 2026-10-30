import {router} from 'expo-router';
import {Text, View} from 'react-native';
import {Page, Button, State} from '../../components/ui';
import {GiftHeading, palette, bodyFont, displayFont} from '../../components/aarvika-mobile';
import {useCatalogue} from '../../state/catalogue';
const samples=[
  {big:'20%',unit:'OFF',title:'First gift',desc:'On orders above ₹999',code:'AARVIKA20'},
  {big:'₹150',unit:'OFF',title:'Wedding hampers',desc:'Season of celebrations',code:'SHAADI150'},
  {big:'FREE',unit:'WRAP',title:'Gift wrap on us',desc:'Every personalised gift',code:'WRAPFREE'},
];
export default function Offers(){const {meta}=useCatalogue();return <Page>
  <GiftHeading title="Offers for you"/>
  {meta.demo&&<Text style={{color:palette.muted,fontSize:12,fontFamily:bodyFont,marginBottom:5}}>Reference-design offer previews · not active or redeemable.</Text>}
  {meta.demo&&samples.map(s=><View key={s.code} style={{minHeight:88,flexDirection:'row',borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:palette.line,backgroundColor:'white',marginBottom:12}}><View style={{width:96,backgroundColor:palette.brand,paddingVertical:16,paddingHorizontal:10,alignItems:'center',justifyContent:'center'}}><Text style={{fontFamily:displayFont,fontSize:22,fontWeight:'700',color:'white'}}>{s.big}</Text><Text style={{fontSize:10,color:'white',fontWeight:'800',letterSpacing:1}}>{s.unit}</Text></View><View style={{flex:1,paddingHorizontal:14,paddingVertical:12,gap:5}}><Text style={{fontFamily:bodyFont,fontSize:13,fontWeight:'800',color:palette.ink}}>{s.title}</Text><Text style={{fontFamily:bodyFont,fontSize:12,color:palette.muted}}>{s.desc}</Text><View style={{alignSelf:'flex-start',backgroundColor:palette.soft,paddingVertical:4,paddingHorizontal:8,borderRadius:7}}><Text style={{fontFamily:bodyFont,fontSize:11,fontWeight:'800',color:palette.brand2}}>{s.code}</Text></View></View></View>)}
  <State title="No verified offers" message={meta.demo?"These sample codes reproduce the supplied UI. Actual promotions appear only when eligibility and dates are confirmed.":"There are no active offers right now. Explore the latest gift collections."}/>
  <Button title="Explore gift collections" onPress={()=>router.push('/search')}/>
</Page>;}
