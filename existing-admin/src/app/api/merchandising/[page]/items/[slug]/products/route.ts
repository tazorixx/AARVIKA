import { NextResponse } from 'next/server';

import type { Product, TaxonomyBase } from '@/lib/catalog/types';
import { getAdminDb } from '@/lib/firebase-admin';
import { getMerchandising, serializeMerchandising } from '@/lib/merchandising/server';
import { productMatchesMerchandisingItem, productsForMerchandisingPage } from '@/lib/merchandising/product-query';
import type { MerchandisingItem, MerchandisingPage } from '@/lib/merchandising/types';

export const runtime = 'nodejs';

const PAGES: MerchandisingPage[] = ['wedding', 'birthday', 'anniversary', 'hampers', 'personalised', 'lifestyle'];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ page: string; slug: string }> },
) {
  const { page: rawPage, slug: rawSlug } = await params;
  if (!PAGES.includes(rawPage as MerchandisingPage)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const slug = rawSlug.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Collection not found.' }, { status: 404 });
  }

  const page = rawPage as MerchandisingPage;
  const merchandising = await getMerchandising(page);
  const item = (merchandising.items as MerchandisingItem[]).find((candidate) =>
    candidate.active !== false && (candidate.id === slug || candidate.slug?.toLowerCase() === slug),
  );
  if (!item) {
    return NextResponse.json({ error: 'Collection not found.' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get('limit') || 200);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), 200) : 200;

  const db = getAdminDb();
  const [productsSnap, categoriesSnap, occasionsSnap, recipientsSnap, collectionsSnap] = await Promise.all([
    db.collection('products').where('status', '==', 'live').limit(200).get(),
    db.collection('categories').where('active', '==', true).orderBy('sortOrder').limit(100).get(),
    db.collection('occasions').where('active', '==', true).orderBy('sortOrder').limit(100).get(),
    db.collection('recipients').where('active', '==', true).orderBy('sortOrder').limit(100).get(),
    db.collection('collections').where('active', '==', true).orderBy('sortOrder').limit(100).get(),
  ]);

  const categories = categoriesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as TaxonomyBase[];
  const occasions = occasionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as TaxonomyBase[];
  const recipients = recipientsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as TaxonomyBase[];
  const collections = collectionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as TaxonomyBase[];
  const liveProducts = productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product);

  const products = productsForMerchandisingPage(page, liveProducts, occasions, collections)
    .filter((product) => productMatchesMerchandisingItem(product, item))
    .slice(0, limit);

  return NextResponse.json(serializeMerchandising({
    page: merchandising.page,
    item,
    products,
    categories,
    occasions,
    recipients,
    collections,
  }), {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
