"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCatalog } from "@/hooks/useCatalog";

const badgeClasses = ["pink", "gold", "blue", "purple"];

export default function ProductRail() {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { data, loading } = useCatalog();
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  useEffect(() => { fetch("/api/merchandising", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((d) => setSelectedIds(d?.bestsellers?.active ? d.bestsellers.ids : [])).catch(() => setSelectedIds([])); }, []);
  const products = selectedIds === null ? [] : selectedIds.map((id) => data?.products.find((product) => product.id === id)).filter((product): product is NonNullable<typeof product> => Boolean(product)).slice(0, 4);

  return (
    <section className="stitch-products-section" aria-label="Best sellers">
      <div className="stitch-container">
        <div className="stitch-section-heading">
          <div>
            <h2 className="gift-heading">Best Sellers</h2>
            <p>Loved by gift-givers across India</p>
          </div>
          <Link href="/search">View All <span>→</span></Link>
        </div>

        <div className="stitch-product-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <article key={index} className="stitch-product-card is-loading">Loading…</article>
              ))
            : products.map((product, index) => {
                const liked = isInWishlist(product.id);
                return (
                  <article key={product.id} className="stitch-product-card">
                    <div className="stitch-product-visual">
                      <span className={`stitch-product-badge ${badgeClasses[index] ?? "pink"}`}>
                        {index === 0 ? "Personalised" : index === 1 ? "Bestseller" : index === 2 ? "Fast Dispatch" : "Couple Set"}
                      </span>
                      <button
                        type="button"
                        className={`stitch-product-heart${liked ? " liked" : ""}`}
                        aria-label={liked ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
                        onClick={() =>
                          toggleWishlist({
                            id: product.id,
                            name: product.title,
                            category: "Gift",
                            price: product.price,
                            oldPrice: product.mrp,
                            rating: String(product.rating),
                            image: product.thumbnail,
                            slug: product.slug,
                          })
                        }
                      >
                        <Heart size={15} fill={liked ? "currentColor" : "none"} />
                      </button>

                      <Link href={`/product/${product.slug}`} className="stitch-product-image">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.title} />
                        ) : (
                          <span>🎁</span>
                        )}
                      </Link>
                    </div>

                    <div className="stitch-product-info">
                      <div className="stitch-product-rating">
                        <Star size={12} fill="currentColor" />
                        {product.rating > 0 ? product.rating.toFixed(1) : "New"}
                        <span>({product.reviewCount || 0} reviews)</span>
                      </div>
                      <Link href={`/product/${product.slug}`}>
                        <h3>{product.title}</h3>
                      </Link>
                      <p className="stitch-product-note">
                        {product.personalization.enabled ? "✓ Live preview before order" : product.shortDescription}
                      </p>
                    </div>

                    <div className="stitch-product-bottom">
                      <div>
                        <strong>₹{product.price.toLocaleString("en-IN")}</strong>
                        {product.mrp > product.price && <del>₹{product.mrp.toLocaleString("en-IN")}</del>}
                        {product.discount > 0 && <span>{product.discount}% off</span>}
                      </div>
                      <Link href={`/product/${product.slug}`} className="stitch-add-button">
                        <ShoppingCart size={14} /> View Gift
                      </Link>
                    </div>
                  </article>
                );
              })}
        </div>
      </div>
    </section>
  );
}
