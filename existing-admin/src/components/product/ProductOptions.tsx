"use client";

import { Gift, Sparkles } from "lucide-react";
import type { Product } from "@/lib/catalog/types";

export default function ProductOptions({
  product,
  variantKey,
  onVariantChange,
  giftMessage,
  onGiftMessageChange,
}: {
  product: Product;
  variantKey: string;
  onVariantChange: (value: string) => void;
  giftMessage: string;
  onGiftMessageChange: (value: string) => void;
}) {
  return (
    <div className="space-y-5 border-t border-[#eee5e9] pt-5">
      {product.variants.length > 0 && (
        <div className="rounded-[14px] border border-[#e8dfe4] bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5fbff] text-[#2f628f]"><Sparkles size={17} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-bold text-[#172033]" htmlFor="product-variant">Choose your option</label>
                <span className="text-[11px] font-semibold text-slate-400">Pick what suits the recipient</span>
              </div>
              <select
                id="product-variant"
                value={variantKey}
                onChange={(event) => onVariantChange(event.target.value)}
                className="mt-2 w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#214c72] outline-none transition focus:border-[#2f628f] focus:ring-2 focus:ring-[#2f628f]/10"
              >
                {product.variants.map((variant, index) => {
                  const key = variant.id || `${index}:${variant.name}:${variant.value || variant.options?.join(",") || ""}`;
                  const priceText = variant.price !== undefined
                    ? ` • ₹${variant.price.toLocaleString("en-IN")}`
                    : variant.priceDelta
                      ? ` • ${variant.priceDelta > 0 ? "+" : "−"} ₹${Math.abs(variant.priceDelta).toLocaleString("en-IN")}`
                      : "";
                  return (
                    <option key={key} value={key}>
                      {variant.name}{variant.value ? ` — ${variant.value}` : variant.options?.length ? ` — ${variant.options.join(", ")}` : ""}{priceText}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[14px] border border-[#f0dfe6] bg-[#fffafd] p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#d92f66] shadow-sm"><Gift size={17} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-bold text-[#214c72]" htmlFor="gift-message">Add a gift message <span className="font-normal text-slate-400">(optional)</span></label>
              <span className="text-[11px] font-semibold text-slate-400">{giftMessage.length}/250</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Add a few words they can read when the gift arrives.</p>
            <textarea
              id="gift-message"
              value={giftMessage}
              onChange={(event) => onGiftMessageChange(event.target.value)}
              maxLength={250}
              rows={3}
              placeholder="For example: Wishing you lots of happiness and beautiful memories."
              className="mt-3 w-full resize-none rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#d92f66] focus:ring-2 focus:ring-[#d92f66]/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
