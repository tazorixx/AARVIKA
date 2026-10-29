import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import type { Product } from "@/lib/catalog/types";

export default function RelatedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.12em] text-[#d92f66]">Keep exploring</p>
          <h2 className="gift-heading mt-1 text-2xl font-bold text-[#214c72] md:text-3xl">
            You may also like
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            More live gifts from a similar category, picked to help you compare.
          </p>
        </div>
        <Link
          href="/products"
          className="hidden items-center gap-1 text-sm font-bold text-[#2f628f] sm:flex"
        >
          View all <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {products.slice(0, 4).map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group overflow-hidden rounded-[14px] border border-[#e8dfe4] bg-white transition duration-200 hover:-translate-y-1 hover:border-[#d7e4ed] hover:shadow-[0_12px_30px_rgba(33,76,114,0.10)]"
          >
            <div className="relative aspect-square overflow-hidden bg-[#fffafd]">
              {product.thumbnail ? (
                <Image
                  src={product.thumbnail}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="grid h-full place-items-center text-5xl">🎁</div>
              )}
              {product.bestseller && (
                <span className="absolute left-2 top-2 rounded-full bg-[#d92f66] px-2.5 py-1 text-[10px] font-bold text-white">
                  Best Seller
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#172033]">
                {product.title}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-base font-extrabold text-[#172033]">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>
                {product.rating > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#7d5b13]">
                    <Star size={12} fill="currentColor" /> {product.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
