import { useContext } from 'react';
import { Stack } from 'expo-router';
import { MotionContext } from '../../../state/motion-context';

// Route groups preserve public URLs; this stack keeps discovery inside the
// existing Categories tab instead of covering the tab navigator at the root.
export const unstable_settings = { initialRouteName: 'categories' };

export default function BrowseLayout() {
  const reduced = useContext(MotionContext);
  return <Stack screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'fade', animationDuration: 280 }} />;
}
