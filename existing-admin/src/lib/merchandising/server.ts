import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import {parseCategoryInput, parseTaxonomyInput} from "@/lib/catalog/validation";
import {prepareCategory} from "@/lib/catalog/authoring-server";
import {assertSlugAvailable, slugLockRef, writeSlugLock} from "@/lib/catalog/slugs";
import {isImageKitReference} from '@aarvika/catalogue/media-policy';
import type {
  AnniversaryItemType,
  BirthdayItemType,
  MerchandisingHero,
  MerchandisingItem,
  MerchandisingItemType,
  MerchandisingPage,
  WeddingItemType,
} from "./types";

export const MERCHANDISING_COLLECTION = "merchandising_pages";

export const DEFAULT_WEDDING_HERO: MerchandisingHero = {
  eyebrow: "Wedding gifting",
  heading: "Celebrate every wedding moment",
  description: "Thoughtful gifts for ceremonies, traditions and the people you love.",
  ctaText: "Shop wedding gifts",
  ctaLink: "/wedding",
  desktopImage: "",
  mobileImage: "",
  active: true,
};

const DEFAULT_HEROES: Record<MerchandisingPage, MerchandisingHero> = {
  wedding: DEFAULT_WEDDING_HERO,
  birthday: {
    eyebrow: "Birthday gifting",
    heading: "Make every birthday unforgettable",
    description: "Thoughtful birthday gifts for every age, personality and budget.",
    ctaText: "Shop birthday gifts",
    ctaLink: "/birthday",
    desktopImage: "",
    mobileImage: "",
    active: true,
  },
  anniversary: {
    eyebrow: "Anniversary gifting",
    heading: "Celebrate the years you share",
    description: "Meaningful anniversary gifts for every milestone and loved one.",
    ctaText: "Shop anniversary gifts",
    ctaLink: "/anniversary",
    desktopImage: "",
    mobileImage: "",
    active: true,
  },
  hampers: {
    eyebrow: "Gift hampers",
    heading: "Beautifully curated hampers",
    description: "Thoughtful gift hampers for every celebration and occasion.",
    ctaText: "Shop hampers",
    ctaLink: "/hampers",
    desktopImage: "",
    mobileImage: "",
    active: true,
  },
  personalised: {
    eyebrow: "Personalised gifting",
    heading: "Make every gift personal",
    description: "Create meaningful personalised gifts made especially for them.",
    ctaText: "Shop personalised gifts",
    ctaLink: "/personalised",
    desktopImage: "",
    mobileImage: "",
    active: true,
  },
  clothing: { eyebrow: "Clothing", heading: "Clothing for every occasion", description: "Explore styles, sizes and fabrics.", ctaText: "Shop clothing", ctaLink: "/department/clothing", desktopImage: "", mobileImage: "", active: true },
  stationery: { eyebrow: "Stationery", heading: "Ideas start here", description: "Journals, writing tools and creative essentials.", ctaText: "Shop stationery", ctaLink: "/department/stationery", desktopImage: "", mobileImage: "", active: true },
  furniture: { eyebrow: "Furniture", heading: "Thoughtful spaces", description: "Explore pieces for home and work.", ctaText: "Explore furniture", ctaLink: "/department/furniture", desktopImage: "", mobileImage: "", active: true },
  lifestyle: {
    eyebrow: "Lifestyle gifting",
    heading: "Gifts for every personality",
    description: "Discover gifts curated around interests, personalities and style.",
    ctaText: "Shop lifestyle gifts",
    ctaLink: "/lifestyle",
    desktopImage: "",
    mobileImage: "",
    active: true,
  },
};

const ALLOWED_TYPES: Record<MerchandisingPage, MerchandisingItemType[]> = {
  wedding: ["event", "category", "budget", "culture", "state", "featured"],
  birthday: ["recipient", "ageGroup", "category", "giftType", "budget", "featured"],
  anniversary: ["category", "lovedOne", "milestone", "budget", "featured"],
  hampers: ["collection", "featured", "curated"],
  personalised: ["category", "recipient", "collection", "promotion", "featured"],
  clothing: ["category", "collection", "featured"],
  stationery: ["category", "collection", "featured"],
  furniture: ["category", "collection", "featured"],
  lifestyle: ["personality", "brand"],
};

