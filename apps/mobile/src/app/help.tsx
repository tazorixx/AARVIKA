import {Share} from 'react-native';
import {Page, Card, Label, Button, Notice} from '../components/ui';
import {useState} from 'react';

export default function Help() {
  const [message, setMessage] = useState('');
  return <Page title="Help & support" back>
    <Card><Label heading>Need a hand?</Label><Label muted>Use your phone’s share options to draft a message in an app you choose. No message is sent by AARVIKA automatically.</Label><Button title="Draft a support message" onPress={() => {void Share.share({message:'Hello AARVIKA, I need help with: '}).catch(error => setMessage(error.message));}} /></Card>
    <Card><Label heading>About this preview</Label><Label>Are prices and delivery final?</Label><Label muted>No. Prices are demo previews, and delivery has not been verified.</Label><Label>Can I place an order?</Label><Label muted>Payments and merchant orders are unavailable in this preview.</Label></Card>
    {!!message && <Notice>{message}</Notice>}
  </Page>;
}
