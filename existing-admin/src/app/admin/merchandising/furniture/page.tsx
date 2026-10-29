"use client";
import MerchandisingManager from "@/components/admin/merchandising/MerchandisingManager";
import type {MerchandisingHero} from "@/lib/merchandising/types";
const HERO:MerchandisingHero={eyebrow:"Furniture",heading:"Thoughtful spaces",description:"Explore pieces for home and work.",ctaText:"Explore furniture",ctaLink:"/department/furniture",desktopImage:"",mobileImage:"",active:true};
export default function FurnitureMerchandisingPage(){return <MerchandisingManager page="furniture" title="Furniture" description="Manage Home and Commercial categories and collections. Edit dimensions and inquiry settings on each product." initialHero={HERO} sections={[{type:"category",label:"Furniture categories",relation:"categories"},{type:"collection",label:"Featured collections",relation:"collections"},{type:"featured",label:"Featured pieces"}]}/>;}