const RELATION_COLLECTIONS: Partial<Record<MerchandisingPage, Partial<Record<MerchandisingItemType, "categories" | "occasions" | "recipients" | "collections">>>> = {
  wedding: { event: "occasions", category: "categories" },
  birthday: { recipient: "recipients", category: "categories" },
  anniversary: { category: "categories", lovedOne: "recipients" },
  hampers: { collection: "collections" },
  personalised: { category: "categories", recipient: "recipients", collection: "collections" },
  clothing: { category: "categories", collection: "collections" },
  stationery: { category: "categories", collection: "collections" },
  furniture: { category: "categories", collection: "collections" },
};

export function pageRef(page: MerchandisingPage) {
  return getAdminDb().collection(MERCHANDISING_COLLECTION).doc(page);
}

export function itemsRef(page: MerchandisingPage) {
  return pageRef(page).collection("items");
}

export function normalizeMerchandisingItemInput(page: MerchandisingPage, body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) throw new Error("Name is required.");

  const slugValue = typeof body.slug === "string" ? body.slug.trim() : name;
  const slug = slugValue
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  if (!slug) throw new Error("A valid slug is required.");

  const type = typeof body.type === "string" ? body.type : "";
  if (!ALLOWED_TYPES[page].includes(type as MerchandisingItemType)) {
    throw new Error(`Invalid ${page} merchandising item type.`);
  }

  const numberValue = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const optionalNumber = (value: unknown) => value === undefined || value === "" ? undefined : numberValue(value);
  const clean = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;
  if(process.env.AARVIKA_SHARED==='true'&&clean(body.image)&&!isImageKitReference(body.image))throw Error('Use a public ImageKit image URL.');

  return {
    page,
    type: type as MerchandisingItemType,
    name,
    slug,
    subtitle: clean(body.subtitle),
    description: clean(body.description),
    image: clean(body.image),
    relatedId: clean(body.relatedId),
    featuredProductIds:Array.isArray(body.featuredProductIds)?[...new Set(body.featuredProductIds.filter((id):id is string=>typeof id==='string'&&!!id.trim()).map(id=>id.trim()))].slice(0,20):[],
    min: optionalNumber(body.min),
    max: optionalNumber(body.max),
    years: optionalNumber(body.years),
    minimumAge: optionalNumber(body.minimumAge),
    maximumAge: optionalNumber(body.maximumAge),
    sortOrder: numberValue(body.sortOrder),
    active: body.active !== false,
  };
}

export function normalizeItemInput(body: Record<string, unknown>) {
  return normalizeMerchandisingItemInput("wedding", body) as {
    page: "wedding";
    type: WeddingItemType;
    name: string;
    slug: string;
    subtitle: string | undefined;
    description: string | undefined;
    image: string | undefined;
    relatedId: string | undefined;
    featuredProductIds: string[];
    min: number | undefined;
    max: number | undefined;
    years: number | undefined;
    minimumAge: number | undefined;
    maximumAge: number | undefined;
    sortOrder: number;
    active: boolean;
  };
}

export async function getMerchandising(page: MerchandisingPage) {
  const [pageSnap, itemsSnap] = await Promise.all([
    pageRef(page).get(),
    itemsRef(page).orderBy("sortOrder").get(),
  ]);
  const config = pageSnap.exists
    ? { id: pageSnap.id, ...pageSnap.data() }
    : { id: page, page, hero: DEFAULT_HEROES[page] };
  return {
    page: config,
    items: itemsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  };
}

export async function getWeddingMerchandising() {
  return getMerchandising("wedding");
}

export async function getBirthdayMerchandising() {
  return getMerchandising("birthday");
}

export async function getAnniversaryMerchandising() {
  return getMerchandising("anniversary");
}

function removeUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as T;
}

