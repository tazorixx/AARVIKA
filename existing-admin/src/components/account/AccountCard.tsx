import type { ReactNode } from "react";

export default function AccountCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[14px] border border-[#e5edf4] bg-white shadow-[0_6px_22px_rgba(33,76,114,0.045)] ${className}`}>{children}</section>;
}
