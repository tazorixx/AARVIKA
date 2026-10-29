import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CatalogListing from "@/components/catalog/CatalogListing";
import { getLiveProducts } from "@/lib/catalog/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getLiveProducts();
  return (
    <>
      <Header />
      <CatalogListing
        title="All Gifts"
        description="Thoughtful gifts for birthdays, anniversaries, weddings, celebrations and everyday surprises."
        products={products}
      />
      <Footer />
    </>
  );
}
