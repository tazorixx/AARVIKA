"use client";

import { ImagePlus, PenLine } from "lucide-react";
import type { Product } from "@/lib/catalog/types";

type PersonalizationValues = Record<string, string>;

export default function PersonalizationForm({
  product,
  value,
  onChange,
}: {
  product: Product;
  value: PersonalizationValues;
  onChange: (value: PersonalizationValues) => void;
}) {
  const personalization = product.personalization;
  if (!personalization?.enabled) return null;

  const fields = personalization.fields?.filter(Boolean) ?? [];
  const max = personalization.maxCharacters ?? personalization.maxLength ?? 120;

  return (
    <div className="rounded-[14px] border border-[#f0dfe6] bg-[#fffafd] p-4 shadow-[0_8px_24px_rgba(217,47,102,0.04)]">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#d92f66] shadow-sm"><PenLine size={18} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-[#214c72]">Make it personal</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {personalization.instructions || "Add the details that make this gift feel like it was chosen just for them."}
              </p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#d92f66]">Personalised</span>
          </div>
        </div>
      </div>

      {fields.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.map((field, index) => {
            const fieldId = `personalization-${index}`;
            const current = value[field] || "";
            return (
              <div key={`${field}-${index}`} className={fields.length % 2 === 1 && index === fields.length - 1 ? "sm:col-span-2" : ""}>
                <label className="text-xs font-bold text-[#214c72]" htmlFor={fieldId}>{field}</label>
                <input
                  id={fieldId}
                  value={current}
                  maxLength={max}
                  onChange={(event) => onChange({ ...value, [field]: event.target.value })}
                  placeholder={`Enter ${field.toLowerCase()}`}
                  className="mt-1.5 w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d92f66] focus:ring-2 focus:ring-[#d92f66]/10"
                />
                <p className="mt-1 text-right text-[11px] text-slate-400">{current.length}/{max}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4">
          <textarea
            id="personalization"
            value={value.default || ""}
            maxLength={max}
            onChange={(event) => onChange({ ...value, default: event.target.value })}
            rows={3}
            placeholder="Type the name or message you want personalised"
            className="w-full resize-none rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#d92f66] focus:ring-2 focus:ring-[#d92f66]/10"
          />
          <p className="mt-1 text-right text-[11px] text-slate-400">{(value.default || "").length}/{max}</p>
        </div>
      )}

      {personalization.imageUpload && (
        <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-dashed border-[#e6cbd5] bg-white px-3 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff0f5] text-[#d92f66]"><ImagePlus size={17} /></div>
          <div>
            <p className="text-xs font-bold text-[#214c72]">Photo personalisation available</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Photo upload can be completed when this product’s upload flow is enabled.</p>
          </div>
        </div>
      )}
    </div>
  );
}
