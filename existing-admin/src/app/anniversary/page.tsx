"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  ArrowRight,
  Frame,
  Gem,
  Gift,
  Heart,
  ShoppingCart,
  Sparkles,
  Star,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";

import {
  useWishlist,
  type WishlistProduct,
} from "@/contexts/WishlistContext";
import { useCatalog } from "@/hooks/useCatalog";
import type { MerchandisingItem } from "@/lib/merchandising/types";

/* =====================================================
   TYPE DEFINITIONS
   ===================================================== */

interface CartProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface AnniversaryEssential {
  name: string;
  href: string;
  icon: ReactNode;
}

interface LovedOne {
  name: string;
  href: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  category: string;
  image?: string;
}

/* =====================================================
   ANNIVERSARY ESSENTIALS
   ===================================================== */

const anniversaryEssentials: AnniversaryEssential[] = [
  {
    name: "Chocolates",
    href: "/anniversary?category=chocolates",
    icon: <Gift size={28} />,
  },
  {
    name: "Jewellery",
    href: "/anniversary?category=jewellery",
    icon: <Gem size={28} />,
  },
  {
    name: "Soft Toys",
    href: "/anniversary?category=soft-toys",
    icon: <Heart size={28} />,
  },
  {
    name: "Photo Frames",
    href: "/anniversary?category=photo-frames",
    icon: <Frame size={28} />,
  },
  {
    name: "Combos",
    href: "/anniversary?category=combos",
    icon: <Sparkles size={28} />,
  },
  {
    name: "Personalised Gifts",
    href: "/personalised",
    icon: <Sparkles size={28} />,
  },
  {
    name: "Gift Hampers",
    href: "/hampers",
    icon: <Gift size={28} />,
  },
  {
    name: "Greeting Cards",
    href: "/anniversary?category=cards",
    icon: <Frame size={28} />,
  },
];

/* =====================================================
   GIFTS FOR LOVED ONES
   ===================================================== */

const lovedOnes: LovedOne[] = [
  {
    name: "For Bride",
    href: "/anniversary?recipient=bride",
  },
  {
    name: "For Groom",
    href: "/anniversary?recipient=groom",
  },
  {
    name: "For Relatives",
    href: "/anniversary?recipient=relatives",
  },
  {
    name: "For Friends",
    href: "/anniversary?recipient=friends",
  },
  {
    name: "For Couples",
    href: "/anniversary?recipient=couples",
  },
  {
    name: "For Parents",
    href: "/anniversary?recipient=parents",
  },
];

/* =====================================================
   ANNIVERSARY MILESTONES
   ===================================================== */

const milestones = [
  {
    name: "1st Anniversary",
    href: "/anniversary?milestone=1st",
  },
  {
    name: "5th Anniversary",
    href: "/anniversary?milestone=5th",
  },
  {
    name: "10th Anniversary",
    href: "/anniversary?milestone=10th",
  },
  {
    name: "25th Anniversary",
    href: "/anniversary?milestone=25th",
  },
  {
    name: "50th Anniversary",
    href: "/anniversary?milestone=50th",
  },
];

/* =====================================================
   FEATURED ANNIVERSARY PRODUCTS

   PRODUCT IMAGES WILL BE ADDED LATER.

   Recommended folder:

   public/images/anniversary/

   ===================================================== */

