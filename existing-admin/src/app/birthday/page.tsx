"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gift,
  Heart,
  ShoppingCart,
  Star,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";

import { useWishlist } from "@/contexts/WishlistContext";
import { useCatalog } from "@/hooks/useCatalog";
import type { MerchandisingItem } from "@/lib/merchandising/types";

/* =========================================
   TYPES
========================================= */

interface CartProduct {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface BirthdayProduct {
  id: number;
  name: string;
  price: number;
  image?: string;
}

/* =========================================
   BIRTHDAY GIFT RECIPIENTS
========================================= */

const recipients = [
  {
    name: "For Her",
    emoji: "👩",
    href: "/birthday?recipient=her",
  },
  {
    name: "For Him",
    emoji: "👨",
    href: "/birthday?recipient=him",
  },
  {
    name: "For Kids",
    emoji: "🧒",
    href: "/birthday?recipient=kids",
  },
  {
    name: "For Wife",
    emoji: "👰",
    href: "/birthday?recipient=wife",
  },
  {
    name: "For Husband",
    emoji: "🤵",
    href: "/birthday?recipient=husband",
  },
  {
    name: "For Girlfriend",
    emoji: "💝",
    href: "/birthday?recipient=girlfriend",
  },
  {
    name: "For Boyfriend",
    emoji: "💙",
    href: "/birthday?recipient=boyfriend",
  },
  {
    name: "For Mother",
    emoji: "👩‍👧",
    href: "/birthday?recipient=mother",
  },
  {
    name: "For Father",
    emoji: "👨‍👧",
    href: "/birthday?recipient=father",
  },
  {
    name: "For Friends",
    emoji: "🫂",
    href: "/birthday?recipient=friends",
  },
];

/* =========================================
   AGE PERFECT GIFTS
========================================= */

const ageGroups = [
  {
    title: "1st Birthday",
    subtitle: "Little one's first celebration",
    href: "/birthday?age=1",
  },
  {
    title: "10th Birthday",
    subtitle: "Double digit memories",
    href: "/birthday?age=10",
  },
  {
    title: "18th Birthday",
    subtitle: "A special milestone",
    href: "/birthday?age=18",
  },
  {
    title: "21st Birthday",
    subtitle: "Celebrate a new chapter",
    href: "/birthday?age=21",
  },
  {
    title: "30th Birthday",
    subtitle: "Cheers to a new decade",
    href: "/birthday?age=30",
  },
  {
    title: "50th Birthday",
    subtitle: "Golden memories",
    href: "/birthday?age=50",
  },
];

/* =========================================
   BIRTHDAY ESSENTIALS
========================================= */

const birthdayCategories = [
  {
    name: "Personalised Gifts",
    href: "/personalised",
  },
  {
    name: "Combos",
    href: "/birthday?category=combos",
  },
  {
    name: "Chocolates",
    href: "/birthday?category=chocolates",
  },
  {
    name: "Gift Hampers",
    href: "/hampers",
  },
  {
    name: "Greeting Cards",
    href: "/birthday?category=cards",
  },
  {
    name: "Premium Gifts",
    href: "/birthday?category=premium",
  },
  {
    name: "Jewellery",
    href: "/birthday?type=jewellery",
  },
  {
    name: "Photo Frames",
    href: "/birthday?category=photo-frames",
  },
  {
    name: "Soft Toys",
    href: "/birthday?category=soft-toys",
  },
  {
    name: "Toys & Games",
    href: "/birthday?type=toys",
  },
];

/* =========================================
   UNIQUE BIRTHDAY GIFTS
========================================= */

const uniqueGifts = [
  {
    name: "Spiritual Gifts",
    icon: "🪔",
    href: "/birthday?type=spiritual",
  },
  {
    name: "Jewellery",
    icon: "💎",
    href: "/birthday?type=jewellery",
  },
  {
    name: "Experiential Gifts",
    icon: "🎟️",
    href: "/birthday?type=experience",
  },
  {
    name: "Electronics",
    icon: "🎧",
    href: "/birthday?type=electronics",
  },
  {
    name: "Toys & Games",
    icon: "🧸",
    href: "/birthday?type=toys",
  },
];

/* =========================================
   BUDGET OPTIONS
========================================= */

const budgetOptions = [
  {
    title: "Under ₹500",
    subtitle: "Small surprises",
    href: "/birthday?budget=500",
  },
  {
    title: "₹500 - ₹1000",
    subtitle: "Thoughtful gifts",
    href: "/birthday?budget=1000",
  },
  {
    title: "₹1000 - ₹2000",
    subtitle: "Special moments",
    href: "/birthday?budget=2000",
  },
  {
    title: "Above ₹2000",
    subtitle: "Premium gifting",
    href: "/birthday?budget=premium",
  },
];

/* =========================================
   FEATURED PRODUCTS
========================================= */

export default function BirthdayPage() {
  const { data: catalog, loading: catalogLoading, error: catalogError } = useCatalog();
  const [merchandisingItems, setMerchandisingItems] = useState<MerchandisingItem[]>([]);

  useEffect(() => {
    fetch("/api/merchandising/birthday", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { items?: MerchandisingItem[] } | null) => setMerchandisingItems(data?.items?.filter((item) => item.active) ?? []))
      .catch(() => setMerchandisingItems([]));
  }, []);

