"use client";

import Link from "next/link";
import { Heart, MapPin, MessageCircle, Package, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/account", label: "Overview", icon: UserRound },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/support", label: "Help", icon: MessageCircle },
];

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account navigation" className="customer-account-nav mt-5 overflow-x-auto rounded-[14px] border border-[#e5edf4] bg-white p-1 shadow-[0_6px_22px_rgba(33,76,114,0.045)]">
      <div className="flex min-w-max gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-sm font-bold transition ${
                active
                  ? "bg-[#2f628f] text-white shadow-sm"
                  : "text-[#26384b] hover:bg-[#f5fbff] hover:text-[#2f628f]"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
