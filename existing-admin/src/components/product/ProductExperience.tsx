import type { Product } from "@/lib/catalog/types";
import Breadcrumb from "@/components/Breadcrumb";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import RelatedProducts from "./RelatedProducts";
import ProductReviews from "./ProductReviews";

export default function ProductExperience({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  return (
    <>
      <Header />

      <Breadcrumb currentPage={product.title} />

      <main className="bg-[#fffafd] pb-16">
        <div className="mx-auto max-w-7xl px-4 pt-5 lg:px-8 lg:pt-9">
          <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(420px,.96fr)] lg:gap-11">
            <ProductGallery product={product} />

            <ProductInfo product={product} />
          </section>

          <section className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-[16px] border border-[#e6edf2] bg-white p-5 shadow-[0_7px_22px_rgba(33,76,114,0.035)]">
              <p className="text-sm font-bold text-[#214c72]">
                Thoughtful gifting
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Carefully selected gifts for moments that deserve a
                little more thought.
              </p>
            </div>

            <div className="rounded-[16px] border border-[#e6edf2] bg-white p-5 shadow-[0_7px_22px_rgba(33,76,114,0.035)]">
              <p className="text-sm font-bold text-[#214c72]">
                Easy to personalise
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Add a personal touch wherever this gift supports
                customisation.
              </p>
            </div>

            <div className="rounded-[16px] border border-[#e6edf2] bg-white p-5 shadow-[0_7px_22px_rgba(33,76,114,0.035)]">
              <p className="text-sm font-bold text-[#214c72]">
                Delivery checked before you buy
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Enter your pincode to see the estimated delivery window
                for this product.
              </p>
            </div>
          </section>

          <section className="mt-12 rounded-[16px] border border-[#e8dfe4] bg-white p-6 shadow-[0_8px_26px_rgba(33,76,114,0.04)] md:p-8">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-[#d92f66]">
              The story behind the gift
            </p>

            <h2 className="gift-heading mt-1 text-2xl font-bold text-[#214c72] md:text-3xl">
              About this gift
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
              {product.description ||
                product.shortDescription ||
                "A thoughtful Gift4U selection."}
            </p>
          </section>

          <ProductReviews productId={product.id} />

          <RelatedProducts products={related} />
        </div>
      </main>

      <Footer />
    </>
  );
}