  const cmsItems = useMemo(() => (type: MerchandisingItem["type"]) => merchandisingItems.filter((item) => item.type === type).sort((a, b) => a.sortOrder - b.sortOrder), [merchandisingItems]);
  const cmsRecipients = cmsItems("recipient");
  const cmsAgeGroups = cmsItems("ageGroup");
  const cmsCategories = cmsItems("category");
  const cmsGiftTypes = cmsItems("giftType");
  const cmsBudgets = cmsItems("budget");
  const recipientItems = cmsRecipients.length ? cmsRecipients.map((item) => ({ name: item.name, emoji: "🎁", href: `/birthday?recipient=${item.relatedId || item.slug}` })) : recipients;
  const ageItems = cmsAgeGroups.length ? cmsAgeGroups.map((item) => ({ title: item.name, subtitle: item.subtitle || item.description || "Celebrate every milestone", href: `/birthday?age=${item.minimumAge ?? item.years ?? item.slug}` })) : ageGroups;
  const categoryItems = cmsCategories.length ? cmsCategories.map((item) => ({ name: item.name, href: `/birthday?category=${item.relatedId || item.slug}`, image: item.image })) : birthdayCategories.map((item) => ({ ...item, image: undefined as string | undefined }));
  const giftTypeItems = cmsGiftTypes.length ? cmsGiftTypes.map((item) => ({ name: item.name, icon: "🎁", href: `/birthday?type=${item.slug}` })) : uniqueGifts;
  const budgetItems = cmsBudgets.length ? cmsBudgets.map((item) => ({ title: item.name, subtitle: item.subtitle || "Thoughtful gifts", href: `/birthday?budget=${item.slug}` })) : budgetOptions;
  const birthdayOccasionId = catalog?.occasions.find((occasion) => occasion.slug === "birthday")?.id;
  const featuredProducts: BirthdayProduct[] = (catalog?.products ?? [])
    .filter((product) => product.status === "live")
    .filter((product) => !birthdayOccasionId || product.occasionIds.includes(birthdayOccasionId))
    .slice(0, 8)
    .map((product) => ({ id: Number(product.id) || 0, name: product.title, price: product.price, image: product.thumbnail }));

  const router = useRouter();

  /* =========================================
     GLOBAL WISHLIST
  ========================================= */

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  /* =========================================
     HORIZONTAL SCROLL FUNCTION
  ========================================= */

  const scrollCategories = (
    direction: "left" | "right"
  ) => {
    if (!categoryScrollRef.current) return;

    categoryScrollRef.current.scrollBy({
      left: direction === "right" ? 350 : -350,
      behavior: "smooth",
    });
  };

  /* =========================================
     TOGGLE WISHLIST

     FIXED:
     - Converts numeric ID to string
     - Adds required category
  ========================================= */

