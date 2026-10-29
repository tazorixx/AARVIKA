import {NextResponse} from 'next/server';
import {mobileProjection} from '@/lib/catalog/mobile-projection';
import {adminEmulatorMeta,sharedCatalogueMeta} from '@aarvika/catalogue/api-contracts';
import {catalogueHeaders as headers} from '@/lib/catalog/public-origin';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{const h=headers(request),result=await mobileProjection();return NextResponse.json({meta:process.env.AARVIKA_SHARED==='true'?sharedCatalogueMeta:adminEmulatorMeta,...result},{headers:h});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Catalogue unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
export async function OPTIONS(request:Request){try{return new NextResponse(null,{status:204,headers:headers(request)});}catch{return new NextResponse(null,{status:403});}}
