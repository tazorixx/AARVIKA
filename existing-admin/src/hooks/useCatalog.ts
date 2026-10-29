"use client";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog/types";

export type CatalogProduct = Product;
export type CatalogItem = { id:string; name:string; slug:string; image?:string; description?:string; sortOrder:number; active:boolean };
export type CatalogData = { products:CatalogProduct[]; categories:CatalogItem[]; occasions:CatalogItem[]; recipients:CatalogItem[]; collections:CatalogItem[] };
let cache: CatalogData | null = null;
export function useCatalog(){const [data,setData]=useState<CatalogData|null>(cache);const [loading,setLoading]=useState(!cache);const [error,setError]=useState('');useEffect(()=>{if(cache)return;fetch('/api/catalog').then(r=>{if(!r.ok)throw new Error('Unable to load catalog.');return r.json()}).then(d=>{cache=d;setData(d)}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);return {data,loading,error};}
