import { router } from 'expo-router';
import { Page, State, Button, Label } from '../../components/ui';
import { DemoIllustration } from '../../components/illustration';
import { View } from 'react-native';
import { theme } from '../../theme';
export default function Offers(){return <Page title="Offers"><View style={{backgroundColor:theme.colors.cream,borderRadius:12,alignItems:'center',padding:16,gap:4}}><DemoIllustration kind="box" size={108}/><Label heading>A thoughtful find is always a good start</Label><Label muted>Browse ideas across all eight departments.</Label></View><State title="No verified offers" message="Offers appear here only when their eligibility and dates are confirmed."/><Button title="Explore the demo collection" icon="right" onPress={()=>router.push('/search')}/></Page>;}
