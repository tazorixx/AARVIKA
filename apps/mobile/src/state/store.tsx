import {deliverySummary,type DeliveryAddress as Address} from '../domain/delivery';
import { useCatalogue } from './catalogue';
import { buildDemoReview, changeCartVariant, type DemoReview } from '../domain/demo-review';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartLine, Customer, MediaAsset, PersonalizationValues, CustomBundle } from '../domain/contracts';
import { saveInquiry as buildInquiry, withdrawInquiry, type FurnitureInquiry, type InquiryDraft } from '../domain/furniture';
import { validateWeddingPlan, type WeddingPlan } from '../domain/wedding';
import { addLine, validateAddress, validateCart } from '../domain/cart';

import { CartCountContext, DeliverySummaryContext } from './header-context';
import {useEmailAuth} from './email-auth';
import {environment} from '../config/environment';
import { State, Button, Page } from '../components/ui';

export interface GiftReminder { id: string; title: string; date: string; occasion: 'Birthday' | 'Anniversary' | 'Wedding' | 'Other' }
interface Profile { selectedAddressId?: string; review?: DemoReview; reminders: GiftReminder[]; inquiries: FurnitureInquiry[]; weddingPlan?: WeddingPlan; drafts: Record<string, { values: PersonalizationValues; media: MediaAsset[] }>; bundleDraft?: Omit<CustomBundle, 'previewTotal'>; customer: Customer | null; wishlist: string[]; lines: CartLine[]; addresses: Address[] }
interface Stored { version: 1; active: string; profiles: Record<string, Profile> }
const emptyProfile = (): Profile => ({ reminders: [], inquiries: [], drafts: {}, customer: null, wishlist: [], lines: [], addresses: [] });
const empty = (): Stored => ({ version: 1, active: 'guest', profiles: { guest: emptyProfile() } });
const STORAGE_KEY = environment.dataMode === 'shared-api' ? 'aarvika:shared:gift4u-4210f:v1' : 'aarvika:demo:v1';
type Mode = 'normal' | 'slow' | 'failure';
interface Store {
  profile: Profile; network: Mode; error: string; clearError(): void; networkMode(mode: Mode): void;
  selectAddress(id: string): Promise<void>;
  signIn(name: string): Promise<void>; signOut(): Promise<void>; toggleWish(id: string): Promise<void>;
  addReminder(reminder: Omit<GiftReminder, 'id'>): Promise<void>; removeReminder(id: string): Promise<void>;
  add(item: Omit<CartLine, 'id'>): Promise<void>; quantity(id: string, qty: number): Promise<void>;
  changeVariant(id: string, skuId: string): Promise<void>; updateAddress(id: string, address: Omit<Address, 'id'>): Promise<void>; saveReview(addressId: string): Promise<void>;
  remove(id: string): Promise<void>; saveAddress(address: Omit<Address, 'id'>): Promise<void>; removeAddress(id: string): Promise<void>;
  saveFurnitureInquiry(input: InquiryDraft, id?: string, expectedRevision?: number): Promise<string>; withdrawFurnitureInquiry(id: string): Promise<void>;
  saveWeddingPlan(plan: WeddingPlan): Promise<void>;
  saveDraft(key: string, values: PersonalizationValues, media: MediaAsset[]): Promise<void>; saveBundleDraft(bundle: Omit<CustomBundle, 'previewTotal'>): Promise<void>;
  reset(): Promise<void>;
}
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) { const { skus, products, schemas, bundleTemplates, catalogService, categories } = useCatalogue(); const emailAuth = useEmailAuth();
  const [state, setState] = useState<Stored>(empty), [loaded, setLoaded] = useState(false), [fatal, setFatal] = useState(''), [error, setError] = useState(''), [network, setNetwork] = useState<Mode>('normal');
  const current = useRef(state), queue = useRef<Promise<unknown>>(Promise.resolve()), modeRef = useRef<Mode>('normal');
  useEffect(() => { let active = true; AsyncStorage.getItem(STORAGE_KEY).then(value => { const saved: Stored = value ? JSON.parse(value) : empty(); if (saved.version !== 1 || !saved.profiles?.[saved.active] || !Array.isArray(saved.profiles[saved.active].lines)) throw new Error('Saved demo data is incompatible. Reset local demo data to continue.'); for (const profile of Object.values(saved.profiles)) { profile.drafts ??= {}; profile.inquiries ??= []; profile.reminders ??= []; } if (active) { current.current = saved; setState(saved); setLoaded(true); } }).catch(() => { if (active) setFatal('Could not restore local demo data. Retry or reset this device’s demo data.'); }); return () => { active = false; }; }, []);
  function transact(change: (draft: Stored) => void, simulateNetwork = true): Promise<void> {
    const run = queue.current.catch(() => {}).then(async () => { if (simulateNetwork && modeRef.current === 'slow') await new Promise(r => setTimeout(r, 1200)); if (simulateNetwork && modeRef.current === 'failure') throw new Error('Demo network unavailable. Switch to Normal and retry.'); const draft = JSON.parse(JSON.stringify(current.current)) as Stored; change(draft); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); current.current = draft; setState(draft); setError(''); });
    queue.current = run; return run.catch(e => { setError(e.message || 'Could not save demo changes. Retry.'); throw e; });
  }
  const authIdentity = emailAuth.identity;
  useEffect(() => {
    if (!loaded || !emailAuth.ready) return;
    const identity = authIdentity;
    if (!identity) {
      if (current.current.active.startsWith('firebase-')) void transact(d => {d.active = 'guest';}, false).catch(() => {});
      return;
    }
    const id = 'firebase-' + identity.uid;
    if (current.current.active === id) {
      if (identity.email && current.current.profiles[id]?.customer?.name !== identity.email) void transact(d => {d.profiles[id].customer = {id, name: identity.email, mode: 'staging'};}, false).catch(() => {});
      return;
    }
    void transact(d => {
      const profile = d.profiles[id] ?? {...emptyProfile(), customer: {id, name: identity.email || 'Email shopper', mode: 'staging' as const}};
      profile.customer = {id, name: identity.email || 'Email shopper', mode: 'staging'};
      if (d.active === 'guest') {
        const guest = d.profiles.guest;
        for (const line of guest.lines) profile.lines = addLine(profile.lines, line, skus);
        profile.wishlist = [...new Set([...profile.wishlist, ...guest.wishlist])];
        profile.reminders.push(...guest.reminders);
        profile.drafts = {...guest.drafts, ...profile.drafts};
        profile.bundleDraft ??= guest.bundleDraft;
        profile.weddingPlan ??= guest.weddingPlan;
        profile.inquiries.push(...guest.inquiries);
        for (const inquiry of profile.inquiries) {inquiry.customerId = id; inquiry.input.media.forEach(media => {media.ownerId = id;});}
        for (const line of profile.lines) {line.media.forEach(media => {media.ownerId = id;}); line.bundle?.components.forEach(component => component.media.forEach(media => {media.ownerId = id;}));}
        for (const draft of Object.values(profile.drafts)) draft.media.forEach(media => {media.ownerId = id;});
        profile.bundleDraft?.components.forEach(component => component.media.forEach(media => {media.ownerId = id;}));
        d.profiles.guest = emptyProfile();
      }
      d.profiles[id] = profile;
      d.active = id;
    }, false).catch(() => {});
  }, [loaded, emailAuth.ready, authIdentity, skus]);
  async function reset() { const { clearLocalPhotos } = await import('../services/media'); if (emailAuth.identity) await emailAuth.leave(); await clearLocalPhotos(); const fresh = empty(); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); current.current = fresh; setState(fresh); setFatal(''); setError(''); setLoaded(true); }
  const store: Store = {
    profile: state.profiles[state.active], network, error, clearError: () => setError(''), networkMode: m => { setNetwork(m); modeRef.current = m; catalogService.setNetworkMode(m); }, reset,
    saveFurnitureInquiry: async (input, id, expectedRevision) => { const savedId = id ?? `inquiry-${Date.now()}-${Math.random().toString(36).slice(2)}`; await transact(d => { const p = d.profiles[d.active], existing = p.inquiries.find(q => q.id === id); if (id && !existing) throw new Error('Inquiry not found for this profile.'); const request = buildInquiry(input, p.customer?.id ?? 'guest', savedId, new Date().toISOString(), existing, expectedRevision, categories.filter(c=>c.active&&c.departmentId==='furniture'&&c.level===2).map(c=>c.id)); p.inquiries = [...p.inquiries.filter(q => q.id !== savedId), request]; }); return savedId; },
    withdrawFurnitureInquiry: id => transact(d => { const p = d.profiles[d.active]; if (!p.inquiries.some(q => q.id === id)) throw new Error('Inquiry not found.'); p.inquiries = p.inquiries.map(q => q.id === id ? withdrawInquiry(q, new Date().toISOString()) : q); }),
    saveWeddingPlan: plan => transact(d => { const invalid = validateWeddingPlan(plan); if (invalid) throw new Error(invalid); d.profiles[d.active].weddingPlan = plan; }),
    saveDraft: (key, values, media) => transact(d => { const p = d.profiles[d.active]; if (media.some(m => m.ownerId !== (p.customer?.id ?? 'guest'))) throw new Error('Photo belongs to a different demo profile.'); p.drafts[key] = { values, media }; }),
    saveBundleDraft: bundle => transact(d => { d.profiles[d.active].bundleDraft = bundle; }),
    signIn: name => transact(d => { const normalized = name.trim(); if (normalized.length < 2 || normalized.length > 40) throw new Error('Use a demo profile name from 2 to 40 characters.'); const id = `demo-${normalized.toLowerCase()}`; const profile = d.profiles[id] ?? { ...emptyProfile(), customer: { id, name: normalized, mode: 'local-demo' as const } }; if (d.active === 'guest') { for (const line of d.profiles.guest.lines) profile.lines = addLine(profile.lines, line, skus); profile.drafts = { ...d.profiles.guest.drafts, ...profile.drafts }; profile.bundleDraft ??= d.profiles.guest.bundleDraft; profile.weddingPlan ??= d.profiles.guest.weddingPlan; profile.reminders.push(...d.profiles.guest.reminders); profile.inquiries.push(...d.profiles.guest.inquiries); for (const inquiry of profile.inquiries) { inquiry.customerId = id; inquiry.input.media.forEach(m => { m.ownerId = id; }); } for (const line of profile.lines) { line.media.forEach(m => { m.ownerId = id; }); line.bundle?.components.forEach(c => c.media.forEach(m => { m.ownerId = id; })); } for (const draft of Object.values(profile.drafts)) draft.media.forEach(m => { m.ownerId = id; }); profile.bundleDraft?.components.forEach(c => c.media.forEach(m => { m.ownerId = id; })); profile.wishlist = [...new Set([...profile.wishlist, ...d.profiles.guest.wishlist])]; d.profiles.guest = emptyProfile(); } d.profiles[id] = profile; d.active = id; }),
    addReminder: reminder => transact(d => { const title = reminder.title.trim(); if (title.length < 2 || title.length > 60) throw new Error('Use a reminder name from 2 to 60 characters.'); if (!/^\d{4}-\d{2}-\d{2}$/.test(reminder.date) || Number.isNaN(Date.parse(reminder.date)) || new Date(reminder.date).toISOString().slice(0, 10) !== reminder.date) throw new Error('Use a valid date in YYYY-MM-DD format.'); d.profiles[d.active].reminders.push({...reminder, title, id:`reminder-${Date.now()}-${Math.random().toString(36).slice(2)}`}); }),
    removeReminder: id => transact(d => { d.profiles[d.active].reminders = d.profiles[d.active].reminders.filter(reminder => reminder.id !== id); }),
    signOut: async () => {if (emailAuth.identity) { await emailAuth.leave(); await transact(d => {d.active = 'guest';}, false); } else await transact(d => {d.active = 'guest';});},
    toggleWish: id => transact(d => { const p = d.profiles[d.active]; p.wishlist = p.wishlist.includes(id) ? p.wishlist.filter(x => x !== id) : [...p.wishlist, id]; }),
    add: item => transact(d => { const p = d.profiles[d.active]; p.lines = addLine(p.lines, item, skus); }),
    quantity: (id, qty) => transact(d => { const p = d.profiles[d.active], lines = p.lines.map(l => l.id === id ? { ...l, quantity: qty } : l); const errors = validateCart(lines, skus); if (errors.length) throw new Error(errors[0]); p.lines = lines; }),
    changeVariant: (id, skuId) => transact(d => { const p=d.profiles[d.active]; p.lines=changeCartVariant(p.lines,id,skuId,skus); }),
    selectAddress: id => transact(d => { const p=d.profiles[d.active]; if(!p.addresses.some(a=>a.id===id))throw new Error('Saved address not found.');p.selectedAddressId=id; }),
    updateAddress: (id,address) => transact(d => { const p=d.profiles[d.active]; if(!p.customer||!p.addresses.some(a=>a.id===id))throw new Error('Address not found for this demo profile.'); const error=validateAddress(address);if(error)throw new Error(error);p.addresses=p.addresses.map(a=>a.id===id?{...address,id}:a); }),
    saveReview: addressId => transact(d => { const p=d.profiles[d.active];p.review=buildDemoReview({lines:p.lines,addresses:p.addresses,addressId,products,skus,schemas,templates:bundleTemplates,id:`local-review-${Date.now()}`,at:new Date().toISOString()}); }),
    remove: id => transact(d => { const p = d.profiles[d.active]; p.lines = p.lines.filter(l => l.id !== id); }),
    saveAddress: address => transact(d => { const p = d.profiles[d.active]; if (!p.customer) throw new Error('Choose a demo profile before saving an address.'); const invalid = validateAddress(address); if (invalid) throw new Error(invalid); const id=`address-${Date.now()}`; p.addresses.push({ ...address, id }); p.selectedAddressId=id; }),
    removeAddress: id => transact(d => { const p = d.profiles[d.active]; p.addresses = p.addresses.filter(a => a.id !== id); if(p.selectedAddressId===id)p.selectedAddressId=p.addresses[0]?.id; }),
  };
  if (fatal) return <Page title="Demo data recovery" navigationEnabled={false}><State title="Could not restore data" message={fatal} /><Button title="Reset local demo data" onPress={() => { void reset().catch(() => setFatal('Local storage is unavailable. Check browser/device storage permissions.')); }} /></Page>;
  if (!loaded || !emailAuth.ready) return <Page navigationEnabled={false}><State title="Restoring your account" message="Loading saved favourites, cart and sign-in…" loading /></Page>;
  return <Context.Provider value={store}><CartCountContext.Provider value={state.profiles[state.active].lines.reduce((n, l) => n + l.quantity, 0)}><DeliverySummaryContext.Provider value={deliverySummary(state.profiles[state.active].addresses.find(a=>a.id===state.profiles[state.active].selectedAddressId)??state.profiles[state.active].addresses[0])}>{children}</DeliverySummaryContext.Provider></CartCountContext.Provider></Context.Provider>;
}
export function useStore() { const value = useContext(Context); if (!value) throw new Error('StoreProvider is required'); return value; }
export function useOptionalStore() { return useContext(Context); }
