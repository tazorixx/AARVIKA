"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCatalog } from "@/hooks/useCatalog";

/* =========================================================
   TYPES
   ========================================================= */

type Product = {
  id: string;
  name: string;
  price: number;
  rating: number;
  category: string;
};

type CartItem = Product & {
  quantity: number;
};

/* =========================================================
   CATALOG DATA

   Category, recipient and product records are loaded from the
   live Firestore catalog. Page-specific personality/brand copy
   remains marketing content because it is not represented by the
   Phase 1 taxonomy model.
   ========================================================= */

/* =========================================================
   PERSONALITIES
   ========================================================= */

const personalities = [
  {
    name: "Fashionista",
    description: "For the one who loves style",
  },
  {
    name: "Decor Enthusiast",
    description: "For lovers of beautiful spaces",
  },
  {
    name: "Gadget Guru",
    description: "For the technology lover",
  },
  {
    name: "Personalisation Fan",
    description: "For those who love meaningful details",
  },
  {
    name: "Music Fan",
    description: "For every music enthusiast",
  },
  {
    name: "Wanderer",
    description: "For the one who loves to explore",
  },
];

/* =========================================================
   BRANDS

   These can later redirect to dedicated brand pages.
   ========================================================= */

const brands = [
  "Nuyug",
  "Ritualistic",
  "Carlton London",
  "Titan",
  "Kimrica",
];

/* =========================================================
   FEATURED PRODUCTS

   Derived from live catalog data inside the page component.
   ========================================================= */

/* =========================================================
   MAIN PAGE COMPONENT
   ========================================================= */

