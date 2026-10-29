"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  ShieldCheck,
  Truck,
  Gem,
  Heart,
  Music,
  Sparkles,
  Wallet,
  ArrowRight,
} from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Breadcrumb from "@/components/Breadcrumb";
import { useCatalog } from "@/hooks/useCatalog";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/catalog/CatalogListing";
import type { MerchandisingItem, WeddingMerchandisingResponse } from "@/lib/merchandising/types";








/* =====================================================
   SHOP BY BUDGET

   These cards currently use icons.

   You can later add images if you want.

   Put images inside:

   public/images/wedding/budget/
   ===================================================== */

const budgetOptions = [
  {
    title: "Under ₹500",
    subtitle: "Small & thoughtful",
    href: "/wedding?budget=under-500",
    image: "",
  },
  {
    title: "₹500 - ₹1,000",
    subtitle: "Popular gifts",
    href: "/wedding?budget=500-1000",
    image: "",
  },
  {
    title: "₹1,000 - ₹2,500",
    subtitle: "Premium gifts",
    href: "/wedding?budget=1000-2500",
    image: "",
  },
  {
    title: "₹2,500 - ₹5,000",
    subtitle: "Special gifts",
    href: "/wedding?budget=2500-5000",
    image: "",
  },
  {
    title: "₹5,000+",
    subtitle: "Luxury gifts",
    href: "/wedding?budget=5000-plus",
    image: "",
  },
];


/* =====================================================
   SHOP BY CULTURE

   ADD IMAGES HERE LATER

   Folder:

   public/images/wedding/cultures/
   ===================================================== */

const cultureFilters = [
  {
    name: "Hindu",
    href: "/wedding?culture=Hindu",

    // ADD IMAGE HERE LATER
    image: "",
  },
  {
    name: "Muslim",
    href: "/wedding?culture=Muslim",

    // ADD IMAGE HERE LATER
    image: "",
  },
  {
    name: "Christian",
    href: "/wedding?culture=Christian",

    // ADD IMAGE HERE LATER
    image: "",
  },
  {
    name: "Sikh",
    href: "/wedding?culture=Sikh",

    // ADD IMAGE HERE LATER
    image: "",
  },
  {
    name: "Bengali",
    href: "/wedding?culture=Bengali",

    // ADD IMAGE HERE LATER
    image: "",
  },
  {
    name: "Punjabi",
    href: "/wedding?culture=Punjabi",

    // ADD IMAGE HERE LATER
    image: "",
  },
  {
    name: "Gujarati",
    href: "/wedding?culture=Gujarati",

    // ADD IMAGE HERE LATER
    image: "",
  },
  {
    name: "Rajasthani",
    href: "/wedding?culture=Rajasthani",

    // ADD IMAGE HERE LATER
    image: "",
  },
];


/* =====================================================
   SHOP BY STATE

   ADD IMAGES HERE LATER

   Folder:

   public/images/wedding/states/
   ===================================================== */

const stateFilters = [
  {
    name: "Maharashtra",
    href: "/wedding?state=Maharashtra",
    image: "/images/wedding/maharashtra.jpg.png",
  },
  {
    name: "Punjab",
    href: "/wedding?state=Punjab",
    image: "/images/wedding/punjab.jpg.png",
  },
  {
    name: "Rajasthan",
    href: "/wedding?state=Rajasthan",
    image: "/images/wedding/rajasthan.jpg.png",
  },
  {
    name: "Gujarat",
    href: "/wedding?state=Gujarat",
    image: "/images/wedding/gujarat.jpg.png",
  },
  {
    name: "Tamil Nadu",
    href: "/wedding?state=Tamil-Nadu",
    image: "/images/wedding/tamil-nadu.jpg.png",
  },
  {
    name: "West Bengal",
    href: "/wedding?state=West-Bengal",
    image: "/images/wedding/west-bengal.jpg.png",
  },
];



/* =====================================================
   TYPE FOR HORIZONTAL CAROUSEL ITEMS
   ===================================================== */

