import ProductEditor from "@/components/admin/products/ProductEditor";
export default async function Page({params}:{params:Promise<{id:string}>}){return <ProductEditor productId={(await params).id}/>;}