export default function LifestylePage() {
  const {
    data: catalog,
    loading: catalogLoading,
    error: catalogError,
  } = useCatalog();

  const catalogCategories = catalog?.categories ?? [];
  const catalogRecipients = catalog?.recipients ?? [];

  const lifestyleCategories = catalogCategories.slice(0, 6);
  const homeCategories = catalogCategories.slice(6, 14);
  const kidsCategories = catalogCategories.slice(14, 20);

  const giftRecipients = catalogRecipients.map((recipient) => recipient.name);

  const featuredProducts = (catalog?.products ?? []).slice(0, 4).map((product) => ({
    id: product.id,
    name: product.title,
    price: product.price,
    rating: product.rating,
    category: "Gift",
    thumbnail: product.thumbnail,
    slug: product.slug,
    mrp: product.mrp,
    reviewCount: product.reviewCount,
  }));

  /* =======================================================
     GLOBAL WISHLIST

     This connects this page to the central WishlistContext.

     Products added here will automatically appear
     on the Wishlist page.
     ======================================================= */

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  /* =======================================================
     CART TOAST
     ======================================================= */

  const [toastVisible, setToastVisible] = useState(false);

  const [toastMessage, setToastMessage] = useState(
    "Product added to cart successfully!"
  );

  const homeScrollRef = useRef<HTMLDivElement>(null);

  /* =======================================================
     WISHLIST TOGGLE

     If product is already in wishlist:
     → Remove it

     Otherwise:
     → Add it

     ======================================================= */

  const toggleWishlist = (product: Product) => {
    const productId = String(product.id);

    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist({
  id: String(product.id),
  name: product.name,
  price: product.price,
  category: product.category,
});
    }
  };

  /* =======================================================
     ADD PRODUCT TO CART

     Cart is stored in localStorage.

     Storage key:

     "gift4u-cart"

     The Header listens for:

     "cartUpdated"

     ======================================================= */

  const addToCart = (product: Product) => {
    try {
      const existingCart = localStorage.getItem("gift4u-cart");

      let cart: CartItem[] = [];

      if (existingCart) {
        try {
          cart = JSON.parse(existingCart);
        } catch {
          cart = [];
        }
      }

      const existingProductIndex = cart.findIndex(
        (item) => item.id === product.id
      );

      if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += 1;

        setToastMessage(
          "Product quantity updated in cart!"
        );
      } else {
        cart.push({
          ...product,
          quantity: 1,
        });

        setToastMessage("Added to cart!");
      }

      localStorage.setItem(
        "gift4u-cart",
        JSON.stringify(cart)
      );

      /* UPDATE HEADER CART COUNT */

      window.dispatchEvent(
        new Event("cartUpdated")
      );

      setToastVisible(true);

      setTimeout(() => {
        setToastVisible(false);
      }, 3000);
    } catch (error) {
      console.error(
        "Unable to add product to cart:",
        error
      );
    }
  };

  /* =======================================================
     HORIZONTAL SCROLL
     ======================================================= */

  const scrollHomeCategories = (
    direction: "left" | "right"
  ) => {
    if (!homeScrollRef.current) return;

    homeScrollRef.current.scrollBy({
      left:
        direction === "right"
          ? 350
          : -350,
      behavior: "smooth",
    });
  };

  /* =======================================================
     CLEANUP
     ======================================================= */

  useEffect(() => {
    return () => {
      setToastVisible(false);
    };
  }, []);

  return (
    <>
      {/* =====================================================
          HEADER
          ===================================================== */}

      <Header />

      <main className="gift4u-template-page bg-[#fffafc] text-[#172033]">
        {catalogError && (
          <div className="border-b border-[#f0dfe6] bg-[#fffafc] px-4 py-3 text-center text-sm text-[#667085]" role="alert">
            {catalogError}
          </div>
        )}

        <Breadcrumb currentPage="Lifestyle" />


        {/* ===================================================
            HERO SECTION

            HERO IMAGE PLACEHOLDER

            Add image later inside:

            public/images/lifestyle/

            Example:

            public/images/lifestyle/lifestyle-hero.jpg

            =================================================== */}

        <section className="relative overflow-hidden bg-[#f8e8ee]">

          <div className="gift4u-standard-hero mx-auto max-w-7xl">


            <div className="gift4u-standard-hero-content grid h-full items-center gap-10 lg:grid-cols-2">


            {/* HERO CONTENT */}

            <div className="relative z-10 gift4u-hero-copy">

              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">

                <Sparkles
                  className="text-[#d92f66]"
                  size={26}
                />

              </div>


              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d92f66]">

                Discover Your Style

              </p>


              <h1 className="gift-heading mt-4 max-w-2xl text-4xl font-bold leading-tight text-[#172033] sm:text-5xl lg:text-6xl">

                Lifestyle Gifts

                <span className="block text-[#d92f66]">

                  For Every Story

                </span>

              </h1>


              <p className="mt-5 max-w-xl text-lg leading-8 text-[#667085]">

                Discover thoughtful gifts inspired by fashion,
                home, personality, hobbies and everything that
                makes someone unique.

              </p>


              <div className="mt-8 flex flex-wrap gap-4">

                <a
                  href="#explore-lifestyle"
                  className="inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3.5 font-semibold text-white transition hover:bg-[#bd1d52]"
                >

                  Explore Lifestyle Gifts

                  <ArrowRight size={18} />

                </a>


                <a
                  href="#featured-products"
                  className="inline-flex items-center gap-2 rounded-full border border-[#d92f66] bg-white px-6 py-3.5 font-semibold text-[#d92f66] transition hover:bg-[#fff1f5]"
                >

                  Shop Trending

                </a>

              </div>

            </div>


            {/* HERO IMAGE PLACEHOLDER */}

            <div className="relative min-h-[320px] overflow-hidden rounded-[2.5rem] border border-[#ead2dc] bg-white sm:min-h-[400px]">

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#fff6f9] to-[#f3e7ed] p-6 text-center">

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f8dfe8]">

                  <ShoppingBag
                    size={34}
                    className="text-[#d92f66]"
                  />

                </div>


                <p className="mt-5 text-lg font-bold text-[#172033]">

                  Add Lifestyle Hero Image

                </p>


                <p className="mt-2 max-w-xs text-sm text-[#667085]">

                  Fashion, home décor, accessories and
                  lifestyle gifts

                </p>

              </div>

            </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            EXPLORE LIFESTYLE
            =================================================== */}

        <section
          id="explore-lifestyle"
          className="bg-[#fffafc] py-16"
        >

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="mb-9">

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">

                Explore Categories

              </p>


              <h2 className="gift-heading mt-3 text-3xl font-bold text-[#172033] sm:text-4xl">

                Discover Your Lifestyle

              </h2>


              <p className="mt-3 max-w-2xl text-[#667085]">

                Find gifts inspired by personal style,
                hobbies, home and everyday passions.

              </p>

            </div>


            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {lifestyleCategories.map((category) => (

                <Link
                  key={category.name}
                  href={`/lifestyle?category=${encodeURIComponent(category.id)}`}
                  className="group rounded-3xl border border-[#f0dfe6] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#d92f66] hover:shadow-xl"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f5] text-[#d92f66]">

                        <Sparkles size={21} />

                      </div>


                      <h3 className="mt-5 text-xl font-bold text-[#172033]">

                        {category.name}

                      </h3>


                      <p className="mt-2 text-sm leading-6 text-[#667085]">

                        {category.description}

                      </p>

                    </div>


                    <ArrowRight
                      size={21}
                      className="mt-1 shrink-0 text-[#d92f66] transition-transform group-hover:translate-x-1"
                    />

                  </div>

                </Link>

              ))}

            </div>

          </div>

        </section>


        {/* ===================================================
            HOME & LIVING
            =================================================== */}

        <section className="bg-[#fff6f9] py-16">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="flex items-end justify-between gap-5">

              <div>

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">

                  Make Every Space Special

                </p>


                <h2 className="gift-heading mt-3 text-3xl font-bold text-[#172033] sm:text-4xl">

                  Home & Living

                </h2>


                <p className="mt-3 max-w-2xl text-[#667085]">

                  Thoughtful gifts to make every home feel
                  more beautiful, comfortable and personal.

                </p>

              </div>


              {/* SCROLL BUTTONS */}

              <div className="hidden gap-3 sm:flex">

                <button
                  type="button"
                  onClick={() =>
                    scrollHomeCategories("left")
                  }
                  aria-label="Scroll left"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ead2dc] bg-white text-[#172033] transition hover:border-[#d92f66] hover:text-[#d92f66]"
                >

                  <ChevronLeft size={20} />

                </button>


                <button
                  type="button"
                  onClick={() =>
                    scrollHomeCategories("right")
                  }
                  aria-label="Scroll right"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d92f66] text-white transition hover:bg-[#bd1d52]"
                >

                  <ChevronRight size={20} />

                </button>

              </div>

            </div>


            <div
              ref={homeScrollRef}
              className="mt-10 flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
            >

              {homeCategories.map((category) => (

                <Link
                  key={category.name}
                  href={`/lifestyle?category=${encodeURIComponent(category.id)}`}
                  className="group flex min-w-[150px] flex-col items-center text-center"
                >

                  {/* IMAGE PLACEHOLDER

                      Future image folder:

                      public/images/lifestyle/home/

                  */}

                  <div className="flex h-32 w-32 items-center justify-center rounded-full border border-[#ead2dc] bg-white p-5 shadow-sm transition duration-300 group-hover:scale-105 group-hover:border-[#d92f66] group-hover:shadow-lg">

                    <span className="text-center text-sm font-semibold text-[#667085]">

                      Image

                    </span>

                  </div>


                  <h3 className="mt-4 text-sm font-bold text-[#172033] transition group-hover:text-[#d92f66]">

                    {category.name}

                  </h3>

                </Link>

              ))}

            </div>

          </div>

        </section>


        {/* ===================================================
            GIFTS FOR EVERYONE
            =================================================== */}

        <section className="bg-white py-16">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="text-center">

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">

                Find The Perfect Match

              </p>


              <h2 className="gift-heading mt-3 text-3xl font-bold text-[#172033] sm:text-4xl">

                Gifts For Everyone

              </h2>


              <p className="mx-auto mt-3 max-w-2xl text-[#667085]">

                Choose thoughtful gifts for the people who
                make your life special.

              </p>

            </div>


            <div className="mx-auto mt-10 flex max-w-5xl flex-wrap justify-center gap-4">

              {giftRecipients.map((person) => (

                <Link
                  key={person}
                  href={`/lifestyle?for=${person.toLowerCase()}`}
                  className="rounded-full border border-[#ead2dc] bg-[#fffafc] px-6 py-3 font-semibold text-[#172033] transition hover:border-[#d92f66] hover:bg-[#d92f66] hover:text-white"
                >

                  For {person}

                </Link>

              ))}

            </div>

          </div>

        </section>


        {/* ===================================================
            FEATURED PRODUCTS

            WISHLIST IS ACTIVE HERE.
            =================================================== */}

        <section
          id="featured-products"
          className="bg-[#fff6f9] py-16"
        >

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="mb-9">

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">

                Trending Now

              </p>


              <h2 className="gift-heading mt-3 text-3xl font-bold text-[#172033] sm:text-4xl">

                Lifestyle Favourites

              </h2>


              <p className="mt-3 text-[#667085]">

                Handpicked gifts that combine style,
                comfort and personality.

              </p>

            </div>


            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {featuredProducts.map((product) => {

                const productId = String(product.id);

                const productIsWishlisted =
                  isInWishlist(productId);

                return (

                  <article
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white transition hover:-translate-y-1 hover:shadow-xl"
                  >

                    {/* ===========================================
                        PRODUCT IMAGE PLACEHOLDER

                        Add images inside:

                        public/images/lifestyle/products/

                        =========================================== */}

                    <div className="relative aspect-square overflow-hidden bg-[#f8e8ee]">

                      <div className="flex h-full w-full items-center justify-center p-5 text-center">

                        <span className="text-sm font-semibold text-[#667085]">

                          {product.name}

                          <br />

                          Image

                        </span>

                      </div>


                      {/* ===========================================
                          WORKING WISHLIST BUTTON
                          =========================================== */}

                      <button
                        type="button"
                        onClick={() =>
                          toggleWishlist(product)
                        }
                        aria-label={
                          productIsWishlisted
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                        }
                        aria-pressed={
                          productIsWishlisted
                        }
                        className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition ${
                          productIsWishlisted
                            ? "text-[#d92f66]"
                            : "text-[#172033] hover:text-[#d92f66]"
                        }`}
                      >

                        <Heart
                          size={18}
                          fill={
                            productIsWishlisted
                              ? "currentColor"
                              : "none"
                          }
                        />

                      </button>


                      {/* CATEGORY BADGE */}

                      <span className="absolute left-3 top-3 rounded-full bg-[#172033] px-3 py-1 text-xs font-semibold text-white">

                        {product.category}

                      </span>

                    </div>


                    {/* PRODUCT DETAILS */}

                    <div className="gift4u-card-content p-5">

                      <div className="flex items-center gap-1 text-sm font-semibold">

                        <Star
                          size={15}
                          className="fill-[#f5aa18] text-[#f5aa18]"
                        />

                        <span>

                          {product.rating}

                        </span>


                        <span className="ml-1 font-normal text-[#667085]">

                          (Popular)

                        </span>

                      </div>


                      <h3 className="mt-2 min-h-[56px] text-lg font-bold text-[#172033]">

                        {product.name}

                      </h3>


                      <p className="mt-3 text-xl font-bold text-[#172033]">

                        ₹{product.price}

                      </p>


                      {/* ADD TO CART */}

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


        {/* ===================================================
            SHOP BY PERSONALITY
            =================================================== */}

        <section className="bg-white py-16">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="mb-10">

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">

                Gifts That Feel Personal

              </p>


              <h2 className="gift-heading mt-3 text-3xl font-bold text-[#172033] sm:text-4xl">

                Shop By Personality

              </h2>


              <p className="mt-3 max-w-2xl text-[#667085]">

                Every person is different. Find a gift that
                matches what they love.

              </p>

            </div>


            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">

              {personalities.map((personality) => (

                <Link
                  key={personality.name}
                  href={`/lifestyle?personality=${personality.name
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                  className="group flex flex-col items-center text-center"
                >

                  <div className="flex h-28 w-28 rotate-45 items-center justify-center rounded-3xl border border-[#f0dfe6] bg-[#fff6f9] transition duration-300 group-hover:scale-105 group-hover:border-[#d92f66] group-hover:bg-[#d92f66] group-hover:shadow-lg">

                    <Sparkles
                      size={25}
                      className="-rotate-45 text-[#d92f66] transition group-hover:text-white"
                    />

                  </div>


                  <h3 className="mt-8 text-lg font-bold text-[#172033] group-hover:text-[#d92f66]">

                    {personality.name}

                  </h3>


                  <p className="mt-2 max-w-[220px] text-sm leading-6 text-[#667085]">

                    {personality.description}

                  </p>

                </Link>

              ))}

            </div>

          </div>

        </section>


        {/* ===================================================
            KIDS CORNER
            =================================================== */}

        <section className="theme-dark-section bg-[#172033] py-16">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">


              {/* LEFT CONTENT */}

              <div>

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f6a9bf]">

                  Fun Surprises

                </p>


                <h2 className="gift-heading mt-3 text-3xl font-bold text-white sm:text-4xl">

                  Kids Corner

                </h2>


                <p className="mt-4 max-w-lg text-lg leading-8 text-[#cbd5e1]">

                  Make little moments unforgettable with toys,
                  games, personalised surprises and gifts made
                  especially for kids.

                </p>


                <Link
                  href="/lifestyle?category=kids"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3.5 font-semibold text-white transition hover:bg-[#ef477d]"
                >

                  Explore Kids Gifts

                  <ArrowRight size={18} />

                </Link>

              </div>


              {/* KIDS CATEGORY GRID */}

              <div className="grid gap-4 sm:grid-cols-2">

                {kidsCategories.map((category) => (

                  <Link
                    key={category.name}
                    href={`/lifestyle?category=${encodeURIComponent(category.id)}`}
                    className="group rounded-2xl border border-[#334155] bg-[#202b40] p-5 transition hover:-translate-y-1 hover:border-[#d92f66] hover:bg-[#28344b]"
                  >

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2e3b53]">

                      <Sparkles
                        size={19}
                        className="text-[#f6a9bf]"
                      />

                    </div>


                    <h3 className="mt-4 font-bold text-white">

                      {category.name}

                    </h3>


                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#f6a9bf]">

                      Explore

                      <ArrowRight
                        size={16}
                        className="transition group-hover:translate-x-1"
                      />

                    </div>

                  </Link>

                ))}

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            FINAL LIFESTYLE BANNER

            Future image location:

            public/images/lifestyle/lifestyle-banner.jpg

            =================================================== */}

        <section className="bg-white py-16">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#172033] px-6 py-14 sm:px-10 lg:px-16 lg:py-16">

              <div className="relative z-10 max-w-2xl">

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f6a9bf]">

                  Thoughtfully Chosen

                </p>


                <h2 className="gift-heading mt-3 text-3xl font-bold text-white sm:text-4xl">

                  Find Something That Feels Just Right

                </h2>


                <p className="mt-4 text-lg leading-8 text-[#cbd5e1]">

                  From everyday favourites to unforgettable
                  surprises, explore gifts that match every
                  personality and lifestyle.

                </p>


                <Link
                  href="/lifestyle"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3.5 font-semibold text-white transition hover:bg-[#ef477d]"
                >

                  Explore All Lifestyle Gifts

                  <ArrowRight size={18} />

                </Link>

              </div>


              {/* ===============================================
                  BANNER IMAGE PLACEHOLDER

                  Add image later inside:

                  public/images/lifestyle/

                  Recommended filename:

                  lifestyle-banner.jpg

                  =============================================== */}

              <div className="absolute right-0 top-0 hidden h-full w-[42%] items-center justify-center lg:flex">

                <div className="flex h-56 w-56 items-center justify-center rounded-full border border-[#475569] bg-[#202b40] text-center">

                  <div>

                    <ShoppingBag
                      size={40}
                      className="mx-auto text-[#f6a9bf]"
                    />

                    <p className="mt-4 text-sm font-semibold text-[#cbd5e1]">

                      Add Banner Image

                      <br />

                      Here

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          BOTTOM ADD TO CART POPUP
          ===================================================== */}

      <div
        className={`fixed bottom-5 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#172033] px-5 py-4 text-white shadow-2xl transition-all duration-300 ${
          toastVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-10 opacity-0"
        }`}
      >

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d92f66]">

          <CheckCircle2 size={21} />

        </div>


        <div className="flex-1">

          <p className="font-semibold">

            {toastMessage}

          </p>


          <Link
            href="/cart"
            className="mt-1 inline-block text-sm text-[#f6a9bf] hover:text-white"
          >

            View Cart →

          </Link>

        </div>

      </div>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <Footer />

    </>
  );
}