export async function saveMerchandisingHero(page: MerchandisingPage, hero: MerchandisingHero) {
  if(process.env.AARVIKA_SHARED==='true'&&[hero.desktopImage,hero.mobileImage].some(image=>image&&!isImageKitReference(image)))throw Error('Use public ImageKit URLs for hero images.');
  const safeHero = removeUndefinedFields(hero as unknown as Record<string, unknown>);
  await pageRef(page).set(
    { page, hero: safeHero, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function saveWeddingHero(hero: MerchandisingHero) {
  await saveMerchandisingHero("wedding", hero);
}

async function assertMerchandisingRelation(
  page: MerchandisingPage,
  data: { type: MerchandisingItemType; relatedId?: string },
) {
  const collection = RELATION_COLLECTIONS[page]?.[data.type];
  if (!collection) return;
  const label = collection === "categories"
    ? "category"
    : collection === "occasions"
      ? "occasion"
      : collection === "recipients"
        ? "recipient"
        : "collection";

  if (!data.relatedId) {
    throw new Error(`Select the existing ${label} this item represents.`);
  }

  const related = await getAdminDb().collection(collection).doc(data.relatedId).get();
  if (!related.exists) {
    throw new Error(`The selected ${label} no longer exists.`);
  }
  if (related.data()?.active === false) {
    throw new Error(`The selected ${label} is archived. Restore it or choose an active ${label}.`);
  }
}

export async function createMerchandisingItem(
  page: MerchandisingPage,
  data: ReturnType<typeof normalizeMerchandisingItemInput> | ReturnType<typeof normalizeItemInput>,
) {
  await assertMerchandisingRelation(page, data);
  const db=getAdminDb(),ref=itemsRef(page).doc(),lock=pageRef(page).collection('item_slug_locks').doc(`${data.type}_${data.slug}`);
  await db.runTransaction(async tx=>{
    const relation=RELATION_COLLECTIONS[page]?.[data.type];
    if(relation&&data.relatedId){const selected=await tx.get(db.collection(relation).doc(data.relatedId));if(!selected.exists||selected.data()?.active===false)throw Error('The selected catalogue record is unavailable. Choose an active record.');}
    for(const id of data.featuredProductIds){const product=await tx.get(db.collection('products').doc(id));if(!product.exists||product.data()?.status!=='live')throw Error('Choose only published products for this section.');}
    const [held,matching]=await Promise.all([tx.get(lock),tx.get(itemsRef(page).where('slug','==',data.slug))]);
    if(held.exists||matching.docs.some(doc=>doc.data().type===data.type))throw Error('This section already has an item with that name or slug.');
    tx.set(lock,{itemId:ref.id,type:data.type,slug:data.slug});
    tx.set(ref,{...removeUndefinedFields(data as Record<string,unknown>),createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  });
  return ref.id;
}

/** Creates the catalogue master and its presentation together; a failed validation writes neither. */
export async function createMerchandisingItemWithMaster(
  page:MerchandisingPage,
  data:ReturnType<typeof normalizeMerchandisingItemInput>,
  masterInput:Record<string,unknown>,
) {
  const collection=RELATION_COLLECTIONS[page]?.[data.type];
  if(!collection)throw new Error('This section does not use a catalogue master record.');
  const department=page==='personalised'?'personalized':page;
  const master=collection==='categories'
    ?parseCategoryInput({...masterInput,slug:`${department}-${String(masterInput.name||'')}`,departmentId:department})
    :parseTaxonomyInput(masterInput);
  const db=getAdminDb(),masterRef=db.collection(collection).doc(),itemRef=itemsRef(page).doc();
  const lock=slugLockRef(db,collection,master.slug),itemLock=pageRef(page).collection('item_slug_locks').doc(`${data.type}_${data.slug}`);
  await db.runTransaction(async tx=>{
    const lockSnap=await tx.get(lock);
    assertSlugAvailable(lockSnap,masterRef.id);
    const sameSlug=await tx.get(db.collection(collection).where('slug','==',master.slug));
    if(!sameSlug.empty)throw new Error('A matching catalogue record already exists. Select it instead.');
    const sameName=await tx.get(db.collection(collection).where('name','==',master.name));
    if(sameName.docs.some(doc=>collection!=='categories'||doc.data().departmentId===department&&String(doc.data().parentId||'')===String('parentId' in master?master.parentId||'':'')))throw new Error('This name is already used here. Select the existing record instead.');
    const sameItem=await tx.get(itemsRef(page).where('slug','==',data.slug));
    const heldItem=await tx.get(itemLock);
    if(heldItem.exists||sameItem.docs.some(doc=>doc.data().type===data.type))throw new Error('This section already has an item with that name or slug.');
    for(const id of data.featuredProductIds){const product=await tx.get(db.collection('products').doc(id));if(!product.exists||product.data()?.status!=='live')throw Error('Choose only published products for this section.');}
    let prepared=master;
    if(collection==='categories'){
      const category=master as ReturnType<typeof parseCategoryInput>;
      if(category.parentId){const parent=await tx.get(db.collection('categories').doc(category.parentId));if(!parent.exists||parent.data()?.active===false||parent.data()?.departmentId!==department)throw new Error('Choose an active parent in this department.');}
      prepared={...category,...await prepareCategory(tx,db,masterRef.id,category)};
    }
    writeSlugLock(tx,db,collection,master.slug,masterRef.id);
    tx.set(itemLock,{itemId:itemRef.id,type:data.type,slug:data.slug});
    tx.set(masterRef,{...prepared,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
    tx.set(itemRef,{...removeUndefinedFields({...data,relatedId:masterRef.id}),createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  });
  return {id:itemRef.id,masterId:masterRef.id};
}

export async function updateMerchandisingItem(
  page: MerchandisingPage,
  id: string,
  data: Partial<ReturnType<typeof normalizeMerchandisingItemInput>> | Partial<ReturnType<typeof normalizeItemInput>>,
) {
  const db=getAdminDb(),ref=itemsRef(page).doc(id);
  await db.runTransaction(async tx=>{
    const snap=await tx.get(ref);
    if(!snap.exists)throw new Error('Not found.');
    const previous=snap.data() as MerchandisingItem;
    const type=data.type??previous.type,slug=data.slug??previous.slug,relatedId=data.relatedId??previous.relatedId;
    const relation=RELATION_COLLECTIONS[page]?.[type];
    if(relation){
      if(!relatedId)throw new Error('Choose a catalogue record for this item.');
      const selected=await tx.get(db.collection(relation).doc(relatedId));
      if(!selected.exists||selected.data()?.active===false)throw new Error('The selected catalogue record is unavailable.');
    }
    for(const productId of data.featuredProductIds??previous.featuredProductIds??[]){
      const product=await tx.get(db.collection('products').doc(productId));
      if(!product.exists||product.data()?.status!=='live')throw Error('Choose only published products for this section.');
    }
    const newLock=pageRef(page).collection('item_slug_locks').doc(`${type}_${slug}`);
    const oldLock=pageRef(page).collection('item_slug_locks').doc(`${previous.type}_${previous.slug}`);
    const held=await tx.get(newLock);
    const matching=await tx.get(itemsRef(page).where('slug','==',slug));
    if((held.exists&&held.data()?.itemId!==id)||matching.docs.some(doc=>doc.id!==id&&doc.data().type===type))throw Error('This section already has an item with that name or slug.');
    const changed=oldLock.path!==newLock.path;
    const previousHeld=changed?await tx.get(oldLock):held;
    if(changed&&previousHeld.exists&&previousHeld.data()?.itemId===id)tx.delete(oldLock);
    tx.set(newLock,{itemId:id,type,slug});
    tx.update(ref,{...removeUndefinedFields(data as Record<string,unknown>),updatedAt:FieldValue.serverTimestamp()});
  });
}

export async function archiveMerchandisingItem(page: MerchandisingPage, id: string) {
  const ref = itemsRef(page).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Not found.");
  await ref.update({ active: false, updatedAt: FieldValue.serverTimestamp() });
}

export async function createWeddingItem(data: ReturnType<typeof normalizeItemInput>) {
  return createMerchandisingItem("wedding", data);
}

export async function updateWeddingItem(id: string, data: Partial<ReturnType<typeof normalizeItemInput>>) {
  return updateMerchandisingItem("wedding", id, data);
}

export async function archiveWeddingItem(id: string) {
  return archiveMerchandisingItem("wedding", id);
}

export function serializeMerchandising(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(serializeMerchandising);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof (record as { toDate?: unknown }).toDate === "function") {
      return (record as { toDate: () => Date }).toDate().toISOString();
    }
    return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, serializeMerchandising(item)]));
  }
  return value;
}

export type { AnniversaryItemType, BirthdayItemType };
