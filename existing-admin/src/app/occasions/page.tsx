"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { RefObject } from "react";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Gift,
  Heart,
  ShoppingCart,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCatalog } from "@/hooks/useCatalog";


type OccasionItem = {
  id: string;
  name: string;
  image: string;
};

type FeaturedProduct = {
  id: string;
  name: string;
  price: number;
  rating: string;
  image: string;
  category: string;
};

type CartItem = FeaturedProduct & {
  quantity: number;
};

/* =====================================================
   POPULAR OCCASIONS

   TO ADD IMAGE LATER:

   1. Put your image inside:
      public/images/occasions/

   2. Example:
      image: "/images/occasions/diwali.jpg"

   Keep image: "" if you want the placeholder.
   ===================================================== */

export default function OccasionsPage() {
  const { data: catalog, loading: catalogLoading, error: catalogError } = useCatalog();

  const popularOccasions: OccasionItem[] = (catalog?.occasions ?? []).slice(0, 8).map((occasion) => ({
    id: occasion.id,
    name: occasion.name,
    image: occasion.image ?? "",
  }));

  const occasionTypes: OccasionItem[] = (catalog?.occasions ?? []).map((occasion) => ({
    id: occasion.id,
    name: occasion.name,
    image: occasion.image ?? "",
  }));

  const featuredProducts: FeaturedProduct[] = (catalog?.products ?? [])
    .filter((product) => product.status === "live" && product.featured)
    .slice(0, 8)
    .map((product) => ({ id: product.id, name: product.title, price: product.price, rating: String(product.rating), image: product.thumbnail, category: "Occasions" }));

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  const toggleWishlist = (product: FeaturedProduct) => {
    const productId = String(product.id);

    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
      return;
    }

    addToWishlist({
      id: productId,
      name: product.name,
      price: product.price,
      image: product.image || undefined,
      category: product.category,
    });
  };


  /* ===================================================
     HORIZONTAL SCROLL REFERENCES
     =================================================== */

  const popularRailRef = useRef<HTMLDivElement>(null);

  const occasionTypeRailRef = useRef<HTMLDivElement>(null);


  /* ===================================================
     BOTTOM CART POPUP STATES
     =================================================== */

  const [showCartToast, setShowCartToast] = useState(false);

  const [addedProduct, setAddedProduct] = useState("");


  /* ===================================================
     SCROLL FUNCTION

     Used for horizontal scrolling.
     =================================================== */

  const scrollRail = (
    ref: RefObject<HTMLDivElement | null>,
    direction: "left" | "right"
  ) => {

    if (!ref.current) return;

    const scrollAmount = 350;

    ref.current.scrollBy({
      left:
        direction === "right"
          ? scrollAmount
          : -scrollAmount,

      behavior: "smooth",
    });

  };


  /* ===================================================
     ADD TO CART FUNCTION

     Cart is stored in localStorage.

     localStorage key:

     "gift4u-cart"
     =================================================== */

  const addToCart = (product: FeaturedProduct) => {


    /* Get existing cart */

    const existingCart: CartItem[] = JSON.parse(
      localStorage.getItem("gift4u-cart") || "[]"
    );


    /* Check if product already exists */

    const existingProduct = existingCart.find(
      (item) => item.id === product.id
    );


    let updatedCart;


    /* ===============================================
       PRODUCT ALREADY EXISTS

       Increase quantity.
       =============================================== */

    if (existingProduct) {

      updatedCart = existingCart.map((item) => {

        if (item.id === product.id) {

          return {
            ...item,
            quantity: item.quantity + 1,
          };

        }

        return item;

      });

    } else {


      /* =============================================
         PRODUCT DOES NOT EXIST

         Add new product.
         ============================================= */

      updatedCart = [

        ...existingCart,

        {
          ...product,
          quantity: 1,
        },

      ];

    }


    /* ===============================================
       SAVE CART
       =============================================== */

    localStorage.setItem(
      "gift4u-cart",
      JSON.stringify(updatedCart)
    );


    /* ===============================================
       UPDATE HEADER CART COUNT

       Header.jsx listens for this event.
       =============================================== */

    window.dispatchEvent(
      new Event("cartUpdated")
    );


    /* ===============================================
       SHOW BOTTOM POPUP

       NO alert()
       NO top notification
       =============================================== */

    setAddedProduct(product.name);

    setShowCartToast(true);


    /* ===============================================
       AUTO CLOSE POPUP AFTER 3 SECONDS
       =============================================== */

    setTimeout(() => {

      setShowCartToast(false);

    }, 3000);

  };


  return (

    <>


      {/* =================================================
          HEADER
          ================================================= */}

      <Header />


      {/* =================================================
          BREADCRUMB

          Displays:

          Home > Occasions
          ================================================= */}

      <Breadcrumb currentPage="Occasions" />


      <main className="gift4u-template-page">


        {/* =================================================
            HERO SECTION

            ADD HERO BACKGROUND IMAGE HERE.

            Example:

            <img
              src="/images/occasions/occasion-hero.jpg"
              alt="Occasion Gifts"
              className="absolute inset-0 h-full w-full object-cover"
            />

            Put your image inside:

            public/images/occasions/
            ================================================= */}

        <section className="px-4 py-6 lg:px-8">

          <div className="gift4u-standard-hero relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#f7e9ef]">


            {/* =============================================
                HERO BACKGROUND IMAGE AREA
                ============================================= */}

            <div className="absolute inset-0">


              {/*
              
              ADD HERO BACKGROUND IMAGE HERE

              Example:

              <img
                src="/images/occasions/occasion-hero.jpg"
                alt="Occasions"
                className="h-full w-full object-cover"
              />

              */}


              {/* Placeholder background */}

              <div className="h-full w-full bg-[#f3e5eb]" />

            </div>


            {/* Dark overlay */}

            <div className="absolute inset-0 bg-[#172033]/10" />


            {/* HERO TEXT */}

            <div className="gift4u-standard-hero-content relative z-10 flex min-h-[420px] items-center px-6 py-16 sm:px-12 lg:min-h-[480px] lg:px-16">


              <div className="max-w-2xl">


                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">

                  Celebrate Every Moment

                </p>


                <h1 className="gift-heading mt-4 text-5xl font-bold leading-tight text-[#172033] sm:text-6xl">

                  Occasions Make Life

                  <span className="block text-[#d92f66]">

                    Brighter.

                  </span>

                </h1>


                <p className="mt-5 text-lg leading-8 text-[#667085]">

                  Thoughtful gifts for every festival,
                  tradition, celebration and special
                  moment in life.

                </p>


                <Link
                  href="#featured-gifts"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3.5 font-semibold text-white transition hover:bg-[#bd1d52]"
                >

                  Explore All Occasions

                  <ChevronRight size={19} />

                </Link>


              </div>


            </div>


          </div>


        </section>


        {/* =================================================
            POPULAR OCCASIONS
            ================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">


          {/* SECTION HEADER */}

          <div className="mb-7 flex items-end justify-between gap-4">


            <div>


              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">

                Celebrate traditions

              </p>


              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">

                Popular Occasions

              </h2>


              <p className="mt-3 text-[#667085]">

                Find the perfect gift for every celebration.

              </p>


            </div>


            {/* DESKTOP SCROLL BUTTONS */}

            <div className="hidden items-center gap-2 sm:flex">


              <button
                type="button"
                onClick={() =>
                  scrollRail(
                    popularRailRef,
                    "left"
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f0dfe6] bg-white text-[#172033] transition hover:border-[#d92f66] hover:text-[#d92f66]"
                aria-label="Scroll left"
              >

                <ArrowLeft size={18} />

              </button>


              <button
                type="button"
                onClick={() =>
                  scrollRail(
                    popularRailRef,
                    "right"
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d92f66] text-white transition hover:bg-[#bd1d52]"
                aria-label="Scroll right"
              >

                <ArrowRight size={18} />

              </button>


            </div>


          </div>


          {/* =============================================
              HORIZONTAL OCCASION CARDS
              ============================================= */}

          <div
            ref={popularRailRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-3"
          >


            {popularOccasions.map((occasion) => (


              <Link
                key={occasion.id}
                href="/occasions"
                className="group relative h-[210px] min-w-[160px] overflow-hidden rounded-2xl border border-[#f0dfe6] bg-[#fff6f9] transition hover:-translate-y-1 hover:border-[#d92f66] hover:shadow-lg"
              >


                {/* IMAGE AREA */}

                {occasion.image ? (


                  <img
                    src={occasion.image}
                    alt={occasion.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />


                ) : (


                  <div className="flex h-full w-full items-center justify-center bg-[#f8e8ee] p-4 text-center text-sm font-semibold text-[#8c6c77]">


                    {/*
                    
                    ADD IMAGE HERE

                    Update:

                    image: ""

                    to:

                    image: "/images/occasions/example.jpg"

                    */}

                    Add Image


                  </div>


                )}


                {/* TEXT OVERLAY */}

                <div className="absolute inset-x-0 bottom-0 bg-[#172033] p-4 text-white">


                  <h3 className="text-base font-bold">

                    {occasion.name}

                  </h3>


                  <p className="mt-1 text-xs text-white/80">

                    Explore gifts →

                  </p>


                </div>


              </Link>


            ))}


          </div>


          {/* MOBILE RIGHT SCROLL BUTTON */}

          <div className="mt-4 flex justify-end sm:hidden">


            <button
              type="button"
              onClick={() =>
                scrollRail(
                  popularRailRef,
                  "right"
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d92f66] text-white"
              aria-label="Scroll right"
            >

              <ArrowRight size={18} />

            </button>


          </div>


        </section>


        {/* =================================================
            SHOP BY OCCASION TYPE
            ================================================= */}

        <section className="bg-[#fff6f9] py-12">


          <div className="mx-auto max-w-7xl px-4 lg:px-8">


            <div className="mb-7 flex items-end justify-between gap-4">


              <div>


                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">

                  Find your moment

                </p>


                <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">

                  Shop by Occasion Type

                </h2>


              </div>


              {/* RIGHT SCROLL BUTTON */}

              <button
                type="button"
                onClick={() =>
                  scrollRail(
                    occasionTypeRailRef,
                    "right"
                  )
                }
                className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#d92f66] text-white transition hover:bg-[#bd1d52] sm:flex"
                aria-label="Scroll right"
              >

                <ArrowRight size={18} />

              </button>


            </div>


            {/* =============================================
                CIRCULAR OCCASION CARDS
                ============================================= */}

            <div
              ref={occasionTypeRailRef}
              className="flex gap-5 overflow-x-auto scroll-smooth pb-4"
            >


              {occasionTypes.map((occasion) => (


                <Link
                  key={occasion.id}
                  href="/occasions"
                  className="group flex min-w-[120px] flex-col items-center"
                >


                  {/* ROUND IMAGE */}

                  <div className="flex h-[105px] w-[105px] items-center justify-center overflow-hidden rounded-full border-2 border-[#f0dfe6] bg-white transition group-hover:border-[#d92f66] group-hover:shadow-md">


                    {occasion.image ? (


                      <img
                        src={occasion.image}
                        alt={occasion.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />


                    ) : (


                      <div className="flex h-full w-full items-center justify-center bg-[#f8e8ee] p-3 text-center text-xs font-semibold text-[#8c6c77]">


                        {/* ADD ROUND IMAGE HERE */}

                        Add Image


                      </div>


                    )}


                  </div>


                  <p className="mt-3 text-center text-sm font-bold text-[#172033] transition group-hover:text-[#d92f66]">

                    {occasion.name}

                  </p>


                </Link>


              ))}


            </div>


            {/* MOBILE RIGHT BUTTON */}

            <div className="mt-3 flex justify-end sm:hidden">


              <button
                type="button"
                onClick={() =>
                  scrollRail(
                    occasionTypeRailRef,
                    "right"
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d92f66] text-white"
                aria-label="Scroll right"
              >

                <ArrowRight size={18} />

              </button>


            </div>


          </div>


        </section>


        {/* =================================================
            FEATURED OCCASION GIFTS
            ================================================= */}

        <section
          id="featured-gifts"
          className="mx-auto max-w-7xl px-4 py-14 lg:px-8"
        >


          {/* SECTION HEADER */}

          <div className="mb-7">


            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">

              Handpicked for you

            </p>


            <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">

              Featured Occasion Gifts

            </h2>


            <p className="mt-3 text-[#667085]">

              Thoughtfully selected gifts for every celebration.

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
                Featured gifts will appear here once they are published in the catalog.
              </div>
            ) : featuredProducts.map((product) => (


              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >


                {/* =========================================
                    PRODUCT IMAGE
                    ========================================= */}

                <div className="relative aspect-square overflow-hidden">


                  {product.image ? (


                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />


                  ) : (


                    <div className="flex h-full w-full items-center justify-center bg-[#f8e8ee] p-4 text-center text-sm font-semibold text-[#8c6c77]">


                      {/*
                      
                      ADD PRODUCT IMAGE HERE

                      Example:

                      image:
                      "/images/products/product-name.jpg"

                      */}

                      Add Product Image


                    </div>


                  )}


                  {/* POPULAR BADGE */}

                  <span className="absolute left-3 top-3 rounded-full bg-[#d92f66] px-3 py-1 text-xs font-bold text-white">

                    Popular

                  </span>


                  {/* WISHLIST BUTTON */}

                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    aria-label={`${
                      isInWishlist(String(product.id))
                        ? "Remove"
                        : "Add"
                    } ${product.name} ${
                      isInWishlist(String(product.id))
                        ? "from"
                        : "to"
                    } wishlist`}
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


                {/* PRODUCT DETAILS */}

                <div className="gift4u-card-content p-5">


                  {/* PRODUCT RATING */}

                  <div className="flex items-center gap-1 text-sm font-semibold text-[#172033]">


                    <Star
                      size={15}
                      className="fill-[#f5aa18] text-[#f5aa18]"
                    />


                    {product.rating}


                  </div>


                  {/* PRODUCT NAME */}

                  <h3 className="mt-2 min-h-[56px] text-lg font-bold text-[#172033]">

                    {product.name}

                  </h3>


                  {/* PRODUCT PRICE */}

                  <p className="mt-3 text-xl font-bold text-[#172033]">

                    ₹
                    {product.price.toLocaleString("en-IN")}

                  </p>


                  {/* =========================================
                      ADD TO CART BUTTON
                      ========================================= */}

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


        {/* =================================================
            PROMOTIONAL BANNERS
            ================================================= */}

        <section className="bg-[#fff6f9] px-4 py-14 lg:px-8">


          <div className="mx-auto max-w-7xl">


            {/* SECTION HEADING */}

            <div className="mb-7">


              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">

                Something special

              </p>


              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">

                More Ways to Celebrate

              </h2>


            </div>


            {/* =============================================
                HORIZONTAL BANNERS
                ============================================= */}

            <div className="flex gap-6 overflow-x-auto pb-4">


              {/* =============================================
                  PERSONALIZED GIFTS BANNER
                  ============================================= */}

              <Link
                href="/personalised"
                className="group relative min-h-[300px] min-w-full overflow-hidden rounded-3xl bg-[#f3e5eb] sm:min-w-[700px]"
              >


                {/* BACKGROUND IMAGE */}

                <div className="absolute inset-0">


                  {/*
                  
                  ADD PERSONALIZED BANNER IMAGE HERE

                  Example:

                  <img
                    src="/images/banners/personalised-banner.jpg"
                    alt="Personalised Gifts"
                    className="h-full w-full object-cover"
                  />

                  */}


                  <div className="h-full w-full bg-[#f3e5eb]" />


                </div>


                {/* OVERLAY */}

                <div className="absolute inset-0 bg-[#172033]/10" />


                {/* TEXT */}

                <div className="relative z-10 flex min-h-[300px] items-center p-8 sm:p-12">


                  <div className="max-w-md">


                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">

                      Make It Personal

                    </p>


                    <h3 className="gift-heading mt-3 text-4xl font-bold text-[#172033]">

                      Personalised Gifts

                    </h3>


                    <p className="mt-4 text-lg leading-7 text-[#667085]">

                      Add a personal touch to every special moment.

                    </p>


                    <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-5 py-3 font-semibold text-white transition group-hover:bg-[#bd1d52]">


                      Shop Now


                      <ChevronRight size={18} />


                    </span>


                  </div>


                </div>


              </Link>


              {/* =============================================
                  FESTIVE HAMPERS BANNER
                  ============================================= */}

              <Link
                href="/hampers"
                className="group relative min-h-[300px] min-w-full overflow-hidden rounded-3xl bg-[#f8e8ee] sm:min-w-[700px]"
              >


                {/* BACKGROUND IMAGE */}

                <div className="absolute inset-0">


                  {/*
                  
                  ADD HAMPERS BANNER IMAGE HERE

                  Example:

                  <img
                    src="/images/banners/festive-hampers.jpg"
                    alt="Festive Hampers"
                    className="h-full w-full object-cover"
                  />

                  */}


                  <div className="h-full w-full bg-[#f8e8ee]" />


                </div>


                {/* OVERLAY */}

                <div className="absolute inset-0 bg-[#172033]/10" />


                {/* TEXT */}

                <div className="relative z-10 flex min-h-[300px] items-center p-8 sm:p-12">


                  <div className="max-w-md">


                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d92f66]">

                      Curated With Love

                    </p>


                    <h3 className="gift-heading mt-3 text-4xl font-bold text-[#172033]">

                      Festive Hampers

                    </h3>


                    <p className="mt-4 text-lg leading-7 text-[#667085]">

                      Curated hampers filled with love and happiness.

                    </p>


                    <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-5 py-3 font-semibold text-white transition group-hover:bg-[#bd1d52]">


                      Explore Hampers


                      <ChevronRight size={18} />


                    </span>


                  </div>


                </div>


              </Link>


            </div>


          </div>


        </section>


        {/* =================================================
            FEATURES SECTION
            ================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">


          <div className="grid gap-5 sm:grid-cols-3">


            {/* FEATURE 1 */}

            <div className="rounded-2xl border border-[#f0dfe6] bg-white p-6">


              <Gift
                size={28}
                className="text-[#d92f66]"
              />


              <h3 className="mt-4 text-lg font-bold text-[#172033]">

                Thoughtful Gifts

              </h3>


              <p className="mt-2 text-sm leading-6 text-[#667085]">

                Carefully selected gifts for every special occasion.

              </p>


            </div>


            {/* FEATURE 2 */}

            <div className="rounded-2xl border border-[#f0dfe6] bg-white p-6">


              <Sparkles
                size={28}
                className="text-[#d92f66]"
              />


              <h3 className="mt-4 text-lg font-bold text-[#172033]">

                Beautifully Curated

              </h3>


              <p className="mt-2 text-sm leading-6 text-[#667085]">

                Discover gifts designed to make celebrations memorable.

              </p>


            </div>


            {/* FEATURE 3 */}

            <div className="rounded-2xl border border-[#f0dfe6] bg-white p-6">


              <Heart
                size={28}
                className="text-[#d92f66]"
              />


              <h3 className="mt-4 text-lg font-bold text-[#172033]">

                Made With Love

              </h3>


              <p className="mt-2 text-sm leading-6 text-[#667085]">

                Find something meaningful for the people you care about.

              </p>


            </div>


          </div>


        </section>


      </main>


      {/* =================================================
          BOTTOM "ADDED TO CART" POPUP

          IMPORTANT:

          Position:
          bottom-5

          This means the popup will appear at
          the BOTTOM of the screen.

          It will NOT appear at the top.
          ================================================= */}

      {showCartToast && (

        <div className="fixed bottom-5 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:bottom-6">


          <div className="flex items-center gap-3 rounded-2xl bg-[#172033] p-4 text-white shadow-2xl">


            {/* SUCCESS ICON */}

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d92f66]">


              <CheckCircle2 size={23} />


            </div>


            {/* MESSAGE */}

            <div className="min-w-0 flex-1">


              <h3 className="font-bold">

                Added to Cart

              </h3>


              <p className="mt-1 truncate text-sm text-white/75">

                {addedProduct}

              </p>


            </div>


            {/* VIEW CART */}

            <Link
              href="/cart"
              onClick={() => setShowCartToast(false)}
              className="shrink-0 rounded-full bg-[#d92f66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#bd1d52]"
            >

              View Cart

            </Link>


            {/* CLOSE POPUP */}

            <button
              type="button"
              onClick={() => setShowCartToast(false)}
              className="shrink-0 text-white/70 transition hover:text-white"
              aria-label="Close popup"
            >


              <X size={19} />


            </button>


          </div>


        </div>

      )}


      {/* =================================================
          FOOTER
          ================================================= */}

      <Footer />


    </>

  );

}