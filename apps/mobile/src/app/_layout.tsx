import { Stack } from 'expo-router';
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
