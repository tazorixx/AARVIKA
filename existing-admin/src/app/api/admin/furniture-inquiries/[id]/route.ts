import {NextResponse} from 'next/server';
import {FieldValue} from 'firebase-admin/firestore';
import {getAdminDb} from '@/lib/firebase-admin';
import {requireAdmin,errorResponse} from '@/lib/catalog/http';
import {SUPPORT_ADMIN_ROLES} from '@/lib/support/tickets';
import {parseInquiryUpdate} from '@aarvika/catalogue/admin-contracts';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{await requireAdmin(request,[...SUPPORT_ADMIN_ROLES]);const ref=getAdminDb().collection('furniture_inquiries').doc((await params).id),record=await ref.get();if(!record.exists||record.data()?.demo!==true)throw Error('Not found.');const history=await ref.collection('history').orderBy('revision','desc').get();return NextResponse.json({history:history.docs.map(d=>({id:d.id,...d.data()}))});}catch(e){return errorResponse(e);}}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const caller=await requireAdmin(request,[...SUPPORT_ADMIN_ROLES]),data=parseInquiryUpdate(await request.json()),db=getAdminDb(),ref=db.collection('furniture_inquiries').doc((await params).id);await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists||snap.data()?.demo!==true)throw Error('Not found.');if(snap.data()?.revision!==data.revision)throw Error('Inquiry changed elsewhere. Reload before saving.');const next={...data,revision:data.revision+1};tx.update(ref,{...next,updatedAt:FieldValue.serverTimestamp()});tx.create(ref.collection('history').doc(String(next.revision)),{...next,actorUid:caller.uid,at:new Date().toISOString()});});return NextResponse.json({ok:true,notificationSent:false,paymentsEnabled:false});}catch(e){return errorResponse(e);}}
