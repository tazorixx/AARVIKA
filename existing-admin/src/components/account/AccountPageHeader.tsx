import type { ReactNode } from "react";

export default function AccountPageHeader({
  eyebrow,
  title,
  description,
  icon,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-[16px] border border-[#dce8ef] bg-[linear-gradient(135deg,#17324d_0%,#214c72_62%,#2f628f_100%)] text-white shadow-[0_12px_32px_rgba(33,76,114,0.10)]">
      <div className="flex min-h-[148px] flex-col justify-between gap-5 px-6 py-7 sm:flex-row sm:items-center sm:px-8 sm:py-8">
        <div className="flex items-center gap-4">
          {icon && <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/10">{icon}</div>}
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f5b3c7]">{eyebrow}</p>
            <h1 className="gift-heading mt-1 text-3xl font-bold leading-tight sm:text-[36px]">{title}</h1>
            {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
