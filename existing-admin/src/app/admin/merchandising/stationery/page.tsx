"use client";
import MerchandisingManager from "@/components/admin/merchandising/MerchandisingManager";
import type {MerchandisingHero} from "@/lib/merchandising/types";
const HERO:MerchandisingHero={eyebrow:"Stationery",heading:"Ideas start here",description:"Journals, writing tools and creative essentials.",ctaText:"Shop stationery",ctaLink:"/department/stationery",desktopImage:"",mobileImage:"",active:true};
export default function StationeryMerchandisingPage(){return <MerchandisingManager page="stationery" title="Stationery" description="Manage stationery families and collections. Edit paper, size and other specifications on each product." initialHero={HERO} sections={[{type:"category",label:"Stationery categories",relation:"categories"},{type:"collection",label:"Featured collections",relation:"collections"},{type:"featured",label:"Featured essentials"}]}/>;}
