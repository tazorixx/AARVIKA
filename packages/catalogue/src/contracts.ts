import type {VisualMedia} from './visual-commerce.ts';
import type { DepartmentId } from './departments.ts';
export type Money = { amount: number; currency: 'INR' }; // integer paise
export interface Category { visual?:VisualMedia; page?:{hero?:VisualMedia;banner?:VisualMedia;featuredProductIds:string[];featuredCategoryIds:string[]}; furnitureSector?:'Home'|'Commercial'|''; id: string; departmentId: DepartmentId; parentId: string | null; level: 1 | 2 | 3; name: string; active: boolean }
export interface Collection { visual?:VisualMedia; id: string; title: string; productIds: string[] }
export interface Inventory { skuId: string; available: number; version: number; demo: boolean }
export interface Sku { id: string; productId: string; label: string; attributes: Record<string, string>; price: Money; inventory: Inventory; image?: { glyph: string; art: string; alt: string } }
export type PersonalizationField = { key: string; label: string; kind: 'text' | 'photo' | 'choice'; required: boolean; maxLength?: number; choices?: string[] };
export interface PersonalizationSchema { id: string; fields: PersonalizationField[]; preview: 'template'; photoMaxBytes: number; photoMimeTypes: string[] }
export interface Product { media?: {path:string;alt:string}[]; id: string; title: string; description: string; categoryIds: string[]; departmentIds: DepartmentId[]; collectionIds: string[]; occasionIds: string[]; recipientIds: string[]; cultureIds: string[]; ceremonyIds: string[]; productType: string; style: string; material: string; color: string; glyph: string; art: string; specs: Record<string, string>; skuIds: string[]; personalizationSchemaId?: string; bundleEligible: boolean; bundleUnits: number; purchaseMode: 'buy' | 'inquiry'; demo: boolean; discovery?: { ageMin?: number; ageMax?: number; interests?: string[]; yearMin?: number; yearMax?: number; deliveryVerified?: boolean }; prebuiltBundle?: Omit<CustomBundle, 'previewTotal'>; sizeGuide?: { unit: 'cm'; rows: { size: string; chest: number; length: number }[]; instructions: string }; returnsPolicy?: string }
export interface FacetDefinition { key: string; label: string; type: 'choice' | 'range'; options?: string[] }
export interface SearchQuery { text?: string; departmentId?: DepartmentId; categoryId?: string; recipient?: string; minPrice?: number; maxPrice?: number; color?: string; material?: string; occasion?: string; age?: number; year?: number; interest?: string; productType?: string; personalizedOnly?: boolean; bundleOnly?: boolean; verifiedDeliveryOnly?: boolean; collectionId?: string; attributes?: Record<string, string>; inStockOnly?: boolean; includeUnpriced?: boolean; maxWidth?: number; maxDepth?: number; maxHeight?: number; sort?: 'relevance' | 'price-asc' | 'price-desc'; cursor?: string; limit?: number }
export interface SearchResult { products: Product[]; total: number; nextCursor?: string }
export interface DeliveryPolicy { id: string; mode: 'unverified' | 'demo'; serviceable: boolean; message: string }
export interface Section { mobileImagePath?:string; pageKey?:string;imageAlt?:string;imageFit?:'contain'|'cover';illustration?:VisualMedia['illustration']; subtitle?:string;buttonLabel?:string;imagePath?:string;productIds?:string[];categoryId?:string;limit?:number;shortcuts?:{title:string;action:string;imagePath?:string;imageAlt?:string}[]; id: string; type: 'hero' | 'departments' | 'products' | 'collection' | 'combo'; title: string; dataSourceRef: string; order: number; enabled: boolean; responsivePresentation: 'compact' | 'grid'; action: string; scheduledDates?: { start: string; end: string } }
export interface PageLayout { id: string; version: number; sections: Section[] }
export interface MediaAsset { id: string; uri: string; mimeType: string; bytes: number; ownerId: string; localOnly: boolean }
export type PersonalizationValues = Record<string, string>;
export interface BundleTemplate { id: string; title: string; minItems: number; maxItems: number; capacity: number; packagingFee: number; allowedProductTypes: string[]; requiredProductTypes?: string[] }
export interface BundleComponent { skuId: string; quantity: number; personalization: PersonalizationValues; media: MediaAsset[] }
export interface CustomBundle { templateId: string; components: BundleComponent[]; packaging: string; message: string; recipient?: string; occasion?: string; budgetLimit?: number; previewTotal: Money }
export interface CartLine { id: string; skuId?: string; quantity: number; personalization: PersonalizationValues; media: MediaAsset[]; bundle?: CustomBundle; giftMessage: string; previewUnitPrice: Money }
export interface Cart { lines: CartLine[]; revision: number }
export interface Customer { id: string; name: string; mode: 'local-demo' | 'staging' }
export interface Address { id: string; name: string; phone: string; line: string; city: string; state: string; pincode: string }
export type PaymentStatus = 'not-started' | 'pending' | 'verified' | 'failed' | 'cancelled';
export interface Order { id: string; customerId: string; lines: CartLine[]; total: Money; paymentStatus: PaymentStatus; status: string }
export interface QuoteRequest { id: string; customerId: string; dimensions: string; material: string; budget: Money; mediaIds: string[]; status: 'submitted' | 'reviewing' | 'quoted' | 'local-draft' | 'withdrawn' }
export interface WeddingTradition { id: string; name: string; faith: string; regions: string[]; ceremonyIds: string[]; reviewStatus: 'research-template' | 'reviewed'; source: string }
export interface Ceremony { id: string; traditionId: string; name: string; stage: string; optional: boolean; needs: string[] }
export interface CeremonyNeed { id: string; ceremonyId: string; productType: string; eligibleSkuIds: string[]; familyApprovalRequired: boolean }
export interface CatalogService { getProduct(id: string): Promise<Product | null>; categories(): Promise<Category[]>; layout(): Promise<PageLayout> }
export interface SearchService { search(query: SearchQuery): Promise<SearchResult>; suggestions(text: string): Promise<string[]> }
export interface CustomerService { signIn(name: string): Promise<Customer>; signOut(): Promise<void> }
export interface MediaService { select(ownerId: string): Promise<MediaAsset | null> }
export interface PersonalizationService { validate(schema: PersonalizationSchema, values: PersonalizationValues, media: MediaAsset[]): string[] }
export interface BundleService { preview(bundle: Omit<CustomBundle, 'previewTotal'>): Money }
export interface CartService { validate(lines: CartLine[]): string[] }
export interface CheckoutService { available: boolean; reason: string }
export interface OrdersService { list(): Promise<Order[]> }
export interface QuoteService { submit(request: Omit<QuoteRequest, 'id' | 'status'>): Promise<QuoteRequest> }

export interface CommercePage {key:string;sections:Section[]}
