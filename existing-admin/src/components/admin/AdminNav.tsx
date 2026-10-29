"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FolderTree,
  Gift,
  Home,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Package,
  Percent,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  ClipboardCheck,
  CreditCard,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  Users,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const ORDER_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
const INVENTORY_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]);
const CUSTOMER_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "SUPPORT"]);
const COUPON_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]);
const REVIEW_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "SUPPORT"]);
const HOMEPAGE_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]);
const ANALYTICS_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
const BULK_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]);
const SHIPPING_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
const DELIVERY_ZONE_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
const SUPPORT_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "SUPPORT"]);

const groups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: ANALYTICS_ROLES },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Occasions", href: "/admin/occasions", icon: Sparkles },
      { label: "Recipients", href: "/admin/recipients", icon: Users },
      { label: "Collections", href: "/admin/collections", icon: Tag },
      { label: "Inventory", href: "/admin/inventory", icon: ClipboardList, roles: INVENTORY_ROLES },
      { label: "Bulk Operations", href: "/admin/bulk-operations", icon: ClipboardList, roles: BULK_ROLES },
    ],
  },
  {
    label: "Merchandising",
    items: [
      { label: "Wedding", href: "/admin/merchandising/wedding", icon: Sparkles, roles: new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]) },
      { label: "Birthday", href: "/admin/merchandising/birthday", icon: Gift, roles: new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]) },
      { label: "Anniversary", href: "/admin/merchandising/anniversary", icon: Heart, roles: new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]) },
      { label: "Hampers", href: "/admin/merchandising/hampers", icon: Package, roles: new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]) },
      { label: "Personalized Gifts", href: "/admin/merchandising/personalised", icon: Sparkles, roles: new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]) },
      { label: "Clothing", href: "/admin/merchandising/clothing", icon: ShoppingBag, roles: new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]) },
      { label: "Stationery", href: "/admin/merchandising/stationery", icon: ClipboardList, roles: new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]) },
      { label: "Furniture", href: "/admin/merchandising/furniture", icon: Home, roles: new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]) },
    ],
  },
  {
    label: "Marketing & Discovery",
    items: [
      { label: "Search", href: "/admin/search", icon: Search, roles: new Set(["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]) },
    ],
  },
  {
    label: "Sales & Fulfillment",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag, roles: ORDER_ROLES },
      { label: "Payments", href: "/admin/payments", icon: CreditCard, roles: ORDER_ROLES },
      { label: "Coupons", href: "/admin/coupons", icon: Percent, roles: COUPON_ROLES },
      { label: "Shipping", href: "/admin/shipping", icon: Truck, roles: SHIPPING_ROLES },
      { label: "Delivery Zones", href: "/admin/delivery-zones", icon: MapPinned, roles: DELIVERY_ZONE_ROLES },
      { label: "Abandoned Carts", href: "/admin/abandoned-carts", icon: ShoppingCart, roles: ORDER_ROLES },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Users, roles: CUSTOMER_ROLES },
      { label: "Reviews", href: "/admin/reviews", icon: Star, roles: REVIEW_ROLES },
      { label: "Support", href: "/admin/support", icon: CircleHelp, roles: SUPPORT_ROLES },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Homepage", href: "/admin/homepage", icon: Home, roles: HOMEPAGE_ROLES },
      { label: "Notifications", href: "/admin/notifications", icon: Bell, roles: new Set(["SUPER_ADMIN", "ADMIN"]) },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Admin Users", href: "/admin/admin-users", icon: ShieldCheck, roles: new Set(["SUPER_ADMIN"]) },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardCheck, roles: new Set(["SUPER_ADMIN", "ADMIN"]) },
    ],
  },
];

function isAllowed(item: { roles?: Set<string> }, role: string) {
  return !item.roles || item.roles.has(role);
}