  const toggleWishlist = (
    product: BirthdayProduct
  ) => {
    const productId = String(product.id);

    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist({
        id: productId,
        name: product.name,
        price: product.price,
        image: product.image,
        category: "Birthday",
      });
    }
  };

  /* =========================================
     ADD PRODUCT TO CART
  ========================================= */

  const addToCart = (
    product: BirthdayProduct
  ) => {
    const storedCart =
      localStorage.getItem("gift4u-cart");

    let cart: CartProduct[] = storedCart
      ? JSON.parse(storedCart)
      : [];

    const existingProduct = cart.find(
      (item) => item.id === product.id
    );

    if (existingProduct) {
      cart = cart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
      });
    }

    localStorage.setItem(
      "gift4u-cart",
      JSON.stringify(cart)
    );

    /* UPDATE HEADER CART COUNT */

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    /* CART MESSAGE */

    sessionStorage.setItem(
      "gift4u-cart-toast",
      `${product.name} added to cart`
    );

    /* REDIRECT TO CART */

    router.push("/cart");
  };

  return (
    <>
      {/* =========================================
          HEADER
      ========================================= */}

      <Header />

      {/* =========================================
          BREADCRUMB
      ========================================= */}

      <Breadcrumb currentPage="Birthday" />

      <main className="gift4u-template-page">

        {/* =========================================
            HERO SECTION
        ========================================= */}

        <section className="px-4 py-5 lg:px-8">
          <div className="gift4u-standard-hero relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#fff6f9]">

            <div className="gift4u-standard-hero-content relative min-h-[430px] px-7 py-14 sm:px-12 lg:px-16 lg:py-20">

              <div className="relative z-10 max-w-xl">

                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d92f66]">
                  Celebrate Every Year
                </p>

                <h1 className="gift-heading mt-4 text-5xl font-bold leading-tight text-[#172033] sm:text-6xl">

                  Make Every Birthday

                  <span className="block text-[#d92f66]">
                    Unforgettable.
                  </span>

                </h1>

                <p className="mt-6 text-lg leading-8 text-[#667085]">
                  From thoughtful keepsakes to personalised
                  surprises, discover gifts for every birthday
                  celebration.
                </p>

                <Link
                  href="#birthday-gifts"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-7 py-3.5 font-semibold text-white transition hover:bg-[#bd1d52]"
                >
                  Explore Birthday Gifts

                  <ArrowRight size={18} />
                </Link>

              </div>

            </div>

          </div>
        </section>


        {/* =========================================
            SHOP BY RECIPIENT
        ========================================= */}

        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">

          <div className="mb-7 flex items-end justify-between">

            <div>

              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
                Birthday Gifts For
              </p>

              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                Who Are You Celebrating?
              </h2>

            </div>

            <Link
              href="/birthday"
              className="hidden text-sm font-bold text-[#d92f66] hover:underline sm:block"
            >
              View All →
            </Link>

          </div>


          <div className="overflow-x-auto pb-3 scrollbar-hide">

            <div className="flex min-w-max gap-5">

              {recipientItems.map((recipient) => (

                <Link
                  key={recipient.name}
                  href={recipient.href}
                  className="group flex w-[115px] flex-col items-center"
                >

                  <div className="flex h-[105px] w-[105px] items-center justify-center overflow-hidden rounded-full border border-[#f0dfe6] bg-[#fff6f9] text-4xl transition duration-300 group-hover:-translate-y-1 group-hover:border-[#d92f66] group-hover:shadow-lg">
                    {recipient.emoji}
                  </div>

                  <p className="mt-3 text-center text-sm font-bold text-[#172033] group-hover:text-[#d92f66]">
                    {recipient.name}
                  </p>

                </Link>

              ))}

            </div>

          </div>

        </section>


        {/* =========================================
            SHOP BY AGE
        ========================================= */}

        <section className="bg-[#fff6f9] py-14">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="mb-8">

              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
                Age Perfect Gifts
              </p>

              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                Celebrate Every Milestone
              </h2>

            </div>


            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">

              {ageItems.map((age) => (

                <Link
                  key={age.title}
                  href={age.href}
                  className="group rounded-2xl border border-[#f0dfe6] bg-white p-5 transition hover:-translate-y-1 hover:border-[#d92f66] hover:shadow-lg"
                >

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0f5] text-xl">
                    🎁
                  </div>

                  <h3 className="mt-4 text-base font-bold text-[#172033] group-hover:text-[#d92f66]">
                    {age.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-[#667085]">
                    {age.subtitle}
                  </p>

                </Link>

              ))}

            </div>

          </div>

        </section>


        {/* =========================================
            BIRTHDAY ESSENTIALS
        ========================================= */}

        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">

          <div className="mb-7">

            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
              Must Haves
            </p>

            <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
              Birthday Essentials
            </h2>

          </div>


          <div className="relative">

            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollCategories("left")}
              className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-[#f0dfe6] bg-white p-3 shadow-lg transition hover:text-[#d92f66] md:flex"
            >
              <ChevronLeft size={20} />
            </button>


            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollCategories("right")}
              className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 rounded-full border border-[#f0dfe6] bg-white p-3 shadow-lg transition hover:text-[#d92f66]"
            >
              <ChevronRight size={20} />
            </button>


            <div
              ref={categoryScrollRef}
              className="overflow-x-auto px-1 pb-4 scrollbar-hide"
            >

              <div className="flex min-w-max gap-5">

                {categoryItems.map((category) => (

                  <Link
                    key={category.name}
                    href={category.href}
                    className="group w-[170px] overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white transition hover:-translate-y-1 hover:border-[#d92f66] hover:shadow-lg"
                  >

                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#fff6f9] p-4 text-center text-sm font-semibold text-[#667085]">
                      {category.image ? <img src={category.image} alt="" className="h-full w-full object-cover" /> : "Add Image"}
                    </div>

                    <div className="p-4">

                      <h3 className="font-bold text-[#172033] group-hover:text-[#d92f66]">
                        {category.name}
                      </h3>

                      <p className="mt-1 text-xs text-[#667085]">
                        Explore gifts →
                      </p>

                    </div>

                  </Link>

                ))}

              </div>

            </div>

          </div>

        </section>


        {/* =========================================
            GIFTS BEYOND ORDINARY
        ========================================= */}

        <section className="bg-[#fff6f9] py-14">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="mb-8">

              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
                Unique Gifting
              </p>

              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                Gifts Beyond Ordinary
              </h2>

            </div>


            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">

              {giftTypeItems.map((gift) => (

                <Link
                  key={gift.name}
                  href={gift.href}
                  className="group flex min-h-[170px] flex-col items-center justify-center rounded-[999px] border border-[#f0dfe6] bg-white p-5 text-center transition hover:-translate-y-1 hover:border-[#d92f66] hover:shadow-lg"
                >

                  <div className="text-4xl">
                    {gift.icon}
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-[#172033] group-hover:text-[#d92f66]">
                    {gift.name}
                  </h3>

                </Link>

              ))}

            </div>

          </div>

        </section>


        {/* =========================================
            FEATURED BIRTHDAY GIFTS
        ========================================= */}

        <section
          id="birthday-gifts"
          className="mx-auto max-w-7xl px-4 py-14 lg:px-8"
        >

          <div className="mb-8 flex items-end justify-between">

            <div>

              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
                Prime Picks
              </p>

              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                Trending Birthday Gifts
              </h2>

              <p className="mt-3 text-[#667085]">
                Handpicked gifts to make their
                birthday extra special.
              </p>

            </div>

            <Link
              href="/birthday"
              className="hidden text-sm font-bold text-[#d92f66] hover:underline sm:block"
            >
              View All →
            </Link>

          </div>


          {/* =========================================
              FEATURED PRODUCTS
          ========================================= */}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {catalogLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <article key={index} className="overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white opacity-60">
                    <div className="aspect-square bg-[#fff6f9]" />
                    <div className="gift4u-card-content p-5">
                      <div className="h-4 w-2/3 rounded-full bg-[#f5e4ea]" />
                      <div className="mt-3 h-5 w-1/2 rounded-full bg-[#f5e4ea]" />
                    </div>
                  </article>
                ))
              ) : featuredProducts.length === 0 ? (
                <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-dashed border-[#f0dfe6] bg-white p-10 text-center text-sm text-[#667085]">
                  Birthday gifts will appear here once they are published in the catalog.
                </div>
              ) : featuredProducts.map((product) => (

              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >

                <div className="relative aspect-square overflow-hidden bg-[#fff6f9]">

                  <div className="flex h-full w-full items-center justify-center text-center text-sm font-semibold text-[#667085]">
                    Add Product Image
                  </div>


                  {/* =========================================
                      WISHLIST BUTTON
                  ========================================= */}

                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    aria-label={
                      isInWishlist(String(product.id))
                        ? `Remove ${product.name} from wishlist`
                        : `Add ${product.name} to wishlist`
                    }
                    className={`absolute right-3 top-3 rounded-full bg-white p-2.5 shadow-sm transition ${
                      isInWishlist(String(product.id))
                        ? "text-[#d92f66]"
                        : "text-[#172033] hover:text-[#d92f66]"
                    }`}
                  >

                    <Heart
                      size={18}
                      fill={
                        isInWishlist(String(product.id))
                          ? "currentColor"
                          : "none"
                      }
                    />

                  </button>

                </div>


                <div className="gift4u-card-content p-5">

                  <div className="flex items-center gap-1 text-sm font-semibold text-[#172033]">

                    <Star
                      size={15}
                      className="fill-[#f5aa18] text-[#f5aa18]"
                    />

                    4.8

                    <span className="ml-1 font-normal text-[#667085]">
                      (120)
                    </span>

                  </div>


                  <h3 className="mt-2 text-lg font-bold text-[#172033]">
                    {product.name}
                  </h3>


                  <p className="mt-3 text-xl font-bold text-[#172033]">
                    ₹{product.price}
                  </p>


                  {/* ADD TO CART */}

                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#d92f66] px-4 py-3 font-semibold text-white transition hover:bg-[#bd1d52]"
                  >

                    <ShoppingCart size={18} />

                    Add to Cart

                  </button>

                </div>

              </article>

            ))}

          </div>

        </section>


        {/* =========================================
            SHOP BY BUDGET
        ========================================= */}

        <section className="bg-[#fff6f9] py-14">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="mb-8">

              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
                Price Wise Gifts
              </p>

              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                Gifts For Every Budget
              </h2>

            </div>


            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {budgetItems.map((budget) => (

                <Link
                  key={budget.title}
                  href={budget.href}
                  className="group relative overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white p-6 transition hover:-translate-y-1 hover:border-[#d92f66] hover:shadow-lg"
                >

                  <div className="absolute right-[-15px] top-[-15px] h-20 w-20 rounded-full bg-[#fff0f5]" />

                  <Gift
                    size={30}
                    className="relative text-[#d92f66]"
                  />

                  <h3 className="relative mt-5 text-lg font-bold text-[#172033] group-hover:text-[#d92f66]">
                    {budget.title}
                  </h3>

                  <p className="relative mt-2 text-sm text-[#667085]">
                    {budget.subtitle}
                  </p>

                  <span className="relative mt-5 inline-block text-sm font-bold text-[#d92f66]">
                    Shop Now →
                  </span>

                </Link>

              ))}

            </div>

          </div>

        </section>


        {/* =========================================
            PERSONALIZED BIRTHDAY GIFTS BANNER
        ========================================= */}

        <section className="px-4 py-14 lg:px-8">

          <Link
            href="/personalised"
            className="group mx-auto block max-w-7xl overflow-hidden rounded-3xl"
          >

            <div className="relative min-h-[320px] bg-[#fff0f5] p-8 sm:p-12 lg:p-16">

              <div className="relative z-10 max-w-md">

                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
                  Make It Personal
                </p>

                <h2 className="gift-heading mt-3 text-4xl font-bold text-[#172033]">
                  Personalised Birthday Gifts
                </h2>

                <p className="mt-4 text-[#667085]">
                  Turn memories into meaningful gifts
                  with a special personal touch.
                </p>

                <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3 font-semibold text-white transition group-hover:bg-[#bd1d52]">

                  Explore Personalised Gifts

                  <ArrowRight size={18} />

                </span>

              </div>

            </div>

          </Link>

        </section>

      </main>


      {/* =========================================
          FOOTER
      ========================================= */}

      <Footer />

    </>
  );
}