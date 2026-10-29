import { router } from 'expo-router';
import { Page, State, Button } from '../components/ui';
export default function NotFound() { return <Page title="Page unavailable"><State title="We could not find that page" message="Return to the catalogue and try again." /><Button title="Go home" onPress={() => router.replace('/')} /></Page>; }
