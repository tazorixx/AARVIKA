"use client";

import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/catalog/types";

export default function ProductGallery({ product }: { product: Product }) {
  const images = product.images.length
    ? product.images
    : [{ url: product.thumbnail, alt: product.title }];
  const [active, setActive] = useState(0);

  function move(direction: number) {
    setActive((current) => (current + direction + images.length) % images.length);
  }

  const current = images[active];

  return (
    <div className="lg:sticky lg:top-24">
      <div className="relative overflow-hidden rounded-[14px] border border-[#e8dfe4] bg-white shadow-[0_10px_30px_rgba(33,76,114,0.06)]">
        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          {product.bestseller && (
            <span className="rounded-full bg-[#d92f66] px-3 py-1.5 text-[11px] font-bold text-white">
              Best Seller
            </span>
          )}
          {product.newArrival && (
            <span className="rounded-full bg-[#2f628f] px-3 py-1.5 text-[11px] font-bold text-white">
              New Arrival
            </span>
          )}
        </div>

        <div className="relative aspect-square bg-[#fffafd]">
          {current?.url ? (
            <img
              src={current.url}
              alt={current.alt || product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-8xl">🎁</div>
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous product image"
                className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-[#214c72] shadow-sm"
              >
                <ChevronLeft size={19} />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next product image"
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-[#214c72] shadow-sm"
              >
                <ChevronRight size={19} />
              </button>
            </>
          )}

          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm">
            <Maximize2 size={13} /> {images.length} photo{images.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View product image ${index + 1}`}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-[14px] border bg-white transition ${
                active === index
                  ? "border-[#d92f66] ring-2 ring-[#d92f66]/15"
                  : "border-[#e8dfe4] hover:border-[#2f628f]"
              }`}
            >
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.alt || product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full place-items-center text-xs text-slate-400">Gift</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