export default function AnniversaryPage() {
  const { data: catalog, loading: catalogLoading, error: catalogError } = useCatalog();
  const [merchandisingItems, setMerchandisingItems] = useState<MerchandisingItem[]>([]);

  useEffect(() => {
    fetch("/api/merchandising/anniversary", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { items?: MerchandisingItem[] } | null) => setMerchandisingItems(data?.items?.filter((item) => item.active) ?? []))
      .catch(() => setMerchandisingItems([]));
  }, []);

  const cmsItems = useMemo(() => (type: MerchandisingItem["type"]) => merchandisingItems.filter((item) => item.type === type).sort((a, b) => a.sortOrder - b.sortOrder), [merchandisingItems]);
  const cmsCategories = cmsItems("category");
  const cmsLovedOnes = cmsItems("lovedOne");
  const cmsMilestones = cmsItems("milestone");
  const cmsBudgets = cmsItems("budget");
  const anniversaryCategoryItems = cmsCategories.length ? cmsCategories.map((item) => ({ name: item.name, href: `/anniversary?category=${item.relatedId || item.slug}`, icon: <Gift size={28} /> })) : anniversaryEssentials;
  const lovedOneItems = cmsLovedOnes.length ? cmsLovedOnes.map((item) => ({ name: item.name, href: `/anniversary?recipient=${item.relatedId || item.slug}` })) : lovedOnes;
  const milestoneItems = cmsMilestones.length ? cmsMilestones.map((item) => ({ name: item.name, href: `/anniversary?milestone=${item.years ?? item.slug}` })) : milestones;
  const budgetItems = cmsBudgets.map((item) => ({ name: item.name, subtitle: item.subtitle || "Thoughtful gifts", href: `/anniversary?budget=${item.slug}` }));
  const anniversaryOccasionId = catalog?.occasions.find((occasion) => occasion.slug === "anniversary")?.id;
  const featuredProducts: Product[] = (catalog?.products ?? [])
    .filter((product) => product.status === "live")
    .filter((product) => !anniversaryOccasionId || product.occasionIds.includes(anniversaryOccasionId))
    .slice(0, 8)
    .map((product) => ({ id: product.id, name: product.title, price: product.price, rating: product.rating, category: "Gift", image: product.thumbnail }));

  const router = useRouter();

  /* ===================================================
     WISHLIST CONTEXT
     =================================================== */

  const {
    wishlist,
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();

  /* ===================================================
     CHECK IF PRODUCT IS IN WISHLIST
     =================================================== */

  const isInWishlist = (productId: string) => {
    return wishlist.some(
      (item) => item.id === productId
    );
  };

  /* ===================================================
     TOGGLE WISHLIST

     If product exists:
     → Remove from wishlist

     If product does not exist:
     → Add to wishlist
     =================================================== */

  const toggleWishlist = (product: Product) => {
    const productExists = isInWishlist(product.id);

    if (productExists) {
      removeFromWishlist(product.id);
    } else {
      const wishlistProduct: WishlistProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
      };

      addToWishlist(wishlistProduct);
    }
  };

  /* ===================================================
     ADD PRODUCT TO CART
     =================================================== */

  const addToCart = (product: Product) => {
    try {
      const savedCart =
        localStorage.getItem("gift4u-cart");

      const cart: CartProduct[] = savedCart
        ? JSON.parse(savedCart)
        : [];

      const existingProduct = cart.find(
        (item) => item.id === product.id
      );

      /* ===============================================
         PRODUCT ALREADY EXISTS
         =============================================== */

      if (existingProduct) {
        existingProduct.quantity += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        });
      }

      /* ===============================================
         SAVE CART
         =============================================== */

      localStorage.setItem(
        "gift4u-cart",
        JSON.stringify(cart)
      );

      /* ===============================================
         UPDATE HEADER CART COUNT
         =============================================== */

      window.dispatchEvent(
        new Event("cartUpdated")
      );

      /* ===============================================
         REDIRECT TO CART
         =============================================== */

      router.push("/cart?added=true");
    } catch (error) {
      console.error(
        "Unable to add product to cart:",
        error
      );
    }
  };

  return (
    <>
      {/* =================================================
          HEADER
          ================================================= */}

      <Header />

      {/* =================================================
          BREADCRUMB
          ================================================= */}

      <Breadcrumb currentPage="Anniversary" />

      <main className="gift4u-template-page">

        {/* =================================================
            HERO SECTION
            ================================================= */}

        <section className="bg-[#fff6f9]">
          <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">

            <div className="gift4u-standard-hero relative min-h-[520px] overflow-hidden rounded-[2.5rem] border border-[#f0dfe6] sm:min-h-[600px] lg:min-h-[620px]">

              {/* =============================================
                  BACKGROUND IMAGE

                  Image location:

                  public/images/anniversary/
                  anniversary-hero.png
                  ============================================= */}

              <Image
                src="/images/anniversary/anniversary-hero.png"
                alt="Anniversary gifts and gift boxes"
                fill
                priority
                className="object-cover"
              />

              {/* =============================================
                  LIGHT OVERLAY
                  ============================================= */}

              <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent" />

              {/* =============================================
                  HERO CONTENT
                  ============================================= */}

              <div className="gift4u-standard-hero-content relative z-10 flex min-h-[520px] items-center px-7 py-12 sm:px-12 lg:min-h-[620px] lg:px-20">

                <div className="max-w-2xl">

                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b52b55] sm:text-base">
                    Celebrate Love & Memories
                  </p>

                  <h1 className="gift-heading mt-5 text-5xl font-bold leading-[1.05] text-[#172033] sm:text-6xl lg:text-7xl">

                    Gifts for Every

                    <span className="mt-2 block text-[#d92f66]">
                      Anniversary.
                    </span>

                  </h1>

                  <p className="mt-7 max-w-xl text-base leading-8 text-[#4b5565] sm:text-lg">

                    Celebrate beautiful memories,
                    unforgettable milestones and the
                    special bond you share with
                    thoughtful anniversary gifts.

                  </p>

                  <Link
                    href="#anniversary-gifts"
                    className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#d92f66] px-7 py-4 text-base font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#bd1d52]"
                  >

                    Explore Anniversary Gifts

                    <ArrowRight size={20} />

                  </Link>

                </div>

              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />

            </div>

          </div>
        </section>


        {/* =================================================
            ANNIVERSARY ESSENTIALS
            ================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">

          <div className="mb-8">

            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
              Everything for the celebration
            </p>

            <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
              Anniversary Essentials
            </h2>

            <p className="mt-3 text-[#667085]">
              Thoughtful surprises to make every
              anniversary celebration more memorable.
            </p>

          </div>


          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">

            {anniversaryEssentials.map((item) => (

              <Link
                key={item.name}
                href={item.href}
                className="group text-center"
              >

                <div className="mx-auto flex aspect-square w-full max-w-[125px] items-center justify-center rounded-full border border-[#f0dfe6] bg-[#fff6f9] text-[#d92f66] shadow-sm transition duration-300 group-hover:-translate-y-2 group-hover:border-[#d92f66] group-hover:shadow-lg">

                  {item.icon}

                </div>

                <p className="mt-3 text-sm font-bold text-[#172033] transition group-hover:text-[#d92f66]">
                  {item.name}
                </p>

              </Link>

            ))}

          </div>

        </section>


        {/* =================================================
            FOR YOUR LOVED ONES
            ================================================= */}

        <section className="bg-[#fff6f9] py-14">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="mb-9 text-center">

              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
                Made for everyone
              </p>

              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                For Your Loved Ones
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-[#667085]">
                Find the perfect anniversary surprise
                for the people who matter most.
              </p>

            </div>


            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">

              {lovedOneItems.map((person) => (

                <Link
                  key={person.name}
                  href={person.href}
                  className="group"
                >

                  <div
                    className="relative flex aspect-[4/5] items-center justify-center overflow-hidden border border-[#f0dfe6] bg-white p-4 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:border-[#d92f66] hover:shadow-xl"
                    style={{
                      clipPath:
                        "polygon(25% 0%, 75% 0%, 100% 18%, 100% 82%, 75% 100%, 25% 100%, 0% 82%, 0% 18%)",
                    }}
                  >

                    <div className="flex h-full w-full flex-col items-center justify-center">

                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f8e8ee] text-[#d92f66]">

                        <Heart size={27} />

                      </div>

                      <p className="mt-5 text-sm font-bold text-[#172033] group-hover:text-[#d92f66]">
                        {person.name}
                      </p>

                      <span className="mt-2 text-xs font-medium text-[#667085]">
                        Explore Gifts
                      </span>

                    </div>

                  </div>

                </Link>

              ))}

            </div>

          </div>

        </section>


        {/* =================================================
            ANNIVERSARY MILESTONES
            ================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">

          <div className="mb-8">

            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
              Every year tells a story
            </p>

            <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
              Celebrate Every Milestone
            </h2>

          </div>


          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            {milestoneItems.map((milestone) => (

              <Link
                key={milestone.name}
                href={milestone.href}
                className="group relative overflow-hidden rounded-t-[4rem] rounded-b-2xl border border-[#f0dfe6] bg-[#fff6f9] p-7 text-center transition hover:-translate-y-2 hover:border-[#d92f66] hover:shadow-lg"
              >

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#d92f66] shadow-sm">

                  <Gift size={28} />

                </div>

                <h3 className="mt-5 font-bold text-[#172033] group-hover:text-[#d92f66]">
                  {milestone.name}
                </h3>

                <p className="mt-2 text-xs text-[#667085]">
                  Explore Gifts
                </p>

              </Link>

            ))}

          </div>

        </section>


        {cmsBudgets.length > 0 && (
          <section className="bg-[#fff6f9] py-14">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">Price Wise Gifts</p>
                <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">Anniversary Gifts For Every Budget</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {budgetItems.map((budget) => (
                  <Link key={budget.name} href={budget.href} className="group rounded-2xl border border-[#f0dfe6] bg-white p-6 transition hover:-translate-y-1 hover:border-[#d92f66] hover:shadow-lg">
                    <Gift size={30} className="text-[#d92f66]" />
                    <h3 className="mt-5 text-lg font-bold text-[#172033] group-hover:text-[#d92f66]">{budget.name}</h3>
                    <p className="mt-2 text-sm text-[#667085]">{budget.subtitle}</p>
                    <span className="mt-5 inline-block text-sm font-bold text-[#d92f66]">Shop Now →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}


        {/* =================================================
            FEATURED ANNIVERSARY GIFTS
            ================================================= */}

        <section
          id="anniversary-gifts"
          className="bg-[#fff6f9] py-14"
        >

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="mb-8">

              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">
                Handpicked with love
              </p>

              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                Featured Anniversary Gifts
              </h2>

              <p className="mt-3 text-[#667085]">
                Discover thoughtful gifts designed to
                make your celebration unforgettable.
              </p>

            </div>


            {/* =============================================
                PRODUCT GRID
                ============================================= */}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {catalogLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <article key={index} className="overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white opacity-60">
                    <div className="aspect-square bg-[#f8e8ee]" />
                    <div className="gift4u-card-content p-5">
                      <div className="h-4 w-2/3 rounded-full bg-[#f5e4ea]" />
                      <div className="mt-3 h-5 w-1/2 rounded-full bg-[#f5e4ea]" />
                    </div>
                  </article>
                ))
              ) : featuredProducts.length === 0 ? (
                <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-dashed border-[#f0dfe6] bg-white p-10 text-center text-sm text-[#667085]">
                  Anniversary gifts will appear here once they are published in the catalog.
                </div>
              ) : featuredProducts.map((product) => {

                const productInWishlist =
                  isInWishlist(product.id);

                return (

                  <article
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white transition hover:-translate-y-1 hover:shadow-xl"
                  >

                    {/* =========================================
                        PRODUCT IMAGE PLACEHOLDER

                        ADD PRODUCT IMAGE HERE LATER

                        Folder:

                        public/images/anniversary/

                        Example:

                        photo-frame.jpg
                        jewellery-set.jpg
                        chocolate-surprise.jpg

                        Replace the placeholder below
                        with an Image component later.

                        ========================================= */}

                    <div className="relative aspect-square overflow-hidden bg-[#f8e8ee]">

                      <div className="flex h-full w-full items-center justify-center p-4 text-center">

                        <span className="text-sm font-semibold text-[#667085]">
                          {product.name} Image
                        </span>

                      </div>


                      {/* FEATURED BADGE */}

                      <span className="absolute left-3 top-3 rounded-full bg-[#d92f66] px-3 py-1 text-xs font-bold text-white">
                        Featured
                      </span>


                      {/* =========================================
                          WISHLIST BUTTON

                          CLICKING THIS BUTTON:

                          • Adds product to Wishlist
                          • Removes product if already added
                          • Changes heart color
                          • Updates Wishlist page

                          ========================================= */}

                      <button
                        type="button"
                        onClick={() =>
                          toggleWishlist(product)
                        }
                        aria-label={
                          productInWishlist
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                        }
                        className={`absolute right-3 top-3 rounded-full bg-white p-2.5 shadow-sm transition ${
                          productInWishlist
                            ? "text-[#d92f66]"
                            : "text-[#172033] hover:text-[#d92f66]"
                        }`}
                      >

                        <Heart
                          size={18}
                          fill={
                            productInWishlist
                              ? "currentColor"
                              : "none"
                          }
                        />

                      </button>

                    </div>


                    {/* =========================================
                        PRODUCT DETAILS
                        ========================================= */}

                    <div className="gift4u-card-content p-5">


                      {/* RATING */}

                      <div className="flex items-center gap-1 text-sm font-semibold text-[#172033]">

                        <Star
                          size={15}
                          className="fill-[#f5aa18] text-[#f5aa18]"
                        />

                        <span>
                          {product.rating}
                        </span>

                      </div>


                      {/* PRODUCT NAME */}

                      <h3 className="mt-2 text-lg font-bold text-[#172033]">
                        {product.name}
                      </h3>


                      {/* PRODUCT PRICE */}

                      <p className="mt-3 text-xl font-bold text-[#172033]">
                        ₹{product.price}
                      </p>


                      {/* =====================================
                          ADD TO CART

                          Automatically:

                          1. Adds product to cart
                          2. Increases quantity if exists
                          3. Updates Header count
                          4. Redirects to Cart page
                          5. Cart page shows bottom popup

                          ===================================== */}

                      <button
                        type="button"
                        onClick={() =>
                          addToCart(product)
                        }
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#d92f66] px-4 py-3 font-semibold text-white transition hover:bg-[#bd1d52]"
                      >

                        <ShoppingCart size={18} />

                        Add to Cart

                      </button>

                    </div>

                  </article>

                );
              })}

            </div>

          </div>

        </section>


        {/* =================================================
            PERSONALISED GIFTS SECTION
            ================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">

          <div className="overflow-hidden rounded-[2rem] border border-[#f0dfe6] bg-[#172033]">

            <div className="grid items-center lg:grid-cols-2">


              {/* TEXT */}

              <div className="p-8 sm:p-12 lg:p-14">

                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f5b3c7]">
                  Make memories personal
                </p>

                <h2 className="gift-heading mt-3 text-3xl font-bold text-white sm:text-4xl">
                  Add a Personal Touch
                </h2>

                <p className="mt-4 max-w-lg leading-7 text-white/75">

                  Turn a beautiful anniversary memory
                  into something truly unforgettable
                  with a thoughtful personalised gift.

                </p>

                <Link
                  href="/personalised"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3 font-semibold text-white transition hover:bg-[#bd1d52]"
                >

                  Explore Personalised Gifts

                  <ArrowRight size={18} />

                </Link>

              </div>


              {/* ===========================================
                  IMAGE PLACEHOLDER

                  Add image later inside:

                  public/images/anniversary/

                  Example:

                  personalised-anniversary.jpg

                  =========================================== */}

              <div className="flex min-h-[300px] items-center justify-center bg-[#263249] p-6 text-center">

                <div>

                  <Heart
                    size={45}
                    className="mx-auto mb-4 text-[#d92f66]"
                  />

                  <p className="font-semibold text-white/70">
                    Add Personalised Gift Image Here
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            ANNIVERSARY HAMPERS
            ================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">

          <Link
            href="/hampers"
            className="group block overflow-hidden rounded-3xl bg-[#172033] transition hover:shadow-2xl"
          >

            <div className="grid min-h-[420px] lg:grid-cols-2">


              {/* LEFT SIDE */}

              <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f3a1ba]">
                  Curated With Love
                </p>

                <h2 className="gift-heading mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
                  Anniversary Hampers
                </h2>

                <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">

                  Celebrate beautiful memories with
                  thoughtfully curated hampers filled
                  with love, surprises and unforgettable
                  gifts.

                </p>

                <div className="mt-8">

                  <span className="inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3.5 font-semibold text-white transition group-hover:bg-[#bd1d52]">

                    Explore Anniversary Hampers

                    <span className="text-xl">
                      →
                    </span>

                  </span>

                </div>

              </div>


              {/* =====================================
                  RIGHT SIDE

                  IMAGE PLACEHOLDER

                  Add image later inside:

                  public/images/anniversary/

                  Example:

                  anniversary-hampers.jpg

                  ===================================== */}

              <div className="relative min-h-[280px] overflow-hidden bg-[#273248] lg:min-h-full">

                <div className="flex h-full min-h-[280px] w-full items-center justify-center p-8 text-center lg:min-h-[420px]">

                  <div>

                    <p className="text-lg font-bold text-white/80">
                      Add Anniversary Hampers Image Here
                    </p>

                    <p className="mt-2 text-sm text-white/50">
                      Image placeholder
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </Link>

        </section>

      </main>


      {/* =================================================
          FOOTER
          ================================================= */}

      <Footer />

    </>
  );
}