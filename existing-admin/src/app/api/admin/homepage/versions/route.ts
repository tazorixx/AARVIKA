import {NextResponse} from 'next/server';
import {requireCatalogAdmin,errorResponse} from '@/lib/catalog/http';
import {getAdminDb} from '@/lib/catalog/server';
import {publishHomepage} from '@/lib/admin/homepage-publication';
export const runtime='nodejs';
export async function GET(request:Request){try{await requireCatalogAdmin(request);const db=getAdminDb(),[state,history]=await Promise.all([db.collection('homepage_catalogue').doc('state').get(),db.collection('homepage_versions').orderBy('version','desc').limit(30).get()]);return NextResponse.json({version:state.data()?.version??0,history:history.docs.map(d=>({version:d.data().version,sectionCount:d.data().sections.length,action:d.data().action??'baseline'}))});}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{const caller=await requireCatalogAdmin(request);const body=await request.json();if(!['rollback','publish-layout'].includes(body.action))throw Error('Unsupported homepage action.');const version=await publishHomepage({action:body.action,version:body.version,expectedVersion:body.expectedVersion,actorUid:caller.uid});return NextResponse.json({version});}catch(e){return errorResponse(e);}}
