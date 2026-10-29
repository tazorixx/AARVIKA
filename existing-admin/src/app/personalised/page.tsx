"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Gift,
  Heart,
  ShoppingCart,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";

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

type CartProduct = Product & {
  quantity: number;
};

/* =========================================================
   CART STORAGE KEY

   IMPORTANT:

   If your existing Cart Page uses a different localStorage
   key, change this value to the SAME key.

   This allows products from all pages to appear
   in one common cart.
========================================================= */

const CART_STORAGE_KEY = "gift4u-cart";

/* =========================================================
   CATALOG DATA

   Personalised products, categories and recipients are derived
   from the live Firestore catalog inside the page component.
   ========================================================= */

/* =========================================================
   MAIN PAGE
========================================================= */

export default function PersonalisedPage() {
  const {
    data: catalog,
    loading: catalogLoading,
    error: catalogError,
  } = useCatalog();

  const liveProducts = catalog?.products ?? [];

  const personalisedProducts: Product[] = liveProducts
    .filter((product) => {
      const personalization = product.personalization;
      return personalization?.enabled === true;
    })
    .slice(0, 8)
    .map((product) => ({
      id: product.id,
      name: product.title,
      price: product.price,
      rating: product.rating,
      category: "Personalised Gift",
    }));

  const personalisedCategoryIds = new Set(
    liveProducts
      .filter((product) => {
        const personalization = product.personalization;
        return personalization?.enabled === true;
      })
      .flatMap((product) => product.categoryIds ?? []),
  );

  const categories = (catalog?.categories ?? [])
    .filter((category) => personalisedCategoryIds.has(category.id))
    .map((category) => ({
      title: category.name,
      description: category.description || "Create something personal and memorable",
      shape: "rounded",
      id: category.id,
    }));

  const personalisedRecipientIds = new Set(
    liveProducts
      .filter((product) => product.personalization?.enabled === true)
      .flatMap((product) => product.recipientIds ?? []),
  );

  const personalFor = (catalog?.recipients ?? [])
    .filter((recipient) => personalisedRecipientIds.has(recipient.id))
    .map((recipient) => ({
      title: recipient.name,
      text: recipient.description || "Thoughtful gifts made just for them",
      icon: recipient.name.charAt(0).toUpperCase() || "G",
      id: recipient.id,
    }));

  /* =========================================================
     GLOBAL WISHLIST
  ========================================================= */

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  /* =========================================================
     TOGGLE WISHLIST
  ========================================================= */

  const toggleWishlist = (product: Product) => {
    const wishlistId = String(product.id);

    if (isInWishlist(wishlistId)) {
      removeFromWishlist(wishlistId);
    } else {
      addToWishlist({
        id: wishlistId,
        name: product.name,
        price: product.price,
        category: product.category,
      });
    }
  };

  /* =========================================================
     ADD PRODUCT TO CART
  ========================================================= */

  const addToCart = (product: Product) => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);

      let cart: CartProduct[] = [];

      if (storedCart) {
        cart = JSON.parse(storedCart);
      }

      const existingProduct = cart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        existingProduct.quantity += 1;
      } else {
        cart.push({
          ...product,
          quantity: 1,
        });
      }

      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );

      /* =====================================================
         CUSTOM EVENT

         This helps other components such as Header
         update the cart count immediately.
      ===================================================== */

      window.dispatchEvent(
        new Event("cartUpdated")
      );

      /* =====================================================
         SHOW BOTTOM POPUP
      ===================================================== */

      showCartPopup(product.name);
    } catch (error) {
      console.error("Error adding product to cart:", error);
    }
  };

  /* =========================================================
     BOTTOM CART POPUP
  ========================================================= */

  const showCartPopup = (productName: string) => {
    const existingPopup =
      document.getElementById("gift4u-cart-popup");

    if (existingPopup) {
      existingPopup.remove();
    }

    const popup = document.createElement("div");

    popup.id = "gift4u-cart-popup";

    popup.className =
      "fixed bottom-5 left-1/2 z-[9999] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl bg-[#172033] px-5 py-4 text-white shadow-2xl";

    popup.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <div
          style="
            width:36px;
            height:36px;
            border-radius:50%;
            background:#d92f66;
            display:flex;
            align-items:center;
            justify-content:center;
            font-weight:bold;
          "
        >
          ✓
        </div>

        <div>
          <p style="font-weight:700;font-size:14px;">
            Added to Cart
          </p>

          <p
            style="
              color:#cbd5e1;
              font-size:12px;
              margin-top:2px;
            "
          >
            ${productName}
          </p>
        </div>
      </div>

      <a
        href="/cart"
        style="
          color:#f7a8bf;
          font-size:13px;
          font-weight:700;
          text-decoration:none;
          white-space:nowrap;
        "
      >
        View Cart
      </a>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
      popup.style.opacity = "0";
      popup.style.transform =
        "translate(-50%, 20px)";
      popup.style.transition =
        "all 300ms ease";

      setTimeout(() => {
        popup.remove();
      }, 300);
    }, 3000);
  };

  return (
    <>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Header />

      <main className="gift4u-template-page overflow-hidden bg-white">
        {catalogError && (
          <div className="border-b border-[#f0dfe6] bg-[#fffafc] px-4 py-3 text-center text-sm text-[#667085]" role="alert">
            {catalogError}
          </div>
        )}

        {/* =====================================================
            BREADCRUMB
        ===================================================== */}

        <Breadcrumb currentPage="Personalised Gifts" />


        {/* =====================================================
            HERO SECTION

            PERSONALISATION BANNER

            IMAGE PLACEHOLDER INCLUDED

            ===================================================== */}

        <section className="bg-[#fff6f9] py-10 sm:py-14">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="gift4u-standard-hero gift4u-standard-hero-content relative overflow-hidden rounded-[2.5rem] bg-[#172033] px-6 py-12 sm:px-12 lg:px-16 lg:py-16">


              {/* ===============================================
                  DECORATIVE BACKGROUND SHAPES
              =============================================== */}

              <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-[#d92f66]/20 blur-2xl" />

              <div className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-[#f5aa18]/10 blur-3xl" />

              <div className="absolute right-1/3 top-0 h-24 w-24 rotate-45 rounded-3xl border border-white/10" />


              <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_0.85fr]">


                {/* =============================================
                    HERO TEXT
                ============================================== */}

                <div className="gift4u-hero-copy">

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d92f66] text-white">
                      <Sparkles size={22} />
                    </div>

                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#f7a8bf]">
                      Made Just For You
                    </p>

                  </div>


                  <h1 className="gift-heading mt-7 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">

                    Personalised Gifts
                    <span className="block text-[#f7a8bf]">
                      Made With Memories
                    </span>

                  </h1>


                  <p className="mt-6 max-w-xl text-base leading-8 text-[#cbd5e1] sm:text-lg">

                    Add names, photos, messages and memories to
                    create a gift that feels truly personal and
                    impossible to forget.

                  </p>


                  <div className="mt-8 flex flex-wrap gap-3">

                    <a
                      href="#personalised-products"
                      className="inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3 font-semibold text-white transition hover:bg-[#bd1d52]"
                    >
                      Explore Gifts
                      <ArrowRight size={18} />
                    </a>


                    <a
                      href="#categories"
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                    >
                      Explore Categories
                    </a>

                  </div>


                  {/* =============================================
                      SMALL FEATURES
                  ============================================== */}

                  <div className="mt-9 flex flex-wrap gap-5 text-sm text-[#cbd5e1]">

                    <span className="flex items-center gap-2">
                      <Check size={16} className="text-[#f7a8bf]" />
                      Add Your Name
                    </span>

                    <span className="flex items-center gap-2">
                      <Check size={16} className="text-[#f7a8bf]" />
                      Upload Memories
                    </span>

                    <span className="flex items-center gap-2">
                      <Check size={16} className="text-[#f7a8bf]" />
                      Make It Unique
                    </span>

                  </div>

                </div>


                {/* =============================================
                    HERO IMAGE PLACEHOLDER


                    IMPORTANT:
                    ---------------------------------------------

                    LATER ADD YOUR HERO IMAGE HERE.

                    STEP 1:

                    Add image inside:

                    public/images/

                    Example:

                    public/images/personalised-hero.jpg


                    STEP 2:

                    Replace the placeholder DIV below with:


                    <img
                      src="/images/personalised-hero.jpg"
                      alt="Personalised Gifts"
                      className="h-full w-full object-cover"
                    />


                    ============================================= */}

                <div className="relative">

                  <div className="relative min-h-[330px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#253047]">


                    {/* IMAGE PLACEHOLDER */}

                    <div className="flex min-h-[330px] flex-col items-center justify-center p-8 text-center">

                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d92f66]/20 text-[#f7a8bf]">

                        <Gift size={35} />

                      </div>


                      <p className="mt-5 font-bold text-white">
                        Add Personalised Hero Image
                      </p>


                      <p className="mt-2 max-w-xs text-sm leading-6 text-[#94a3b8]">
                        Add a beautiful image showing customised
                        gifts, names, photos and memorable moments.
                      </p>

                    </div>


                    {/* DECORATIVE SHAPES */}

                    <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full border border-[#d92f66]/40" />

                    <div className="absolute right-8 top-8 h-12 w-12 rounded-full bg-[#d92f66]/20" />

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
    PERSONALISE BY CATEGORY
===================================================== */}

<section
  id="categories"
  className="bg-white py-16"
>
  <div className="mx-auto max-w-7xl px-4 lg:px-8">

    {/* ===============================================
        SECTION HEADING
    =============================================== */}

    <div className="mb-10">

      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">
        Tailor Treasures
      </p>

      <h2 className="gift-heading mt-3 text-3xl font-bold text-[#172033] sm:text-4xl">
        Make Every Gift Your Own
      </h2>

      <p className="mt-3 max-w-2xl text-[#667085]">
        From names and photos to meaningful messages,
        personalise every detail.
      </p>

    </div>


    {/* ===============================================
        CATEGORY CARDS

        All cards use the SAME shape.

        Shape:
        rounded-[2rem]

        This keeps the section consistent,
        clean and well structured.
    =============================================== */}

    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">

      {categories.map((category) => (

        <Link
          key={category.title}
          href={`/personalised?category=${encodeURIComponent(
            category.title
          )}`}
          className="group"
        >

          <div
            className="
              flex
              min-h-[250px]
              flex-col
              items-center
              justify-center
              rounded-[2rem]
              border
              border-[#f0dfe6]
              bg-[#fff6f9]
              p-6
              text-center
              transition
              duration-300
              hover:-translate-y-2
              hover:border-[#f3b4c7]
              hover:bg-white
              hover:shadow-xl
            "
          >


            {/* =========================================
                CATEGORY IMAGE PLACEHOLDER


                IMPORTANT:

                Add category images later.

                Example image structure:

                public/images/personalised/

                photo-frame.jpg
                personalised-mug.jpg
                custom-cushion.jpg
                name-plate.jpg
                engraved-gift.jpg


                -----------------------------------------

                LATER:

                Replace the placeholder DIV below with:

                <img
                  src="/images/personalised/photo-frame.jpg"
                  alt="Photo Frames"
                  className="
                    h-full
                    w-full
                    object-cover
                    transition
                    duration-500
                    group-hover:scale-105
                  "
                />

            ========================================= */}


            {/* IMAGE PLACEHOLDER */}

            <div
              className="
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-full
                bg-white
                text-sm
                font-bold
                text-[#d92f66]
                shadow-sm
                transition
                duration-300
                group-hover:scale-110
              "
            >
              Image
            </div>


            {/* CATEGORY TITLE */}

            <h3 className="mt-6 text-lg font-bold text-[#172033]">

              {category.title}

            </h3>


            {/* CATEGORY DESCRIPTION */}

            <p className="mt-3 text-sm leading-6 text-[#667085]">

              {category.description}

            </p>


            {/* ARROW */}

            <div
              className="
                mt-5
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-[#f8e8ee]
                text-[#d92f66]
                transition
                duration-300
                group-hover:translate-x-1
                group-hover:bg-[#d92f66]
                group-hover:text-white
              "
            >
              <ArrowRight size={17} />
            </div>

          </div>

        </Link>

      ))}

    </div>

  </div>
</section>

        {/* =====================================================
            PERSONALISE FOR SOMEONE

            CREATIVE HEXAGON STYLE
        ===================================================== */}

        <section className="bg-[#fff6f9] py-16">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">


            <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">


              {/* LEFT SIDE */}

              <div>

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">

                  Personalise Gifts For

                </p>


                <h2 className="gift-heading mt-3 text-3xl font-bold text-[#172033] sm:text-4xl">

                  Someone Special

                </h2>


                <p className="mt-4 max-w-md leading-7 text-[#667085]">

                  The best gifts are the ones that feel personal.
                  Find something designed especially for the
                  people you love.

                </p>


                <Link
                  href="#personalised-products"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#172033] px-6 py-3 font-semibold text-white transition hover:bg-[#253047]"
                >

                  Find Their Gift

                  <ArrowRight size={18} />

                </Link>

              </div>


              {/* RIGHT SIDE */}

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">


                {personalFor.map((person, index) => (

                  <Link
                    key={person.title}
                    href={`/personalised?for=${encodeURIComponent(
                      person.title
                    )}`}
                    className={`group relative flex min-h-[180px] flex-col justify-between overflow-hidden border border-[#f0dfe6] p-5 transition duration-300 hover:-translate-y-2 hover:shadow-xl
                      
                      ${
                        index % 2 === 0
                          ? "rounded-[2.5rem] bg-white"
                          : "rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-2xl rounded-bl-2xl bg-[#f8e8ee]"
                      }
                    `}
                  >


                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#172033] text-sm font-bold text-white">

                      {person.icon}

                    </div>


                    <div>

                      <h3 className="font-bold text-[#172033]">

                        {person.title}

                      </h3>


                      <p className="mt-2 text-xs leading-5 text-[#667085]">

                        {person.text}

                      </p>


                      <ArrowRight
                        size={18}
                        className="mt-4 text-[#d92f66] transition group-hover:translate-x-2"
                      />

                    </div>


                    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#d92f66]/5" />

                  </Link>

                ))}

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURED PERSONALISED PRODUCTS

            ADD TO CART FUNCTIONALITY INCLUDED
        ===================================================== */}

        <section
          id="personalised-products"
          className="bg-white py-16"
        >

          <div className="mx-auto max-w-7xl px-4 lg:px-8">


            {/* HEADING */}

            <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">


              <div>

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">

                  Made Especially For You

                </p>


                <h2 className="gift-heading mt-3 text-3xl font-bold text-[#172033] sm:text-4xl">

                  Personalised Best Sellers

                </h2>


                <p className="mt-3 text-[#667085]">

                  Add your personal touch to these customer favourites.

                </p>

              </div>


              <Link
                href="/personalised?view=all"
                className="inline-flex items-center gap-2 font-semibold text-[#d92f66]"
              >

                View All

                <ArrowRight size={18} />

              </Link>

            </div>


            {/* ===============================================
                PRODUCT GRID

                Same size style as Newly Launched section.
            =============================================== */}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">


              {personalisedProducts.map((product) => {
                const isWishlisted = isInWishlist(String(product.id));

                return (
                  <article
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >


                  {/* =========================================
                      PRODUCT IMAGE PLACEHOLDER


                      HOW TO ADD IMAGE LATER:

                      STEP 1:

                      Add image inside:

                      public/images/


                      EXAMPLES:

                      public/images/custom-photo-frame.jpg

                      public/images/personalised-mug.jpg

                      public/images/memory-cushion.jpg

                      public/images/name-lamp.jpg


                      STEP 2:

                      Replace the placeholder DIV below with:


                      <img
                        src="/images/custom-photo-frame.jpg"
                        alt="Custom Photo Frame"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />


                      ========================================= */}

                  <div className="relative aspect-square overflow-hidden bg-[#f8e8ee]">


                    {/* IMAGE PLACEHOLDER */}

                    <div className="flex h-full w-full flex-col items-center justify-center p-5 text-center">

                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#d92f66] shadow-sm">

                        <Gift size={26} />

                      </div>


                      <span className="mt-4 text-sm font-semibold text-[#667085]">

                        {product.name} Image

                      </span>

                    </div>


                    {/* PERSONALISED BADGE */}

                    <span className="absolute left-3 top-3 rounded-full bg-[#172033] px-3 py-1 text-xs font-bold text-white">

                      Personalised

                    </span>


                    {/* WISHLIST */}

                    <button
                      type="button"
                      onClick={() => toggleWishlist(product)}
                      aria-label={
                        isWishlisted
                          ? `Remove ${product.name} from wishlist`
                          : `Add ${product.name} to wishlist`
                      }
                      className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition ${
                        isWishlisted
                          ? "text-[#d92f66]"
                          : "text-[#172033] hover:text-[#d92f66]"
                      }`}
                    >

                      <Heart
                        size={18}
                        fill={isWishlisted ? "currentColor" : "none"}
                      />

                    </button>

                  </div>


                  {/* PRODUCT INFORMATION */}

                  <div className="gift4u-card-content p-5">


                    <p className="text-xs font-semibold text-[#d92f66]">

                      {product.category}

                    </p>


                    {/* RATING */}

                    <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-[#172033]">

                      <Star
                        size={15}
                        className="fill-[#f5aa18] text-[#f5aa18]"
                      />

                      <span>{product.rating}</span>

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

                );
              })}

            </div>

          </div>

        </section>


        {/* =====================================================
            CUSTOMISATION PROCESS

            CREATIVE STEP DESIGN
        ===================================================== */}

        <section className="theme-dark-section bg-[#172033] py-16 text-white">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">


            <div className="mb-12 text-center">

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f7a8bf]">

                Simple And Special

              </p>


              <h2 className="gift-heading mt-3 text-3xl font-bold sm:text-4xl">

                Make It Personal In 3 Steps

              </h2>

            </div>


            <div className="grid gap-8 md:grid-cols-3">


              {/* STEP 1 */}

              <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-8">

                <span className="text-5xl font-bold text-[#d92f66]">
                  01
                </span>


                <h3 className="mt-6 text-xl font-bold">
                  Choose Your Gift
                </h3>


                <p className="mt-3 leading-7 text-[#cbd5e1]">

                  Pick a gift that perfectly matches the
                  personality of someone special.

                </p>

              </div>


              {/* STEP 2 */}

              <div className="relative rounded-[4rem_2rem_4rem_2rem] border border-white/10 bg-white/5 p-8">

                <span className="text-5xl font-bold text-[#d92f66]">
                  02
                </span>


                <h3 className="mt-6 text-xl font-bold">
                  Add Your Personal Touch
                </h3>


                <p className="mt-3 leading-7 text-[#cbd5e1]">

                  Add names, photos, messages or other details
                  to make your gift unique.

                </p>

              </div>


              {/* STEP 3 */}

              <div className="relative rounded-[2rem_4rem_2rem_4rem] border border-white/10 bg-white/5 p-8">

                <span className="text-5xl font-bold text-[#d92f66]">
                  03
                </span>


                <h3 className="mt-6 text-xl font-bold">
                  Create A Memory
                </h3>


                <p className="mt-3 leading-7 text-[#cbd5e1]">

                  Give a thoughtful gift that becomes a memory
                  worth keeping forever.

                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA BANNER

            IMAGE PLACEHOLDER INCLUDED
        ===================================================== */}

        <section className="bg-[#fff6f9] py-16">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">


            <div className="relative overflow-hidden rounded-[2.5rem] border border-[#f0dfe6] bg-white">


              <div className="grid items-center lg:grid-cols-2">


                {/* TEXT */}

                <div className="p-8 sm:p-12 lg:p-16">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8e8ee] text-[#d92f66]">

                    <Heart size={22} />

                  </div>


                  <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">

                    One Of A Kind

                  </p>


                  <h2 className="gift-heading mt-3 text-3xl font-bold text-[#172033] sm:text-4xl">

                    A Gift Only You
                    <span className="block">
                      Could Give
                    </span>

                  </h2>


                  <p className="mt-5 max-w-md leading-7 text-[#667085]">

                    Because the best gifts are not just bought.
                    They are created with memories, emotions
                    and a little bit of you.

                  </p>


                  <Link
                    href="#personalised-products"
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3 font-semibold text-white transition hover:bg-[#bd1d52]"
                  >

                    Start Personalising

                    <ArrowRight size={18} />

                  </Link>

                </div>


                {/* =============================================
                    CTA IMAGE PLACEHOLDER


                    LATER ADD IMAGE HERE

                    Example:

                    public/images/personalised-banner.jpg


                    Replace placeholder with:


                    <img
                      src="/images/personalised-banner.jpg"
                      alt="Personalised Gift"
                      className="h-full w-full object-cover"
                    />

                ============================================= */}

                <div className="min-h-[350px] bg-[#f8e8ee] p-6">


                  <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[#e6b7c7] bg-white/50 p-8 text-center">

                    <UserRound
                      size={42}
                      className="text-[#d92f66]"
                    />


                    <p className="mt-5 font-bold text-[#172033]">

                      Add Personalised Banner Image

                    </p>


                    <p className="mt-2 max-w-xs text-sm leading-6 text-[#667085]">

                      Add an attractive image showing customised
                      gifts and happy gifting moments.

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />
    </>
  );
}