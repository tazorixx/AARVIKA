import {NextResponse} from 'next/server';
import {requireCatalogAdmin,errorResponse} from '@/lib/catalog/http';
import {getAdminDb} from '@/lib/catalog/server';
export const runtime='nodejs';
export async function GET(request:Request){try{await requireCatalogAdmin(request);const snapshot=await getAdminDb().collection('skus').where('active','==',true).get();return NextResponse.json(snapshot.docs.map(d=>({id:d.id,...d.data()})));}catch(e){return errorResponse(e);}}
