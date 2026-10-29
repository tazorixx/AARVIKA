import type { ReactNode } from "react";

export default function AccountEmptyState({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-dashed border-[#dbe8ef] bg-[linear-gradient(135deg,#fffafd,#f5fbff)] px-5 py-10 text-center sm:px-8 sm:py-11">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#2f628f] shadow-sm ring-1 ring-[#e5edf4]">{icon}</div>
      <h2 className="gift-heading mt-4 text-2xl font-bold text-[#214c72]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {actions && <div className="mt-5 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </div>
  );
}
