import {NextResponse} from 'next/server';
import {getAdminDb} from '@/lib/firebase-admin';
import {requireAdmin,errorResponse} from '@/lib/catalog/http';
import {SUPPORT_ADMIN_ROLES} from '@/lib/support/tickets';
export const runtime='nodejs';
export async function GET(request:Request){try{await requireAdmin(request,[...SUPPORT_ADMIN_ROLES]);const snapshot=await getAdminDb().collection('furniture_inquiries').where('demo','==',true).get();return NextResponse.json({inquiries:snapshot.docs.map(d=>({id:d.id,...d.data()}))});}catch(e){return errorResponse(e);}}