export default function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("Admin");
  const [userEmail, setUserEmail] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("gift4u-admin-collapsed");
    if (stored === "true") Promise.resolve().then(() => setCollapsed(true));
    const theme = window.localStorage.getItem("gift4u-admin-theme");
    if (theme === "dark") Promise.resolve().then(() => setDark(true));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.adminTheme = dark ? "dark" : "light";
    window.localStorage.setItem("gift4u-admin-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    window.localStorage.setItem("gift4u-admin-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    let active = true;

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!active) return;

      if (!user) {
        setRole("");
        setUserName("Admin");
        setUserEmail("");
        return;
      }

      try {
        const token = await user.getIdTokenResult(true);
        if (!active) return;
        setRole(String(token.claims.role || ""));
        setUserName(user.displayName || user.email?.split("@")[0] || "Admin");
        setUserEmail(user.email || "");
      } catch {
        if (active) setRole("");
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => setMobileOpen(false));
  }, [pathname]);

  const visibleGroups = useMemo(
    () => groups.map((group) => ({ ...group, items: group.items.filter((item) => isAllowed(item, role)) })).filter((group) => group.items.length),
    [role],
  );

  const allItems = useMemo(() => visibleGroups.flatMap((group) => group.items), [visibleGroups]);
  const filteredItems = allItems.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase()));

  async function signOut() {
    if(!window.dispatchEvent(new Event("aarvika:before-admin-signout",{cancelable:true})))return;
    await auth.signOut();
    window.location.href = "/admin/login";
  }

  function SidebarContent() {
    return (
      <div className="admin-sidebar-inner">
        <div className="admin-brand-row">
          <Link href="/admin" className="admin-brand" aria-label="AARVIKA Admin">
            <span className="admin-brand-mark"><Gift size={21} strokeWidth={2.2} /></span>
            {!collapsed && <span><strong>AARVIKA</strong><small>ADMIN CONSOLE</small></span>}
          </Link>
          <button className="admin-icon-button admin-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="admin-store-card">
          <span className="admin-store-icon"><Store size={17} /></span>
          {!collapsed && <span><strong>AARVIKA Store</strong><small>{process.env.NEXT_PUBLIC_AARVIKA_SHARED === "true" ? "Real Firebase · gift4u-4210f" : "Isolated demo workspace"}</small></span>}
          {!collapsed && <span className="admin-live-dot" title={process.env.NEXT_PUBLIC_AARVIKA_SHARED === "true" ? "Connected to gift4u-4210f" : "Demo emulators only"} />}
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {visibleGroups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              {!collapsed && <p className="admin-nav-label">{group.label}</p>}
              {group.items.map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={`admin-nav-link${active ? " active" : ""}`} title={collapsed ? item.label : undefined}>
                    <Icon size={18} strokeWidth={1.9} />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && active && <span className="admin-nav-active-dot" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          {!collapsed && <div className="admin-help-card"><span className="admin-help-icon"><CircleHelp size={17} /></span><div><strong>Need help?</strong><small>Check support tickets</small></div><Link href="/admin/support" aria-label="Open support">→</Link></div>}
          <Link href="/" className="admin-nav-link" title="View storefront"><Store size={18} /><span>{!collapsed && "View Storefront"}</span></Link>
          <button className="admin-nav-link admin-signout" onClick={signOut} title="Sign out"><LogOut size={18} /><span>{!collapsed && "Sign out"}</span></button>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-shell${collapsed ? " sidebar-collapsed" : ""}`}>
      <aside className={`admin-sidebar${mobileOpen ? " mobile-open" : ""}`}>
        {SidebarContent()}
      </aside>
      {mobileOpen && <button className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-icon-button admin-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <button className="admin-icon-button admin-collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {collapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
            </button>
            <button className="admin-command-trigger" onClick={() => setSearchOpen(true)}>
              <Search size={18} />
              <span>Search or type command...</span>
              <kbd>⌘ K</kbd>
            </button>
          </div>

          <div className="admin-header-actions">
            <button className="admin-round-button" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <div className="admin-header-popover-wrap">
              <button className="admin-round-button admin-notification-button" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }} aria-label="Notifications" aria-expanded={notificationsOpen}>
                <Bell size={19} />
                <span className="admin-notification-dot" />
              </button>
              {notificationsOpen && (
                <div className="admin-popover admin-notifications-popover">
                  <div className="admin-popover-heading"><div><strong>Notifications</strong><small>Store alerts and shortcuts</small></div><span className="admin-notification-badge">!</span></div>
                  <Link href="/admin/inventory" className="admin-popover-item"><span className="admin-popover-item-icon pink"><Package size={16} /></span><span><strong>Inventory alerts</strong><small>Review products with low available stock.</small></span></Link>
                  <Link href="/admin/support" className="admin-popover-item"><span className="admin-popover-item-icon blue"><CircleHelp size={16} /></span><span><strong>Support queue</strong><small>Open customer support tickets.</small></span></Link>
                </div>
              )}
            </div>
            <div className="admin-header-popover-wrap">
              <button className="admin-profile-trigger" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} aria-label="Open admin menu" aria-expanded={profileOpen}>
                <span className="admin-avatar">{userName.slice(0, 1).toUpperCase()}</span>
                <span className="admin-profile-copy"><strong>{userName}</strong><small>{role || "Admin"}</small></span>
                <ChevronDown size={17} />
              </button>
              {profileOpen && (
                <div className="admin-popover admin-profile-popover">
                  <div className="admin-popover-profile"><span className="admin-avatar">{userName.slice(0, 1).toUpperCase()}</span><div><strong>{userName}</strong><small>{userEmail || "Authorized administrator"}</small></div></div>
                  <div className="admin-popover-role"><ShieldCheck size={14} /> {role || "Admin"}</div>
                  <Link href="/" className="admin-popover-link"><Store size={16} /> View storefront</Link>
                  <button className="admin-popover-link danger" onClick={signOut}><LogOut size={16} /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-content-inner">{children}</div>
        </main>
      </div>

      {searchOpen && (
        <div className="admin-command-overlay" role="dialog" aria-modal="true" aria-label="Admin command search" onMouseDown={() => setSearchOpen(false)}>
          <div className="admin-command-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-command-search"><Search size={19} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search admin pages..." /><kbd>ESC</kbd></div>
            <div className="admin-command-results">
              {filteredItems.length ? filteredItems.map((item) => {
                const Icon = item.icon;
                return <Link key={item.href} href={item.href} onClick={() => setSearchOpen(false)} className="admin-command-item"><Icon size={18} /><span>{item.label}</span><ChevronRight size={16} /></Link>;
              }) : <p className="admin-command-empty">No admin pages found.</p>}
            </div>
            <div className="admin-command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span><span><kbd>Esc</kbd> Close</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
