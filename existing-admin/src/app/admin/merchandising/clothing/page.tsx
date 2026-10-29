"use client";
import MerchandisingManager from "@/components/admin/merchandising/MerchandisingManager";
import type {MerchandisingHero} from "@/lib/merchandising/types";
const HERO:MerchandisingHero={eyebrow:"Clothing",heading:"Clothing for every occasion",description:"Explore styles, sizes and fabrics.",ctaText:"Shop clothing",ctaLink:"/department/clothing",desktopImage:"",mobileImage:"",active:true};
export default function ClothingMerchandisingPage(){return <MerchandisingManager page="clothing" title="Clothing" description="Manage clothing categories and collections. Edit sizes, colours and fabric on each product." initialHero={HERO} sections={[{type:"category",label:"Clothing categories",relation:"categories"},{type:"collection",label:"Featured collections",relation:"collections"},{type:"featured",label:"Featured styles"}]}/>;}
