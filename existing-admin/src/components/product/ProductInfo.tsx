"use client";

import Link from "next/link";
import {
  Check,
  Heart,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { useReducer, useState } from "react";

import type { Product } from "@/lib/catalog/types";
import { useWishlist } from "@/contexts/WishlistContext";
import { createCartKey } from "@/lib/cart/types";
import {
  readGuestCart,
  writeGuestCart,
} from "@/lib/cart/storage";

import ProductOptions from "./ProductOptions";
import PersonalizationForm from "./PersonalizationForm";
import DeliveryChecker from "./DeliveryChecker";

import {
  getInitialSelection,
  getVariantKey,
  getVariantPrice,
  selectionReducer,
  validateSelection,
} from "./product-selection";

export default function ProductInfo({
  product,
}: {
  product: Product;
}) {
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selection, dispatch] = useReducer(
    selectionReducer,
    product,
    getInitialSelection,
  );

  const [added, setAdded] = useState(false);
  const [validationMessage, setValidationMessage] =
    useState("");

  const liked = isInWishlist(product.id);

  const selectedVariantIndex = product.variants.findIndex(
    (variant, index) =>
      getVariantKey(variant, index) ===
      selection.variantId,
  );

  const selectedVariant =
    selectedVariantIndex >= 0
      ? product.variants[selectedVariantIndex]
      : undefined;

  const unitPrice = getVariantPrice(
    product,
    selectedVariant,
  );

  const discount =
    product.mrp > unitPrice
      ? product.discount ||
        Math.round(
          (1 - unitPrice / product.mrp) * 100,
        )
      : 0;

  const canPurchase =
    !validateSelection(product, selection);

  function update(
    action: Parameters<typeof dispatch>[0],
  ) {
    setAdded(false);
    setValidationMessage("");
    dispatch(action);
  }

  function saveToCart(goToCart: boolean) {
    const error = validateSelection(
      product,
      selection,
    );

    if (error) {
      setValidationMessage(error);
      return;
    }

    const variantLabel = selectedVariant
      ? `${selectedVariant.name}${
          selectedVariant.value
            ? ` â€” ${selectedVariant.value}`
            : selectedVariant.options?.length
              ? ` â€” ${selectedVariant.options.join(", ")}`
              : ""
        }`
      : undefined;

    const cartKey = createCartKey({
      productId: product.id,
      variantId: selection.variantId,
      deliveryDate: selection.delivery?.date,
      deliverySlot: selection.delivery?.slot,
      personalization:
        selection.personalization,
      giftMessage: selection.giftMessage,
    });

    const cart = readGuestCart();

    const existing = cart.find(
      (item) => item.cartKey === cartKey,
    );

    if (existing) {
      const nextQuantity = Math.min(
        20,
        Number(existing.quantity || existing.qty || 0) +
          selection.quantity,
      );

      existing.qty = nextQuantity;
      existing.quantity = nextQuantity;
      existing.price = unitPrice;
      existing.variant = variantLabel;
      existing.personalization =
        selection.personalization;
      existing.giftMessage =
        selection.giftMessage || undefined;
      existing.deliveryDate =
        selection.delivery?.date;
      existing.deliverySlot =
        selection.delivery?.slot;
      existing.deliveryFee = 0;
    } else {
      cart.push({
        cartKey,
        productId: product.id,
        title: product.title,
        price: unitPrice,

        // Cart model quantity fields.
        qty: selection.quantity,
        quantity: selection.quantity,

        image: product.thumbnail,
        variantId:
          selection.variantId || undefined,
        variant: variantLabel,
        personalization:
          selection.personalization,
        giftMessage:
          selection.giftMessage || undefined,
        deliveryDate:
          selection.delivery?.date,
        deliverySlot:
          selection.delivery?.slot,
        deliveryFee: 0,
      });
    }

    writeGuestCart(cart);

    sessionStorage.setItem(
      "gift4u-cart-toast",
      `${product.title} added to cart`,
    );

    setAdded(true);
    setValidationMessage("");

    if (goToCart) {
      window.location.assign("/cart");
    }
  }

  function handlePurchase(
    goToCart = false,
  ) {
    saveToCart(goToCart);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap gap-2">
          {product.bestseller && (
            <span className="rounded-full bg-[#fff0f5] px-3 py-1.5 text-[11px] font-bold text-[#bd1d52]">
              Best Seller
            </span>
          )}

          {product.newArrival && (
            <span className="rounded-full bg-[#eef7ff] px-3 py-1.5 text-[11px] font-bold text-[#214c72]">
              New Arrival
            </span>
          )}

          {product.featured && (
            <span className="rounded-full bg-[#fff8e8] px-3 py-1.5 text-[11px] font-bold text-[#7d5b13]">
              Gift4U Pick
            </span>
          )}
        </div>

        <h1 className="gift-heading mt-3 text-3xl font-bold leading-[1.12] text-[#214c72] md:text-4xl">
          {product.title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {product.shortDescription ||
            product.description ||
            "A thoughtful gift for someone special."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3d9] px-3 py-1.5 text-sm font-bold text-[#7d5b13]">
          <Star
            size={14}
            fill="currentColor"
          />
          {product.rating > 0
            ? product.rating.toFixed(1)
            : "New"}
        </span>

        <span className="text-sm text-slate-500">
          {product.reviewCount > 0
            ? `${product.reviewCount} reviews`
            : "Be the first to review"}
        </span>

        <span className="hidden h-4 w-px bg-slate-200 sm:block" />

        <span className="text-xs text-slate-400">
          SKU: {product.sku}
        </span>
      </div>

      <div className="rounded-[16px] border border-[#e8dfe4] bg-white p-5 shadow-[0_10px_28px_rgba(33,76,114,0.055)] md:p-6">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="text-3xl font-extrabold tracking-tight text-[#172033]">
            â‚¹{unitPrice.toLocaleString("en-IN")}
          </span>

          {product.mrp > unitPrice && (
            <>
              <del className="pb-1 text-sm text-slate-400">
                â‚¹{product.mrp.toLocaleString(
                  "en-IN",
                )}
              </del>

              <span className="pb-1 text-sm font-bold text-emerald-700">
                {discount}% off
              </span>
            </>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          A lovely gift at a clear price. Delivery
          charges, if any, are shown later.
        </p>
      </div>

      <ProductOptions
        product={product}
        variantKey={selection.variantId}
        onVariantChange={(value) =>
          update({
            type: "variant",
            value,
          })
        }
        giftMessage={selection.giftMessage}
        onGiftMessageChange={(value) =>
          update({
            type: "giftMessage",
            value,
          })
        }
      />

      <PersonalizationForm
        product={product}
        value={selection.personalization}
        onChange={(value) =>
          update({
            type: "personalization",
            value,
          })
        }
      />

      <div className="rounded-[14px] border border-[#e8dfe4] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#172033]">
              How many would you like to gift?
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Perfect for sending to one person or
              sharing the moment with a few more.
            </p>
          </div>

          <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() =>
                update({
                  type: "quantity",
                  value:
                    selection.quantity - 1,
                })
              }
              aria-label="Decrease quantity"
              className="grid h-9 w-9 place-items-center rounded-full text-lg text-[#214c72] hover:bg-[#f5fbff]"
            >
              âˆ’
            </button>

            <span className="w-8 text-center text-sm font-bold text-[#172033]">
              {selection.quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                update({
                  type: "quantity",
                  value:
                    selection.quantity + 1,
                })
              }
              aria-label="Increase quantity"
              className="grid h-9 w-9 place-items-center rounded-full text-lg text-[#214c72] hover:bg-[#f5fbff]"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <DeliveryChecker
        product={product}
        value={selection.delivery}
        onChange={(value) =>
          update({
            type: "delivery",
            value,
          })
        }
      />

      <div className="rounded-[14px] border border-[#dcebf4] bg-[#f5fbff] p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#2f628f] shadow-sm">
            <Truck size={17} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-[#214c72]">
              Your gift, ready to send
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Choose the options that matter to you,
              then weâ€™ll carry those selections into
              your cart.
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div
            className={`rounded-[12px] bg-white px-3 py-2.5 text-xs font-semibold ${
              selectedVariant ||
              product.variants.length === 0
                ? "text-emerald-700"
                : "text-slate-400"
            }`}
          >
            <Check
              size={14}
              className="mr-1 inline"
            />
            Option
          </div>

          <div
            className={`rounded-[12px] bg-white px-3 py-2.5 text-xs font-semibold ${
              selection.delivery?.date &&
              selection.delivery.slot
                ? "text-emerald-700"
                : "text-slate-400"
            }`}
          >
            <Check
              size={14}
              className="mr-1 inline"
            />
            Delivery
          </div>

          <div
            className={`rounded-[12px] bg-white px-3 py-2.5 text-xs font-semibold ${
              !product.personalization
                ?.enabled ||
              canPurchase ||
              Object.values(
                selection.personalization,
              ).some(Boolean)
                ? "text-emerald-700"
                : "text-slate-400"
            }`}
          >
            <Check
              size={14}
              className="mr-1 inline"
            />
            Personal touch
          </div>
        </div>
      </div>

      {validationMessage && (
        <p
          role="alert"
          className="rounded-[14px] border border-[#f0dfe6] bg-[#fffafd] px-4 py-3 text-sm font-semibold text-[#bd1d52]"
        >
          {validationMessage}
        </p>
      )}

      <div className="sticky bottom-3 z-20 rounded-[14px] border border-[#eee5e9] bg-white/95 p-2 shadow-[0_12px_35px_rgba(23,32,51,0.14)] backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              handlePurchase(false)
            }
            disabled={!canPurchase}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#d92f66] px-4 text-sm font-bold text-white transition hover:bg-[#bd1d52] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ShoppingCart size={18} />
            {added
              ? "Added to Cart"
              : "Add to Cart"}
          </button>

          <button
            type="button"
            onClick={() =>
              handlePurchase(true)
            }
            disabled={!canPurchase}
            className="hidden min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#2f628f] bg-white px-4 text-sm font-bold text-[#214c72] transition hover:bg-[#f5fbff] disabled:cursor-not-allowed disabled:opacity-45 sm:flex"
          >
            <Zap size={17} />
            Buy Now
          </button>

          <button
            type="button"
            onClick={() =>
              toggleWishlist({
                id: product.id,
                name: product.title,
                category: "Gift",
                price: unitPrice,
                oldPrice: product.mrp,
                rating: String(
                  product.rating,
                ),
                image: product.thumbnail,
                slug: product.slug,
              })
            }
            aria-label={
              liked
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
            className={`grid min-h-12 w-12 shrink-0 place-items-center rounded-full border transition ${
              liked
                ? "border-[#d92f66] bg-[#fff0f5] text-[#d92f66]"
                : "border-slate-200 bg-white text-[#172033] hover:border-[#d92f66] hover:text-[#d92f66]"
            }`}
          >
            <Heart
              size={19}
              fill={
                liked
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>

      {added && (
        <p className="rounded-[14px] bg-[#edf9f1] px-4 py-3 text-sm font-semibold text-emerald-700">
          Added to your cart.{" "}
          <Link
            href="/cart"
            className="underline underline-offset-2"
          >
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}