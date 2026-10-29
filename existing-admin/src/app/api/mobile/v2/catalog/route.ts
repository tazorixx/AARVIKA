import {NextResponse} from 'next/server';
import {mobileProjection} from '@/lib/catalog/mobile-projection';
import {adminEmulatorMeta,sharedCatalogueMeta} from '@aarvika/catalogue/api-contracts';
export const runtime='nodejs';export const dynamic='force-dynamic';
function headers(request:Request){const origin=request.headers.get('origin');if(origin){const u=new URL(origin);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||!u.port)throw Error('Only a numeric loopback app origin is allowed.');}return {'Cache-Control':'no-store','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept, Content-Type'};}
export async function GET(request:Request){try{const h=headers(request),result=await mobileProjection();return NextResponse.json({meta:process.env.AARVIKA_SHARED==='true'?sharedCatalogueMeta:adminEmulatorMeta,...result},{headers:h});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Catalogue unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
export async function OPTIONS(request:Request){try{return new NextResponse(null,{status:204,headers:headers(request)});}catch{return new NextResponse(null,{status:403});}}
