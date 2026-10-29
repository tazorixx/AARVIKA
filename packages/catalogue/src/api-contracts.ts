import type { Department } from './departments.ts';
import type { BundleTemplate, CatalogService, Category, Ceremony, CeremonyNeed, Collection, PageLayout, PersonalizationSchema, Product, SearchService, Sku, WeddingTradition } from './contracts.ts';

export const API_VERSION = 1 as const;
export const LOCAL_DATASET = 'aarvika-local-demo-v1' as const;
export interface CatalogueMeta {
  contractVersion: 1; dataset: typeof LOCAL_DATASET; demo: true;
  environment: 'local'; firebaseEnabled: false; paymentsEnabled: false; customerData: 'device-only';
}
export const localMeta: CatalogueMeta = { contractVersion: API_VERSION, dataset: LOCAL_DATASET, demo: true, environment: 'local', firebaseEnabled: false, paymentsEnabled: false, customerData: 'device-only' };
export interface AdminEmulatorMeta {
  contractVersion:2;dataset:'aarvika-admin-emulator-v2';demo:true;environment:'local';
  projectId:'demo-aarvika-local';firebaseEnabled:'emulator-only';paymentsEnabled:false;customerData:'device-only';
}
export const adminEmulatorMeta:AdminEmulatorMeta={contractVersion:2,dataset:'aarvika-admin-emulator-v2',demo:true,environment:'local',projectId:'demo-aarvika-local',firebaseEnabled:'emulator-only',paymentsEnabled:false,customerData:'device-only'};
export function validateAdminEmulatorMeta(value:unknown):asserts value is AdminEmulatorMeta {
  if(!value||typeof value!=='object'||Object.entries(adminEmulatorMeta).some(([key,expected])=>(value as Record<string,unknown>)[key]!==expected))throw new CatalogueError('UNSAFE_SOURCE','Only the explicit demo-aarvika-local emulator catalogue is accepted.');
}
export interface SharedCatalogueMeta {
  contractVersion:2;dataset:'aarvika-shared-catalogue-v2';demo:false;environment:'shared';
  projectId:'gift4u-4210f';firebaseEnabled:true;paymentsEnabled:false;customerData:'device-only';
}
export const sharedCatalogueMeta:SharedCatalogueMeta={contractVersion:2,dataset:'aarvika-shared-catalogue-v2',demo:false,environment:'shared',projectId:'gift4u-4210f',firebaseEnabled:true,paymentsEnabled:false,customerData:'device-only'};
export function validateSharedCatalogueMeta(value:unknown):asserts value is SharedCatalogueMeta {
  if(!value||typeof value!=='object'||Object.entries(sharedCatalogueMeta).some(([key,expected])=>(value as Record<string,unknown>)[key]!==expected))throw new CatalogueError('UNSAFE_SOURCE','Catalogue response is not from the approved shared project.');
}
export type NetworkMode = 'normal' | 'slow' | 'failure';
export interface CatalogueSnapshot {
  commercePages?: import('./contracts.ts').CommercePage[];
  meta: CatalogueMeta | AdminEmulatorMeta | SharedCatalogueMeta; departments: Department[]; categories: Category[]; products: Product[]; skus: Sku[];
  schemas: PersonalizationSchema[]; bundleTemplates: BundleTemplate[]; collections: Collection[]; layout: PageLayout;
  clothingColumns: { name: string; children: string[] }[];
  wedding: { traditions: WeddingTradition[]; ceremonies: (Ceremony & { reviewRule: string; source: string; sourceRange: string })[]; ceremonyNeeds: CeremonyNeed[]; weddingLanes: { title: string; types: string[] }[] };
}
export interface CategoryQuery { departmentId?: string; parentId?: string | null; level?: number }
export interface CatalogueAdapter extends CatalogService, SearchService {
  readonly mode: 'fixture' | 'local-api' | 'admin-emulator' | 'shared-api' | 'staging';
  bootstrap(): Promise<CatalogueSnapshot>;
  departments(): Promise<Department[]>;
  categories(query?: CategoryQuery): Promise<Category[]>;
  variants(productId: string): Promise<Sku[]>;
  getSku(id: string): Promise<Sku | null>;
  collections(): Promise<Collection[]>;
  setNetworkMode(mode: NetworkMode): void;
}
export interface ApiEnvelope<T> { meta: CatalogueMeta; data: T }
export interface ApiError { error: { code: string; message: string; retryable: boolean } }
export class CatalogueError extends Error {
  readonly code: string; readonly retryable: boolean;
  constructor(code: string, message: string, retryable = false) { super(message); this.name = 'CatalogueError'; this.code = code; this.retryable = retryable; }
}
export function validateMeta(value: unknown): asserts value is CatalogueMeta {
  if (!value || typeof value !== 'object') throw new CatalogueError('INVALID_RESPONSE', 'Invalid local API metadata.');
  const m = value as CatalogueMeta;
  if (m.contractVersion !== 1 || m.dataset !== LOCAL_DATASET || m.demo !== true || m.environment !== 'local' || m.firebaseEnabled !== false || m.paymentsEnabled !== false || m.customerData !== 'device-only') throw new CatalogueError('UNSAFE_SOURCE', 'This build accepts only the isolated local demo API.');
}
// Deliberately numeric loopback only: no DNS, LAN, cloud, userinfo, query or proxy URLs.
export function validateLocalBaseUrl(input: string) {
  const u = new URL(input);
  if (u.protocol !== 'http:' || u.hostname !== '127.0.0.1' || !u.port || u.username || u.password || u.search || u.hash || u.pathname !== '/') throw new CatalogueError('UNSAFE_URL', 'Local API must use http://127.0.0.1:<port> with no path or credentials.');
  return u.origin;
}
