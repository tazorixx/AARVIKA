import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Page, Label, Button, Card, Input, FilterDisclosure, IconButton, Notice, Sheet, styles } from '../../components/ui';
import { Icon, type IconName } from '../../components/illustration';
import { environment } from '../../config/environment';
import { useStore } from '../../state/store';
import {useEmailAuth} from '../../state/email-auth';
import { theme } from '../../theme';
import { GiftHeading, palette, bodyFont, displayFont } from '../../components/aarvika-mobile';
import type { DeliveryAddress as Address } from '../../domain/delivery';
import { emptyDelivery } from '../../domain/delivery';
import { AddressForm } from '../../components/address-form';

const blank: Omit<Address, 'id'> = { ...emptyDelivery };

function QuickAction({ title, detail, icon, onPress, accessibilityLabel }: { title: string; detail: string; icon: IconName; onPress: () => void; accessibilityLabel?: string }) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? title}
    onPress={onPress}
    style={({ pressed }) => ({ width: '48.5%', minHeight:74, borderRadius:16, borderWidth:1, borderColor:palette.line, backgroundColor:pressed?palette.soft:'white', padding:10, flexDirection:'row', alignItems:'center', gap:8 })}
  >
    <View style={{ width:40, height:40, borderRadius:12, backgroundColor:palette.soft, alignItems:'center', justifyContent:'center' }}><Icon name={icon} size={19}/></View>
    <View style={{flex:1}}><Text numberOfLines={2} style={[styles.text, { fontSize:12.5, lineHeight:17, fontWeight:'700' }]}>{title}</Text><Text numberOfLines={1} style={[styles.text, { fontSize:10, lineHeight:14, color:theme.colors.muted }]}>{detail}</Text></View>
  </Pressable>;
}

function AccountLink({ title, detail, icon, onPress, accessibilityLabel }: { title:string; detail:string; icon:IconName; onPress:()=>void; accessibilityLabel?:string }) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? title}
    onPress={onPress}
    style={({ pressed }) => ({ minHeight:60, borderRadius:16, borderWidth:1, borderColor:palette.line, backgroundColor:pressed?palette.soft:'white', paddingHorizontal:12, flexDirection:'row', alignItems:'center', gap:10 })}
  >
    <View style={{ width:40, height:40, borderRadius:12, backgroundColor:palette.soft, alignItems:'center', justifyContent:'center' }}><Icon name={icon} size={18}/></View>
    <View style={{ flex:1 }}><Text style={[styles.text, { fontSize:14, fontWeight:'600' }]}>{title}</Text><Text style={[styles.text, { fontSize:11, lineHeight:15, color:theme.colors.muted }]}>{detail}</Text></View>
    <Icon name="right" size={16}/>
  </Pressable>;
}

