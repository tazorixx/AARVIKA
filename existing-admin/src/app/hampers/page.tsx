"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Gift,
  Heart,
  Package,
  ShoppingCart,
  Sparkles,
  Star,
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
  oldPrice?: number;
  rating: number;
  category: string;
};

type CartProduct = Product & {
  quantity: number;
};

/* =========================================================
   CATALOG DATA

   All products and taxonomy shown on this page come from the
   live Firestore catalog through the public catalog API.
   ========================================================= */

/* =========================================================
   COMPONENT
   ========================================================= */

export default function HampersPage() {
  const router = useRouter();
  const {
    data: catalog,
    loading: catalogLoading,
    error: catalogError,
  } = useCatalog();

  const activeCollections = (catalog?.collections ?? []).filter((collection) => collection.active);
  const activeCollectionIds = new Set(activeCollections.map((collection) => collection.id));

  const hamperCatalogProducts = (catalog?.products ?? []).filter((product) =>
    product.collectionIds?.some((collectionId) => activeCollectionIds.has(collectionId)),
  );

  const hamperProducts: Product[] = hamperCatalogProducts.map((product) => ({
    id: product.id,
    name: product.title,
    price: product.price,
    oldPrice: product.mrp > product.price ? product.mrp : undefined,
    rating: product.rating,
    category: "Gift Hamper",
  }));

  const hamperCollections = activeCollections.map((collection) => ({
    name: collection.name,
    description: collection.description || "Thoughtfully curated gifts for every celebration",
    id: collection.id,
  }));

  const hamperCategoryIds = new Set(
    hamperCatalogProducts.flatMap((product) => product.categoryIds ?? []),
  );

  const curatedGiftSets = (catalog?.categories ?? [])
    .filter((category) => hamperCategoryIds.has(category.id))
    .map((category) => ({
      name: category.name,
      description: category.description || "Beautifully curated gifts for special moments",
      id: category.id,
    }));

  const featuredHampers = activeCollections
    .slice(0, 6)
    .map((collection) => ({ name: collection.name, id: collection.id }));

  /* =======================================================
     WISHLIST CONTEXT

     Global wishlist functionality.

     Products added here will appear on:

     /wishlist

     ======================================================= */

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  /* =======================================================
     TOGGLE WISHLIST

     If product is already in wishlist:
     → Remove it

     If product is not in wishlist:
     → Add it

     IMPORTANT:

     String(product.id) is used because
     the global wishlist uses string IDs.

     ======================================================= */

  const handleWishlist = (product: Product) => {
    const productId = String(product.id);

    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist({
        id: productId,
        name: product.name,
        price: product.price,
        category: product.category,
      });
    }
  };

  /* =======================================================
     ADD TO CART TOAST
     ======================================================= */

  const showAddedToCart = () => {
    const toast = document.createElement("div");

    toast.className =
      "fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#172033] px-6 py-4 text-white shadow-2xl";

    toast.innerHTML = `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #d92f66;
        font-weight: bold;
      ">
        ✓
      </div>

      <div>

        <div style="
          font-weight: 700;
        ">
          Added to Cart
        </div>

        <div style="
          font-size: 12px;
          opacity: 0.75;
          margin-top: 2px;
        ">
          Your gift has been added successfully
        </div>

      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "all 0.3s ease";
      toast.style.opacity = "0";

      toast.style.transform =
        "translateX(-50%) translateY(20px)";

      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2500);
  };

  /* =======================================================
     ADD PRODUCT TO CART

     1. Get existing cart
     2. Check product
     3. Increase quantity if existing
     4. Add if new
     5. Save localStorage
     6. Update Header cart count
     7. Show popup
     8. Redirect to Cart

     ======================================================= */

  const handleAddToCart = (product: Product) => {
    const existingCart =
      localStorage.getItem("gift4u-cart");

    let cartItems: CartProduct[] = [];

    if (existingCart) {
      try {
        cartItems = JSON.parse(existingCart);
      } catch {
        cartItems = [];
      }
    }

    const existingProductIndex =
      cartItems.findIndex(
        (item) => item.id === product.id
      );

    if (existingProductIndex !== -1) {
      cartItems[existingProductIndex].quantity += 1;
    } else {
      cartItems.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem(
      "gift4u-cart",
      JSON.stringify(cartItems)
    );

    /* Update Header cart count */

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    /* Show popup */

    showAddedToCart();

    /* Redirect to Cart */

    setTimeout(() => {
      router.push("/cart");
    }, 700);
  };

  return (
    <>
      {/* =====================================================
          HEADER
          ===================================================== */}

      <Header />

      <main className="gift4u-template-page overflow-hidden bg-[#fffafc]">

        <Breadcrumb currentPage="Hampers" />


        {/* ===================================================
            HERO SECTION
            =================================================== */}

        <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">

          <div className="gift4u-standard-hero relative overflow-hidden rounded-[2rem] border border-[#f0dfe6] bg-[#f8e8ee]">

            {/* ===============================================
                HERO BACKGROUND IMAGE

                IMAGE NOT ADDED YET.

                TO ADD IMAGE LATER:

                STEP 1:

                Add image inside:

                public/images/hampers/

                Example:

                public/images/hampers/hamper-hero.jpg


                STEP 2:

                Replace the placeholder below with:

                <img
                  src="/images/hampers/hamper-hero.jpg"
                  alt="Gift Hampers"
                  className="absolute inset-0 h-full w-full object-cover"
                />

                =============================================== */}

            <div className="absolute inset-0">

              <div className="flex h-full w-full items-center justify-center">

                <span className="text-sm font-semibold text-[#9a7d88]">
                  Add Hampers Hero Background Image Here
                </span>

              </div>

            </div>


            {/* Decorative Shapes */}

            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#f3c9d7] opacity-60" />

            <div className="absolute -bottom-28 left-1/2 h-64 w-64 rounded-full bg-[#f5dbe4] opacity-70" />


            {/* Hero Content */}

            <div className="gift4u-standard-hero-content relative z-10 max-w-3xl px-7 py-16 sm:px-12 sm:py-20">

              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#d92f66]">
                Curated With Love
              </p>

              <h1 className="gift-heading mt-4 text-4xl font-bold text-[#172033] sm:text-5xl lg:text-6xl">

                Gift Hampers

                <span className="block text-[#d92f66]">
                  Made to Delight
                </span>

              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-[#667085] sm:text-lg">

                Beautifully curated hampers filled with
                thoughtful surprises, delicious treats and
                unforgettable memories.

              </p>

              <Link
                href="#featured-hampers"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3.5 font-semibold text-white transition hover:bg-[#bd1d52]"
              >

                Explore Hampers

                <ArrowRight size={19} />

              </Link>

            </div>

          </div>

        </section>


        {/* ===================================================
            FEATURED HAMPERS
            =================================================== */}

        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">

          <div className="mb-7 flex items-end justify-between gap-4">

            <div>

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">
                Find Your Favourite
              </p>

              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                Featured Hampers
              </h2>

            </div>

            <Link
              href="/hampers"
              className="hidden items-center gap-1 text-sm font-bold text-[#d92f66] sm:flex"
            >

              View All

              <ArrowRight size={16} />

            </Link>

          </div>


          <div className="relative">

            <div
              id="featured-hampers-scroll"
              className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
            >

              {featuredHampers.map((item, index) => (

                <Link
                  key={item.id}
                  href={`/hampers?collection=${encodeURIComponent(item.id)}`}
                  className="group min-w-[190px] flex-1 rounded-2xl border border-[#f0dfe6] bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"
                >

                  <div
                    className={`flex h-14 w-14 items-center justify-center bg-[#fff1f5] text-[#d92f66]
                    ${
                      index % 3 === 0
                        ? "rounded-full"
                        : index % 3 === 1
                        ? "rounded-2xl"
                        : "rotate-6 rounded-[1.4rem]"
                    }`}
                  >

                    <Gift size={25} />

                  </div>

                  <h3 className="mt-4 font-bold text-[#172033]">
                    {item.name}
                  </h3>

                  <p className="mt-2 text-sm text-[#667085]">
                    Explore collection
                  </p>

                </Link>

              ))}

            </div>

          </div>

        </section>


        {/* ===================================================
            HAMPER COLLECTIONS
            =================================================== */}

        <section className="bg-white py-14">

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="mb-8">

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">
                Thoughtfully Curated
              </p>

              <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                Beautiful Gift Hampers
              </h2>

              <p className="mt-3 max-w-2xl text-[#667085]">

                Discover carefully selected hampers designed
                to bring happiness to every special occasion.

              </p>

            </div>


            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {hamperCollections.map(
                (collection, index) => (

                  <Link
                    key={collection.name}
                    href="/hampers"
                    className="group relative overflow-hidden rounded-[1.8rem] border border-[#f0dfe6] bg-[#fff6f9] p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl"
                  >

                    <div
                      className={`absolute -right-6 -top-6 h-24 w-24 bg-[#f6d8e2] opacity-60
                      ${
                        index % 2 === 0
                          ? "rounded-full"
                          : "rounded-[2rem]"
                      }`}
                    />

                    <div className="relative">

                      <div
                        className={`flex h-12 w-12 items-center justify-center text-[#d92f66]
                        ${
                          index % 3 === 0
                            ? "rounded-full bg-[#ffeaf1]"
                            : index % 3 === 1
                            ? "rounded-xl bg-[#fbe2eb]"
                            : "rounded-[1.2rem] bg-white"
                        }`}
                      >

                        <Package size={21} />

                      </div>

                      <h3 className="mt-5 text-lg font-bold text-[#172033]">
                        {collection.name}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-[#667085]">
                        {collection.description}
                      </p>

                      <div className="mt-5 flex items-center gap-2 text-sm font-bold text-[#d92f66]">

                        Explore

                        <ArrowRight
                          size={17}
                          className="transition-transform group-hover:translate-x-1"
                        />

                      </div>

                    </div>

                  </Link>

                )
              )}

            </div>

          </div>

        </section>


        {/* ===================================================
            CURATED GIFT SETS
            =================================================== */}

        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">

          <div className="relative overflow-hidden rounded-[2rem] bg-[#172033] px-6 py-10 sm:px-10 lg:px-14 lg:py-14">

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d92f66] opacity-20" />

            <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-white opacity-5" />


            <div className="relative z-10">

              <div className="mb-10 max-w-2xl">

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d92f66] text-white">

                  <Sparkles size={24} />

                </div>

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-[#f3a8c0]">
                  Beautifully Curated
                </p>

                <h2 className="gift-heading mt-3 text-3xl font-bold text-white sm:text-4xl">
                  Curated Gift Sets
                </h2>

                <p className="mt-4 text-base leading-7 text-[#c6cedd]">

                  Thoughtfully combined gifts curated to create
                  memorable moments.

                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {curatedGiftSets.map((item, index) => (

                  <Link
                    key={item.name}
                    href="/hampers"
                    className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/10"
                  >

                    <div
                      className={`flex h-11 w-11 items-center justify-center text-[#f6b4c8]
                      ${
                        index % 3 === 0
                          ? "rounded-full bg-white/10"
                          : index % 3 === 1
                          ? "rounded-xl bg-white/10"
                          : "rotate-3 rounded-[1rem] bg-white/10"
                      }`}
                    >

                      <Sparkles size={19} />

                    </div>

                    <h3 className="mt-4 font-bold text-white">
                      {item.name}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#b9c2d1]">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#f3a8c0]">

                      Explore

                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />

                    </div>

                  </Link>

                ))}

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            FEATURED PRODUCTS
            =================================================== */}

        <section
          id="featured-hampers"
          className="bg-white py-16"
        >

          <div className="mx-auto max-w-7xl px-4 lg:px-8">

            <div className="mb-8 flex items-end justify-between gap-4">

              <div>

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d92f66]">
                  Handpicked For You
                </p>

                <h2 className="gift-heading mt-2 text-3xl font-bold text-[#172033] sm:text-4xl">
                  Popular Gift Hampers
                </h2>

              </div>

              <Link
                href="/hampers"
                className="hidden items-center gap-1 text-sm font-bold text-[#d92f66] sm:flex"
              >

                View All

                <ArrowRight size={16} />

              </Link>

            </div>


            {/* PRODUCT GRID */}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {hamperProducts.map((product) => {

                /* ===========================================
                   CHECK WISHLIST STATUS
                   =========================================== */

                const productInWishlist =
                  isInWishlist(String(product.id));

                return (

                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-2xl border border-[#f0dfe6] bg-white transition hover:-translate-y-1 hover:shadow-xl"
                  >

                    {/* =========================================
                        PRODUCT IMAGE PLACEHOLDER

                        ADD PRODUCT IMAGE HERE LATER.

                        STEP 1:

                        Add image inside:

                        public/images/hampers/


                        Example:

                        public/images/hampers/
                        luxury-celebration-hamper.jpg


                        STEP 2:

                        Replace the placeholder below with:

                        <img
                          src="/images/hampers/your-image.jpg"
                          alt="Product Name"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />

                        ========================================= */}

                    <div className="relative aspect-square overflow-hidden bg-[#f8e8ee]">

                      <div className="flex h-full w-full items-center justify-center p-5 text-center">

                        <span className="text-sm font-semibold text-[#8d7580]">
                          {product.name} Image
                        </span>

                      </div>


                      {/* =====================================
                          WISHLIST BUTTON

                          Click:
                          → Add to Wishlist

                          Click again:
                          → Remove from Wishlist

                          ===================================== */}

                      <button
                        type="button"

                        aria-label={
                          productInWishlist
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                        }

                        onClick={() =>
                          handleWishlist(product)
                        }

                        className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105
                        ${
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


                      {/* CATEGORY BADGE */}

                      <span className="absolute bottom-3 left-3 rounded-full bg-[#172033] px-3 py-1 text-xs font-semibold text-white">

                        {product.category}

                      </span>

                    </div>


                    {/* PRODUCT INFORMATION */}

                    <div className="gift4u-card-content p-5">

                      {/* RATING */}

                      <div className="flex items-center gap-1">

                        <Star
                          size={15}
                          className="fill-[#f5aa18] text-[#f5aa18]"
                        />

                        <span className="text-sm font-bold text-[#172033]">
                          {product.rating}
                        </span>

                        <span className="text-xs text-[#667085]">
                          (120)
                        </span>

                      </div>


                      {/* PRODUCT NAME */}

                      <h3 className="mt-3 text-lg font-bold text-[#172033]">

                        {product.name}

                      </h3>


                      {/* PRICE */}

                      <div className="mt-4 flex items-center gap-2">

                        <span className="text-xl font-bold text-[#172033]">

                          ₹{product.price}

                        </span>


                        {product.oldPrice && (

                          <span className="text-sm text-[#98a2b3] line-through">

                            ₹{product.oldPrice}

                          </span>

                        )}

                      </div>


                      {/* =====================================
                          ADD TO CART

                          1. Adds product
                          2. Updates quantity
                          3. Updates Header cart count
                          4. Shows popup
                          5. Redirects to Cart

                          ===================================== */}

                      <button
                        type="button"

                        onClick={() =>
                          handleAddToCart(product)
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
            PREMIUM HAMPER BANNER
            =================================================== */}

        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">

          <div className="relative overflow-hidden rounded-[2rem] bg-[#172033]">


            {/* ===============================================
                PREMIUM HAMPER BACKGROUND IMAGE

                Current image location:

                public/images/hampers/premium-hamper.png

                =============================================== */}

            <img
              src="/images/hampers/premium-hamper.png"
              alt="Premium Gift Hampers"
              className="absolute inset-0 h-full w-full object-cover"
            />


            {/* DARK OVERLAY */}

            <div className="absolute inset-0 bg-[#172033]/75" />


            {/* CONTENT */}

            <div className="relative z-10 max-w-2xl px-8 py-16 sm:px-14 sm:py-20">

              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f3a8c0]">
                Premium Gifting
              </p>

              <h2 className="gift-heading mt-4 text-4xl font-bold text-white sm:text-5xl">

                Make Every Gift

                <span className="block text-[#f3a8c0]">
                  Feel Extraordinary
                </span>

              </h2>

              <p className="mt-5 text-lg leading-8 text-[#e1e6ef]">

                Discover luxurious hampers carefully designed
                to make your special moments unforgettable.

              </p>

              <Link
                href="/hampers"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3.5 font-semibold text-white transition hover:bg-[#bd1d52]"
              >

                Explore Premium Hampers

                <ArrowRight size={19} />

              </Link>

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