"use client";
import Image from "next/image";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCatalog } from "@/hooks/useCatalog";

export default function NewLaunches() {
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { data, loading } = useCatalog();
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  useEffect(() => { fetch("/api/merchandising", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((d) => setSelectedIds(d?.newArrivals?.active ? d.newArrivals.ids : [])).catch(() => setSelectedIds([])); }, []);
  const products = selectedIds === null ? [] : selectedIds.map((id) => data?.products.find((product) => product.id === id)).filter((product): product is NonNullable<typeof product> => Boolean(product)).slice(0, 4);

  return (
    <section className="stitch-launch-section" aria-label="Newly launched gifts">
      <div className="stitch-container">
        <div className="stitch-section-heading">
          <div>
            <h2 className="gift-heading">Newly Launched</h2>
            <p>New gifts, new memories, and more ways to surprise someone</p>
          </div>
          <Link href="/search">Explore All New <span>→</span></Link>
        </div>

        <div className="stitch-launch-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <article key={index} className="stitch-launch-card is-loading">Loading…</article>
              ))
            : products.map((product) => {
                const liked = wishlist.some((item) => item.id === product.id);
                return (
                  <article key={product.id} className="stitch-launch-card">
                    <div className="stitch-launch-media">
                      <span className="stitch-new-badge">NEW</span>
                      <button
                        type="button"
                        className={`stitch-launch-heart${liked ? " liked" : ""}`}
                        aria-label={liked ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
                        onClick={() =>
                          liked
                            ? removeFromWishlist(product.id)
                            : addToWishlist({
                                id: product.id,
                                name: product.title,
                                price: product.price,
                                category: "Gift",
                                rating: String(product.rating),
                                oldPrice: product.mrp,
                                image: product.thumbnail,
                                slug: product.slug,
                              })
                        }
                      >
                        <Heart size={15} fill={liked ? "currentColor" : "none"} />
                      </button>
                      <Link href={`/product/${product.slug}`} className="stitch-launch-image">
                        {product.thumbnail ? (
                          <Image src={product.thumbnail} alt={product.title} width={800} height={800} className="h-full w-full object-cover" />
                        ) : (
                          <span>🎁</span>
                        )}
                      </Link>
                    </div>
                    <div className="stitch-launch-info">
                      <small>{product.categoryIds.length ? "Gift Collection" : "New Gift"}</small>
                      <Link href={`/product/${product.slug}`}>
                        <h3>{product.title}</h3>
                      </Link>
                      <div className="stitch-launch-price">
                        <strong>₹{product.price.toLocaleString("en-IN")}</strong>
                        {product.mrp > product.price && <del>₹{product.mrp.toLocaleString("en-IN")}</del>}
                        <Link href={`/product/${product.slug}`}>Quick View</Link>
                      </div>
                    </div>
                  </article>
                );
              })}
        </div>
      </div>
    </section>
  );
}