export default function Account() {
  const store = useStore();
  const emailAuth = useEmailAuth();
  const [name, setName] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [address, setAddress] = useState(blank);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const destination = returnTo?.startsWith('/') && !returnTo.startsWith('//') && !/[\\\u0000-\u001f]/.test(returnTo) ? returnTo : undefined;
  const customer = store.profile.customer;
  const cartCount = store.profile.lines.reduce((total, line) => total + line.quantity, 0);
  const addressCount = store.profile.addresses.length;
  const inquiryCount = store.profile.inquiries.length;
  useEffect(() => {if (destination && customer?.mode === 'staging' && emailAuth.identity) router.replace(destination as Href);}, [destination, customer?.mode, emailAuth.identity]);

  async function requestEmailCode() {
    setBusy(true); setAuthMessage('');
    try {
      const result = await emailAuth.requestCode(email);
      setCodeSent(true); setCode(''); setPreviewCode(result.previewCode);
      setAuthMessage('Six-digit code ready in the local test inbox. It expires in five minutes.');
    } catch (error) {setAuthMessage((error as Error).message);}
    finally {setBusy(false);}
  }

  async function verifyEmailCode() {
    setBusy(true); setAuthMessage('');
    try {
      await emailAuth.verifyCode(email, code);
      setLoginOpen(false); setPreviewCode(''); setCode(''); setCodeSent(false);
      setNotice('Email verified with the local Firebase Auth emulator.');
    } catch (error) {setAuthMessage((error as Error).message);}
    finally {setBusy(false);}
  }

  async function submitSharedEmail(createAccount: boolean) {
    setBusy(true); setAuthMessage('');
    try {
      if (createAccount) await emailAuth.passwordSignUp(email, password);
      else await emailAuth.passwordSignIn(email, password);
      setPassword(''); setLoginOpen(false); setNotice('Signed in with Firebase Authentication.');
    } catch (error) {setAuthMessage((error as Error).message);}
    finally {setBusy(false);}
  }

  async function enter() {
    setBusy(true);
    try {
      await store.signIn(name);
      setDemoOpen(false);
      setNotice('');
      if (destination) router.replace(destination as Href);
    } catch (error) { setNotice((error as Error).message); }
    finally { setBusy(false); }
  }

  function edit(value?: Address) {
    setEditing(value?.id ?? null);
    setAddress(value ? { ...value } : { ...blank });
    setFormError('');
    setEditor(true);
  }

  async function save() {
    setBusy(true);
    try {
      if (editing) await store.updateAddress(editing, address);
      else await store.saveAddress(address);
      setEditor(false);
      setNotice(editing ? 'Sample address updated on this device.' : 'Demo address saved on this device.');
      if (destination) router.replace(destination as Href);
    } catch (error) { setFormError((error as Error).message); }
    finally { setBusy(false); }
  }

  return <Page>
    <View style={{borderRadius:24,padding:20,borderWidth:1,borderColor:palette.line,backgroundColor:palette.soft,gap:8,shadowColor:palette.brand,shadowOffset:{width:0,height:9},shadowOpacity:.12,shadowRadius:12,elevation:3}}>
      <Text style={{fontSize:10,letterSpacing:1.3,fontWeight:'800',color:palette.brand2,fontFamily:bodyFont}}>AARVIKA GIFTING</Text>
      <Text accessibilityRole="header" style={{fontFamily:displayFont,fontWeight:'700',fontSize:21,color:palette.ink}}>{customer ? `Welcome, ${customer.name.split('@')[0]}` : 'Welcome to AARVIKA'}</Text>
      <Text style={{fontFamily:bodyFont,fontSize:12,color:palette.muted,marginBottom:6}}>A place for your favourites and details.</Text>
      {!customer&&<>
        <Button title="Sign up / Log in with email" icon="account" onPress={()=>{setLoginOpen(true);setAuthMessage('');}}/>
        {!emailAuth.real && <Button title="Continue with local demo profile" secondary onPress={()=>setDemoOpen(true)}/>}
      </>}
    </View>
    {!!(notice || store.error) && <Notice>{notice || store.error}</Notice>}

    <View style={{ gap:9 }}>
      <GiftHeading title="Quick access"/>
      <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', rowGap:8 }}>
        <QuickAction title="My orders" detail="Orders & reviews" icon="bag" onPress={() => router.push('/orders')}/>
        <QuickAction title="Reminders" detail={store.profile.reminders.length + ' saved dates'} icon="birthday" onPress={() => router.push('/reminders')}/>
        <QuickAction title="Help" detail="Get assistance" icon="account" onPress={() => router.push('/help')}/>
        <QuickAction title="Addresses" detail={addressCount + ' saved'} icon="home" accessibilityLabel="Addresses" onPress={() => router.push('/location')}/>
      </View>
    </View>

    <View style={{gap:8}}><Label heading>Your shopping</Label>
      <AccountLink title="Wishlist" detail={store.profile.wishlist.length + ' saved gifts'} icon="heart" onPress={() => router.navigate('/wishlist')}/>
      <AccountLink title="Shopping cart" detail={cartCount + ' item' + (cartCount === 1 ? '' : 's')} icon="cart" onPress={() => router.push('/cart')}/>
    </View>

    <View style={{gap:8}}><Label heading>Enquiries</Label>
      <AccountLink title="Furniture requests" detail={inquiryCount + ' local request' + (inquiryCount === 1 ? '' : 's')} icon="furniture" accessibilityLabel="My furniture inquiries" onPress={() => router.push('/furniture/requests')}/>
      <AccountLink title="Wedding gifts" detail="Explore traditions and thoughtful sets" icon="wedding" onPress={() => router.push('/department/wedding')}/>
      <AccountLink title="Corporate gifts" detail="Explore gift hampers" icon="hampers" onPress={() => router.push('/department/hampers')}/>
    </View>

    {customer && <View style={{ gap:9 }}>
      <Label heading>Delivery addresses</Label>
      {!addressCount && <Text style={[styles.text, { fontSize:12, color:theme.colors.muted }]}>No address saved yet.</Text>}
      {store.profile.addresses.map(item => <Card key={item.id}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <View style={{ flex:1 }}>
            <Text style={[styles.text, { fontWeight:'700', fontSize:13 }]}>{item.label || item.name}</Text>
            <Text style={[styles.text, { fontSize:12, color:theme.colors.muted }]}>{item.name} · {item.phone}</Text>
          </View>
          <IconButton label={'Edit address ' + item.pincode} icon="edit" onPress={() => edit(item)}/>
          <IconButton label={'Remove address ' + item.pincode} icon="trash" onPress={() => { void store.removeAddress(item.id).catch(error => setNotice(error.message)); }}/>
        </View>
        <Text style={[styles.text, { fontSize:12, lineHeight:17 }]}>{item.line}, {item.city}, {item.state} {item.pincode}</Text>
      </Card>)}
      <Button title={emailAuth.real?"Add address":"Add sample address"} icon="plus" secondary onPress={() => edit()}/>
    </View>}

    {!!store.profile.review && <AccountLink title="Saved review" detail="Continue your local gift review" icon="bag" accessibilityLabel="Saved demo review" onPress={() => router.push('/review')}/>}

    <View style={{ gap:9 }}>
      <Label heading>Settings</Label>
      <FilterDisclosure title="App settings" summary={emailAuth.real?"Account and device storage":"Profile and local preview"}>
        <Label muted>{customer?.mode === 'staging' ? emailAuth.real?'Firebase verifies this email. Cart, addresses and reminders remain on this device. Checkout is not available yet.':'Firebase emulator verifies this email. Cart, addresses and reminders are still saved only on this device. No order or payment is placed.' : 'This profile is saved on this device for preview. It is not a secure sign-in, and no order or payment is placed here.'}</Label>
        {customer && <Button title={customer.mode === 'staging' ? 'Sign out of email' : 'Leave demo profile'} secondary disabled={busy} onPress={() => { void store.signOut().catch(error => setNotice(error.message)); }}/>}
        {!emailAuth.real && <FilterDisclosure title="Demo connection controls" summary="Local testing and recovery tools">
          <Label muted>Runtime: {environment.appEnv} · {environment.dataMode}</Label>
          <Label muted>Exercise loading, demo-profile failure and retry. Current mode: {store.network}.</Label>
          <View style={styles.row}>{(['normal', 'slow', 'failure'] as const).map(mode => <Button key={mode} title={'Network: ' + mode} selected={store.network === mode} secondary onPress={() => store.networkMode(mode)}/>)}</View>
          <Button title="Reset all local demo data" secondary onPress={() => setResetOpen(true)}/>
        </FilterDisclosure>}
      </FilterDisclosure>
    </View>

    <Sheet title="Email sign-in" visible={loginOpen} onClose={() => {if (!busy) setLoginOpen(false);}} closeLabel="Close email sign-in">
      <Label muted>{emailAuth.real?'Sign in with your email address and password.':'Enter your email, then use the six-digit code. This local test uses Firebase Authentication Emulator; the preview below stands in for an email notification.'}</Label>
      <Input label="Email address" value={email} onChangeText={value => {setEmail(value);setCodeSent(false);setPreviewCode('');}} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" />
      {emailAuth.real ? <>
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="Your password" />
        <Button title={busy?'Signing in…':'Sign in with email'} disabled={busy||!email||!password} onPress={() => {void submitSharedEmail(false);}} />
        <Button title="Create email account" secondary disabled={busy||!email||password.length<6} onPress={() => {void submitSharedEmail(true);}} />
      </> : <Button title={busy ? 'Sending…' : codeSent ? 'Send another code' : 'Send six-digit code'} disabled={busy || !emailAuth.available} onPress={() => {void requestEmailCode();}} />}
      {!emailAuth.available && <Notice>Local email sign-in is available only in the development preview.</Notice>}
      {!emailAuth.real&&codeSent && <>
        <View style={{borderRadius:12,borderWidth:1,borderColor:theme.colors.lavender,backgroundColor:theme.colors.pale,padding:12,gap:4}}><Text style={[styles.text,{fontSize:10,letterSpacing:1.2,color:theme.colors.primary,fontWeight:'700'}]}>LOCAL TEST INBOX · AARVIKA CODE</Text><Text style={[styles.text,{fontSize:25,letterSpacing:7,fontWeight:'800',color:theme.colors.plum}]}>{previewCode}</Text><Label muted>Tap below to fill the code. A real email or system notification is not sent in emulator mode.</Label><Button title="Use local preview code" secondary onPress={() => setCode(previewCode)} /></View>
        <Input label="Six-digit code" value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} placeholder="000000" />
        <Button title={busy ? 'Checking…' : 'Verify and sign in'} disabled={busy || code.length !== 6} onPress={() => {void verifyEmailCode();}} />
      </>}
      {!!authMessage && <Notice>{authMessage}</Notice>}
    </Sheet>
    <Sheet title="Local demo profile" visible={demoOpen} onClose={() => {if (!busy) setDemoOpen(false);}} closeLabel="Close demo profile">
      <Label muted>Use a sample name to save favourites and sample addresses on this device. This is not a secure sign-in.</Label>
      <Input label="Demo profile name" value={name} onChangeText={setName} maxLength={40} placeholder="Your name" returnKeyType="go" onSubmitEditing={() => {if (!busy) void enter();}} />
      <Button title={busy ? 'Opening…' : 'Open demo profile'} icon="account" disabled={busy} onPress={() => {void enter();}} />
      {!!notice && <Notice>{notice}</Notice>}
    </Sheet>
    <Sheet title={editing ? 'Edit sample address' : 'Add sample address'} visible={editor} onClose={() => { if (!busy) setEditor(false); }} closeLabel="Close address editor">
      <AddressForm value={address} onChange={setAddress}/>
      {!!formError && <Notice>{formError}</Notice>}
      <Button title={busy ? 'Saving…' : editing ? 'Update sample address' : 'Save sample address'} disabled={busy} onPress={() => { void save(); }}/>
      <Button title="Cancel address changes" secondary disabled={busy} onPress={() => setEditor(false)}/>
    </Sheet>
    <Sheet title="Reset this device’s demo data?" visible={resetOpen} onClose={() => setResetOpen(false)}>
      <Label>Removes local profiles, favourites, carts, addresses, photos, inquiries and review drafts from this device.</Label>
      <Button title="Keep my demo data" secondary onPress={() => setResetOpen(false)}/>
      <Button title="Reset this device" disabled={busy} onPress={() => { setBusy(true); void store.reset().then(() => { setResetOpen(false); setNotice('All local demo data cleared.'); }).catch(error => setNotice(error.message)).finally(() => setBusy(false)); }}/>
    </Sheet>
  </Page>;
}
