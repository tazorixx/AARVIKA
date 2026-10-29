import {useState} from 'react';
import {View} from 'react-native';
import {useStore, type GiftReminder} from '../state/store';
import {Page, Card, Button, Input, Label, Notice, State, styles} from '../components/ui';

const occasions: GiftReminder['occasion'][] = ['Birthday', 'Anniversary', 'Wedding', 'Other'];

export default function Reminders() {
  const store = useStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [occasion, setOccasion] = useState<GiftReminder['occasion']>('Birthday');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const reminders = [...store.profile.reminders].sort((a, b) => a.date.localeCompare(b.date));

  async function save() {
    setBusy(true);
    try {
      await store.addReminder({title, date, occasion});
      setTitle('');
      setDate('');
      setMessage('Reminder saved on this device.');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  return <Page title="Gift reminders" back>
    <Label muted>Keep dates close for thoughtful gifting. These reminders stay on this device; notifications are not enabled.</Label>
    <Card>
      <Label heading>Add a reminder</Label>
      <Input label="Who or what is this for?" value={title} onChangeText={setTitle} maxLength={60} placeholder="Mum's birthday" />
      <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} maxLength={10} keyboardType="numbers-and-punctuation" placeholder="2026-12-15" />
      <View style={[styles.row, {gap:6}]}>{occasions.map(item => <Button key={item} title={item} selected={occasion === item} secondary onPress={() => setOccasion(item)} />)}</View>
      <Button title={busy ? 'Saving…' : 'Save reminder'} disabled={busy} onPress={() => {void save();}} />
    </Card>
    {!!message && <Notice>{message}</Notice>}
    {reminders.length ? <View style={{gap:8}}><Label heading>Your dates</Label>{reminders.map(reminder => <Card key={reminder.id}><Label heading>{reminder.title}</Label><Label muted>{reminder.occasion} · {reminder.date}</Label><Button title={'Remove reminder for ' + reminder.title} secondary onPress={() => {void store.removeReminder(reminder.id).catch(error => setMessage(error.message));}} /></Card>)}</View> : <State title="No dates saved yet" message="Add a birthday, anniversary or wedding date above." />}
  </Page>;
}
