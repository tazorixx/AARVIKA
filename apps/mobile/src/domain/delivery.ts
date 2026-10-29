import type {Address} from './contracts.ts';
export interface Coordinates { latitude: number; longitude: number }
export interface DeliveryAddress extends Address { label?: 'Home'|'Work'|'Other'; flat?: string; landmark?: string; locality?: string; coordinates?: Coordinates }
export type DeliveryDraft = Omit<DeliveryAddress,'id'>;
export function validCoordinates(point: Coordinates) { return Number.isFinite(point.latitude)&&Number.isFinite(point.longitude)&&Math.abs(point.latitude)<=90&&Math.abs(point.longitude)<=180; }
export function deliverySummary(address?: DeliveryAddress) { return address ? `${address.label||'Deliver to'} · ${address.locality||address.city} ${address.pincode}` : 'Choose delivery location'; }
export const emptyDelivery: DeliveryDraft = {name:'',phone:'',line:'',city:'',state:'',pincode:'',label:'Home',flat:'',landmark:'',locality:''};