type GiftItem = {
  name: string;
  href: string;
  image: string;
};



/* =====================================================
   HORIZONTAL GIFT RAIL

   USED FOR:

   - Shop by Culture
   - Shop by State

   FEATURES:

   - One horizontal line
   - Smooth scrolling
   - Left arrow
   - Right arrow
   - Homepage CategoryRail style
   ===================================================== */

function HorizontalGiftRail({
  items,
}: {
  items: GiftItem[];
}) {
  const scrollContainerRef =
    useRef<HTMLDivElement>(null);


  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -400,
        behavior: "smooth",
      });
    }
  };


  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: "smooth",
      });
    }
  };


  return (
    <div className="relative">


      {/* ===============================
          LEFT SCROLL ARROW
          =============================== */}

      <button
        type="button"
        onClick={scrollLeft}
        aria-label="Scroll left"
        className="
          absolute
          left-2
          top-1/2
          z-20
          flex
          h-10
          w-10
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          bg-white
          text-[#172033]
          shadow-lg
          transition
          hover:bg-[#d92f66]
          hover:text-white
        "
      >
        <ChevronLeft size={22} />
      </button>


      {/* ===============================
          HORIZONTAL CARD CONTAINER
          =============================== */}

      <div
        ref={scrollContainerRef}
        className="
          flex
          flex-nowrap
          gap-4
          overflow-x-auto
          scroll-smooth
          px-1
          pb-3

          [-ms-overflow-style:none]
          [scrollbar-width:none]

          [&::-webkit-scrollbar]:hidden
        "
      >
        {items.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="
              group
              relative
              aspect-[4/5]

              w-40
              min-w-40

              sm:w-44
              sm:min-w-44

              lg:w-[190px]
              lg:min-w-[190px]

              shrink-0
              overflow-hidden
              rounded-2xl
              border
              border-[#f0dfe6]
              bg-[#fff6f9]
              transition
              hover:-translate-y-1
              hover:border-[#d92f66]
              hover:shadow-lg
            "
          >


            {/* ===============================
                IMAGE AREA

                WHEN YOU ADD IMAGE PATH,
                THE REAL IMAGE WILL APPEAR.

                UNTIL THEN,
                PLACEHOLDER WILL APPEAR.
                =============================== */}

            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="
                  h-full
                  w-full
                  object-cover
                  transition
                  duration-500
                  group-hover:scale-105
                "
              />
            ) : (
              <div
                className="
                  flex
                  h-full
                  w-full
                  items-center
                  justify-center
                  bg-[#f8e8ee]
                  p-4
                  text-center
                  text-sm
                  font-semibold
                  text-[#667085]
                "
              >
                {item.name} Image
              </div>
            )}


            {/* ===============================
                BOTTOM TEXT AREA
                =============================== */}

            <div
              className="
                absolute
                inset-x-0
                bottom-0
                bg-[#172033]
                p-4
                text-white
              "
            >
              <h3 className="text-lg font-bold">
                {item.name}
              </h3>

              <p className="mt-1 text-xs text-white/85">
                Explore gifts →
              </p>
            </div>

          </Link>
        ))}
      </div>


      {/* ===============================
          RIGHT SCROLL ARROW
          =============================== */}

      <button
        type="button"
        onClick={scrollRight}
        aria-label="Scroll right"
        className="
          absolute
          right-2
          top-1/2
          z-20
          flex
          h-10
          w-10
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          bg-white
          text-[#172033]
          shadow-lg
          transition
          hover:bg-[#d92f66]
          hover:text-white
        "
      >
        <ChevronRight size={22} />
      </button>

    </div>
  );
}



/* =====================================================
   SHOP BY WEDDING EVENT COMPONENT

   DESIGN:

   - Rounded cards
   - Image/Icon area
   - More attractive than simple text buttons
   ===================================================== */

function WeddingEventSection({
  events,
  loading,
}: {
  events: Array<{ id: string; name: string; image?: string; href: string }>;
  loading: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">


      {/* SECTION HEADER */}

      <div className="mb-7 flex items-end justify-between gap-4">

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
            Every celebration matters
          </p>

          <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
            Shop by Wedding Event
          </h2>
        </div>


        <Link
          href="/wedding"
          className="hidden text-sm font-bold text-[#d92f66] hover:underline sm:inline"
        >
          View all →
        </Link>

      </div>


      {/* =====================================
          WEDDING EVENT CARDS

          Each card has:

          - Image placeholder
          - Icon
          - Event name
          ===================================== */}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">

        {loading
          ? Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white p-3 text-center opacity-60"
              >
                <div className="aspect-square w-full rounded-xl bg-[#fff6f9]" />
                <div className="mx-auto mt-3 h-4 w-20 rounded bg-[#f8e8ee]" />
              </div>
            ))
          : events.map((event) => (
            <Link
              key={event.id}
              href={event.href}
              className="
                group
                overflow-hidden
                rounded-2xl
                border
                border-[#f0dfe6]
                bg-white
                p-3
                text-center
                transition
                hover:-translate-y-1
                hover:border-[#d92f66]
                hover:shadow-lg
              "
            >


              {/* =================================
                  IMAGE AREA

                  ADD EVENT IMAGE HERE LATER.

                  Example:

                  image:
                  "/images/wedding/events/haldi.jpg"
                  ================================= */}

              <div
                className="
                  relative
                  mx-auto
                  flex
                  aspect-square
                  w-full
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  bg-[#fff6f9]
                "
              >

                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.name}
                    className="
                      h-full
                      w-full
                      object-cover
                      transition
                      duration-500
                      group-hover:scale-105
                    "
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Gift size={30} className="text-[#d92f66]" />
                    <span className="text-xs font-medium text-[#667085]">
                      {event.name}
                    </span>
                  </div>
                )}

              </div>


              {/* EVENT NAME */}

              <h3 className="mt-3 text-sm font-bold text-[#172033] group-hover:text-[#d92f66]">

                {event.name}

              </h3>

            </Link>
          ))}

      </div>

    </section>
  );
}



/* =====================================================
   SHOP BY CATEGORY COMPONENT

   DESIGN INSPIRATION:

   - CIRCULAR IMAGE AREA
   - NOT ONLY RECTANGULAR BOXES
   - CLEAN AND MODERN LOOK

   This gives variety to the page.
   ===================================================== */

function WeddingCategorySection({
  categories,
  loading,
}: {
  categories: Array<{ id: string; name: string; image?: string; href: string }>;
  loading: boolean;
}) {
  return (
    <section className="border-y border-[#f3e7eb] bg-[#fffafc] py-12">


      <div className="mx-auto max-w-7xl px-4 lg:px-8">


        {/* SECTION HEADER */}

        <div className="mb-8 flex items-end justify-between gap-4">

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
              Find the perfect gift
            </p>

            <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
              Shop by Category
            </h2>
          </div>


          <Link
            href="/wedding"
            className="hidden text-sm font-bold text-[#d92f66] hover:underline sm:inline"
          >
            View all →
          </Link>

        </div>


        {/* =====================================
            CIRCULAR CATEGORY ITEMS

            The image area is CIRCULAR.

            This prevents the website from
            looking like it only contains boxes.
            ===================================== */}

        <div className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-5 lg:grid-cols-10">

          {loading
            ? Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center text-center opacity-60">
                  <div className="aspect-square w-full max-w-[105px] rounded-full bg-[#fff6f9]" />
                  <div className="mt-3 h-4 w-20 rounded bg-[#f8e8ee]" />
                </div>
              ))
            : categories.map((category) => (

            <Link
              key={category.id}
              href={category.href}
              className="
                group
                flex
                flex-col
                items-center
                text-center
              "
            >


              {/* =================================
                  CIRCULAR IMAGE CONTAINER

                  ADD CATEGORY IMAGE HERE LATER.

                  Example:

                  image:
                  "/images/wedding/categories/jewellery.jpg"
                  ================================= */}

              <div
                className="
                  relative
                  flex
                  aspect-square
                  w-full
                  max-w-[105px]
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  border
                  border-[#f0dfe6]
                  bg-[#fff6f9]
                  shadow-sm
                  transition
                  duration-300
                  group-hover:-translate-y-1
                  group-hover:border-[#d92f66]
                  group-hover:shadow-md
                "
              >

                {category.image ? (

                  /* ACTUAL CATEGORY IMAGE */

                  <img
                    src={category.image}
                    alt={category.name}
                    className="
                      h-full
                      w-full
                      object-cover
                      transition
                      duration-500
                      group-hover:scale-110
                    "
                  />

                ) : (

                  /* IMAGE PLACEHOLDER */

                  <div className="px-3 text-center text-xs font-semibold text-[#667085]">

                    Add Image

                  </div>

                )}

              </div>


              {/* CATEGORY NAME */}

              <h3
                className="
                  mt-3
                  text-xs
                  font-bold
                  leading-5
                  text-[#172033]
                  transition
                  group-hover:text-[#d92f66]

                  sm:text-sm
                "
              >

                {category.name}

              </h3>

            </Link>

          ))}

        </div>

      </div>

    </section>
  );
}



/* =====================================================
   SHOP BY BUDGET COMPONENT

   DESIGN:

   - Wide horizontal cards
   - Different shape from other sections
   - Icon on left
   - Text on right

   This adds design variety.
   ===================================================== */

function WeddingBudgetSection({ budgets }: { budgets: Array<{ id: string; title: string; subtitle: string; href: string; image?: string }> }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">


      {/* SECTION HEADER */}

      <div className="mb-7">

        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
          Gifts for every budget
        </p>

        <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
          Shop by Budget
        </h2>

        <p className="mt-3 text-[#667085]">
          Find something special, no matter how much you want to spend.
        </p>

      </div>


      {/* =====================================
          BUDGET CARDS

          DIFFERENT DESIGN:

          Wide horizontal cards instead
          of square or circular cards.
          ===================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

        {budgets.map((budget, index) => (

          <Link
            key={budget.title}
            href={budget.href}
            className="
              group
              flex
              items-center
              gap-4
              rounded-2xl
              border
              border-[#f0dfe6]
              bg-white
              p-4
              transition
              hover:-translate-y-1
              hover:border-[#d92f66]
              hover:shadow-lg
            "
          >


            {/* =================================
                IMAGE / ICON AREA

                If you add an image later,
                it will appear here.

                Until then,
                the Gift icon appears.
                ================================= */}

            <div
              className="
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                bg-[#fff1f6]
              "
            >

              {budget.image ? (

                /* ACTUAL IMAGE */

                <img
                  src={budget.image}
                  alt={budget.title}
                  className="h-full w-full object-cover"
                />

              ) : (

                /* DEFAULT ICON */

                <Wallet
                  size={25}
                  className={
                    index === 4
                      ? "text-[#d92f66]"
                      : "text-[#d92f66]"
                  }
                />

              )}

            </div>


            {/* BUDGET TEXT */}

            <div>

              <h3 className="text-sm font-bold text-[#172033] group-hover:text-[#d92f66]">

                {budget.title}

              </h3>


              <p className="mt-1 text-xs text-[#667085]">

                {budget.subtitle}

              </p>

            </div>

          </Link>

        ))}

      </div>

    </section>
  );
}



/* =====================================================
   MAIN WEDDING PAGE
   ===================================================== */

function WeddingPageContent() {
  const { data, loading: catalogLoading } = useCatalog();
  const searchParams = useSearchParams();
  const [merchandising, setMerchandising] = useState<WeddingMerchandisingResponse | null>(null);
  const [merchandisingLoading, setMerchandisingLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/merchandising/wedding", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load Wedding merchandising.");
        return (await response.json()) as WeddingMerchandisingResponse;
      })
      .then((value) => {
        if (!cancelled) setMerchandising(value);
      })
      .catch(() => {
        if (!cancelled) setMerchandising(null);
      })
      .finally(() => {
        if (!cancelled) setMerchandisingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const occasions = data?.occasions ?? [];
  const categories = data?.categories ?? [];
  const allItems = merchandising?.items ?? [];
  const activeItems = allItems.filter((item) => item.active);
  const fallback = merchandisingLoading || allItems.length === 0;

  const events = useMemo(() => {
    if (!fallback) {
      return activeItems.filter((item) => item.type === "event").map((item) => ({
        id: item.id, name: item.name, image: item.image, href: `/wedding?occasion=${encodeURIComponent(item.relatedId || item.id)}`,
      }));
    }
    return occasions.map((item) => ({ id: item.id, name: item.name, image: item.image, href: `/wedding?occasion=${encodeURIComponent(item.id)}` }));
  }, [activeItems, fallback, occasions]);

  const weddingCategories = useMemo(() => {
    if (!fallback) {
      return activeItems.filter((item) => item.type === "category").map((item) => ({
        id: item.id, name: item.name, image: item.image, href: `/wedding?category=${encodeURIComponent(item.relatedId || item.id)}`,
      }));
    }
    return categories.map((item) => ({ id: item.id, name: item.name, image: item.image, href: `/wedding?category=${encodeURIComponent(item.id)}` }));
  }, [activeItems, fallback, categories]);

  const budgets = useMemo(() => {
    if (!fallback) {
      return activeItems.filter((item) => item.type === "budget").map((item) => ({
        id: item.id, title: item.name, subtitle: item.subtitle || "Thoughtful gifts", href: `/wedding?budget=${encodeURIComponent(item.slug)}`, image: item.image,
      }));
    }
    return budgetOptions.map((item, index) => ({ id: `fallback-budget-${index}`, title: item.title, subtitle: item.subtitle, href: item.href, image: item.image || "" }));
  }, [activeItems, fallback]);

  const cultures = useMemo(() => {
    if (!fallback) return activeItems.filter((item) => item.type === "culture").map((item) => ({ name: item.name, href: `/wedding?culture=${encodeURIComponent(item.slug)}`, image: item.image || "" }));
    return cultureFilters;
  }, [activeItems, fallback]);

  const states = useMemo(() => {
    if (!fallback) return activeItems.filter((item) => item.type === "state").map((item) => ({ name: item.name, href: `/wedding?state=${encodeURIComponent(item.slug)}`, image: item.image || "" }));
    return stateFilters;
  }, [activeItems, fallback]);

  const filteredProducts = useMemo(() => {
    const products = data?.products ?? [];
    const occasion = searchParams.get("occasion");
    const category = searchParams.get("category");
    const budgetSlug = searchParams.get("budget");
    const cultureSlug = searchParams.get("culture");
    const stateSlug = searchParams.get("state");

    const eventItem = activeItems.find((item) => item.type === "event" && (item.slug === occasion || item.relatedId === occasion || item.id === occasion));
    const categoryItem = activeItems.find((item) => item.type === "category" && (item.slug === category || item.relatedId === category || item.id === category));
    const budgetItem = activeItems.find((item) => item.type === "budget" && (item.slug === budgetSlug || item.id === budgetSlug));
    const cultureItem = activeItems.find((item) => item.type === "culture" && (item.slug === cultureSlug || item.id === cultureSlug));
    const stateItem = activeItems.find((item) => item.type === "state" && (item.slug === stateSlug || item.id === stateSlug));

    return products.filter((product) => {
      if (eventItem?.relatedId && !product.occasionIds?.includes(eventItem.relatedId)) return false;
      if (categoryItem?.relatedId && !product.categoryIds?.includes(categoryItem.relatedId)) return false;
      if (budgetItem?.min !== undefined && product.price < budgetItem.min) return false;
      if (budgetItem?.max !== undefined && product.price > budgetItem.max) return false;
      if (cultureItem && !product.cultureTagIds?.includes(cultureItem.id)) return false;
      if (stateItem && !product.stateTagIds?.includes(stateItem.id)) return false;
      return true;
    });
  }, [activeItems, data?.products, searchParams]);

  const loading = catalogLoading || merchandisingLoading;

  return (

    <>


      {/* =================================================
          HEADER
          ================================================= */}

      <Header />


      {/* =================================================
          BREADCRUMB

          DISPLAY:

          Home > Wedding
          ================================================= */}

      <Breadcrumb currentPage="Wedding" />


      <main className="gift4u-template-page">


        <section className="px-4 py-6 lg:px-8">
  <div
    className="
      relative
      gift4u-standard-hero
      mx-auto
      max-w-7xl
      overflow-hidden
      rounded-3xl
      shadow-xl
    "
  >
    {/* HERO BACKGROUND IMAGE */}
    <img
      src="/images/wedding/wedding-hero.jpg"
      alt="Wedding Gifts"
      className="
        absolute
        inset-0
        h-full
        w-full
        object-cover
        object-center
      "
    />

    {/* DARK GRADIENT OVERLAY */}
    <div
      className="
        absolute
        inset-0
        bg-gradient-to-r
        from-black/80
        via-black/50
        to-black/10
      "
    />

    {/* HERO CONTENT */}
    <div
      className="
        gift4u-standard-hero-content
        relative
        z-10
        flex
        min-h-[450px]
        items-center
        px-6
        py-16
        sm:px-12
        lg:min-h-[520px]
        lg:px-16
      "
    >
      <div className="max-w-2xl">
        {/* SMALL HEADING */}
        <p
          className="
            text-sm
            font-bold
            uppercase
            tracking-[0.18em]
            text-[#f7c6d5]
          "
        >
          The Gift4U Wedding Edit
        </p>

        {/* MAIN HEADING */}
        <h1
          className="
            gift-heading
            mt-4
            text-5xl
            font-bold
            leading-tight
            text-white
            sm:text-6xl
            lg:text-7xl
          "
        >
          Celebrate Their
          <span className="block text-[#f5a6bd]">
            Forever.
          </span>
        </h1>

        {/* DESCRIPTION */}
        <p
          className="
            mt-6
            max-w-xl
            text-base
            leading-8
            text-white/90
            sm:text-lg
          "
        >
          From meaningful keepsakes to elegant wedding hampers,
          discover thoughtful gifts that celebrate love, memories,
          and the beginning of a beautiful forever.
        </p>

        {/* BUTTON */}
        <Link
          href="#wedding-gifts"
          className="
            mt-8
            inline-flex
            items-center
            justify-center
            rounded-full
            bg-[#d92f66]
            px-7
            py-3.5
            font-semibold
            text-white
            shadow-lg
            transition
            duration-300
            hover:bg-[#bd1d52]
            hover:scale-105
          "
        >
          Explore Wedding Gifts
        </Link>
      </div>
    </div>
  </div>
</section>


        {/* =================================================
            NEW SECTION 1

            SHOP BY WEDDING EVENT
            ================================================= */}

        <WeddingEventSection events={events} loading={loading} />



        {/* =================================================
            NEW SECTION 2

            SHOP BY CATEGORY

            Uses CIRCULAR image design.
            ================================================= */}

        <WeddingCategorySection categories={weddingCategories} loading={loading} />



        {/* =================================================
            NEW SECTION 3

            SHOP BY BUDGET

            Uses horizontal rectangular cards.
            ================================================= */}

        <WeddingBudgetSection budgets={budgets} />



        {/* =================================================
            SHOP BY CULTURE
            ================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">


          {/* SECTION HEADER */}

          <div className="mb-7">

            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
              Celebrate traditions
            </p>


            <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
              Shop by Culture
            </h2>


            <p className="mt-3 text-[#667085]">
              Discover thoughtful wedding gifts inspired by every tradition.
            </p>

          </div>


          {/* CULTURE HORIZONTAL CAROUSEL */}

          <HorizontalGiftRail
            items={cultures}
          />


        </section>



        {/* =================================================
            SHOP BY STATE
            ================================================= */}

        <section className="bg-[#fff6f9] py-14">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">


            {/* SECTION HEADER */}

            <div className="mb-7">

              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
                Regional celebrations
              </p>


              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                Shop by State
              </h2>


              <p className="mt-3 text-[#667085]">
                Find wedding gifts inspired by celebrations from across India.
              </p>

            </div>


            {/* STATE HORIZONTAL CAROUSEL */}

            <HorizontalGiftRail
              items={states}
            />


          </div>

        </section>



        {/* =================================================
            WEDDING BENEFITS / FEATURES
            ================================================= */}

        <section
          className="
            mx-auto
            grid
            max-w-7xl
            gap-5
            px-4
            py-12

            sm:grid-cols-3

            lg:px-8
          "
        >


          {/* =============================================
              FEATURE 1
              ============================================= */}

          <article
            className="
              rounded-2xl
              border
              border-[#f0dfe6]
              bg-white
              p-6
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
          >

            <Truck
              className="text-[#d92f66]"
              size={28}
            />


            <h2 className="mt-4 text-lg font-bold text-[#172033]">
              Timely Delivery
            </h2>


            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Delivery options designed around your celebration date.
            </p>

          </article>



          {/* =============================================
              FEATURE 2
              ============================================= */}

          <article
            className="
              rounded-2xl
              border
              border-[#f0dfe6]
              bg-white
              p-6
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
          >

            <Gift
              className="text-[#d92f66]"
              size={28}
            />


            <h2 className="mt-4 text-lg font-bold text-[#172033]">
              Wedding Combos
            </h2>


            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Explore hampers, furniture, and electrical gifting combinations.
            </p>

          </article>



          {/* =============================================
              FEATURE 3
              ============================================= */}

          <article
            className="
              rounded-2xl
              border
              border-[#f0dfe6]
              bg-white
              p-6
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
          >

            <ShieldCheck
              className="text-[#d92f66]"
              size={28}
            />


            <h2 className="mt-4 text-lg font-bold text-[#172033]">
              Gifting Made Easy
            </h2>


            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Quality-checked products and secure payments at every step.
            </p>

          </article>

        </section>



        {/* =================================================
            WEDDING GIFTS

            The Hero button redirects here:

            Explore Wedding Gifts
            ================================================= */}

        <section
          id="wedding-gifts"
          className="bg-[#fff6f9] py-14"
        >

          <div className="mx-auto max-w-7xl px-4 lg:px-8">


            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
              Wedding favourites
            </p>


            <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
              Gifts for a Lifetime of Memories
            </h2>


            <p className="mt-4 text-[#667085]">
              {searchParams.toString()
                ? `${filteredProducts.length} wedding gifts match your selection.`
                : `${filteredProducts.length} wedding gifts curated for every celebration.`}
            </p>

            {filteredProducts.length > 0 ? (
              <div className="mt-8 grid grid-cols-2 gap-3.5 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-[14px] border border-dashed border-[#d9cbd2] bg-white p-10 text-center">
                <p className="gift-heading text-xl font-bold text-[#214c72]">No wedding gifts match this selection yet.</p>
                <p className="mt-2 text-sm text-[#667085]">Choose another Wedding filter or add the relevant merchandising references to products in Admin.</p>
                <Link href="/wedding" className="mt-5 inline-flex rounded-full bg-[#d92f66] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#bd1d52]">View all wedding gifts</Link>
              </div>
            )}

          </div>

        </section>


      </main>



      {/* =================================================
          FOOTER
          ================================================= */}

      <Footer />


    </>

  );
}

export default function WeddingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fffafd]" />
      }
    >
      <WeddingPageContent />
    </Suspense>
  );
}
