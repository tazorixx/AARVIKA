import { Stack, type ErrorBoundaryProps } from 'expo-router';
import {Pressable, Text, View} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MotionContext, useReducedMotion } from '../components/ui';
import { CatalogueProvider } from '../state/catalogue';
import { StoreProvider } from '../state/store';
import { EmailAuthProvider } from '../state/email-auth';
export default function RootLayout() {
  const reduced = useReducedMotion();
  return <SafeAreaProvider><MotionContext.Provider value={reduced}><CatalogueProvider><EmailAuthProvider><StoreProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'fade', animationDuration: 280 }} /></StoreProvider></EmailAuthProvider></CatalogueProvider></MotionContext.Provider></SafeAreaProvider>;
}


// Expo Router renders this on screen errors instead of leaving an empty web app.
export function ErrorBoundary({error,retry}:ErrorBoundaryProps){
  return <View style={{flex:1,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center',padding:24}}>
    <Text accessibilityRole="header" style={{fontWeight:'800',fontSize:23,color:'#4A1D7A',marginBottom:12}}>AARVIKA</Text>
    <Text style={{fontWeight:'700',fontSize:17,color:'#1E1030',marginBottom:8}}>The page could not load</Text>
    <Text selectable style={{fontSize:13,color:'#6C5F80',textAlign:'center',marginBottom:20}}>{error.message}</Text>
    <Pressable accessibilityRole="button" onPress={retry} style={{paddingVertical:12,paddingHorizontal:22,backgroundColor:'#4A1D7A',borderRadius:12}}><Text style={{color:'white',fontWeight:'700'}}>Try again</Text></Pressable>
  </View>;
}
