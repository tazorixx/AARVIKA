"use client";
import MerchandisingManager from "@/components/admin/merchandising/MerchandisingManager";
import type {MerchandisingHero} from "@/lib/merchandising/types";

const HERO:MerchandisingHero={eyebrow:"Wedding gifting",heading:"Celebrate every wedding moment",description:"Thoughtful gifts for ceremonies, traditions and the people you love.",ctaText:"Shop wedding gifts",ctaLink:"/department/wedding",desktopImage:"",mobileImage:"",active:true};

export default function WeddingMerchandisingPage(){
 return <MerchandisingManager page="wedding" title="Wedding" description="Manage Wedding cultures, states, functions, budgets and categories. Existing presentation records stay intact." initialHero={HERO} sections={[
  {type:"culture",label:"Wedding cultures"},
  {type:"state",label:"Wedding states"},
  {type:"event",label:"Wedding functions",relation:"occasions"},
  {type:"category",label:"Wedding categories",relation:"categories"},
  {type:"budget",label:"Wedding budgets",numbers:"budget"},
  {type:"featured",label:"Wedding kits and featured gifts"},
 ]}/>;
}
