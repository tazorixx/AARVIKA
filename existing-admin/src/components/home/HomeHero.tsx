"use client";
import Image from "next/image";

import Link from "next/link";
import { useCatalog } from "@/hooks/useCatalog";

export default function HomeHero() {
  const { data, loading } = useCatalog();
  const product =
    (data?.products ?? []).find((item) => item.bestseller) ??
    (data?.products ?? [])[0];

  return (
    <>
      <section className="stitch-hero-section" aria-label="Gift4U hero">
        <div className="stitch-container">
          <div className="stitch-hero-card">
            <div className="stitch-hero-accent" aria-hidden="true" />
            <div className="stitch-hero-copy">
              <span className="stitch-kicker">● HANDCRAFTED WITH CARE</span>
              <h1 className="gift-heading">
                Thoughtful Gifting,<br />
                <em>Made Personal</em> for You.
              </h1>
              <p>
                Customised keepsakes, artisanal celebration hampers, and curated
                surprises for weddings, birthdays, and anniversaries with
                same-day express delivery in 50+ cities across India.
              </p>
              <div className="stitch-hero-actions">
                <Link href="/occasions" className="stitch-primary-button">
                  Shop by Occasion <span>→</span>
                </Link>
                <Link href="/hampers" className="stitch-secondary-button">
                  Explore Hampers
                </Link>
              </div>
              <div className="stitch-hero-points">
                <span>✓ 100% Personalised</span>
                <span>✓ Custom Note Cards</span>
                <span>✓ Express Shipping</span>
              </div>
            </div>

            <div className="stitch-hero-product">
              <span className="stitch-product-ribbon">FESTIVE CURATION</span>
              <Link href={product ? `/product/${product.slug}` : "/products"} className="stitch-hero-product-image">
                {product?.thumbnail ? (
                  <Image src={product.thumbnail} alt={product.title} width={800} height={800} className="h-full w-full object-cover" />
                ) : (
                  <span className="stitch-gift-placeholder">🎁</span>
                )}
              </Link>
              <div className="stitch-hero-product-meta">
                <div>
                  <h2>{loading ? "Loading your featured gift…" : product?.title || "The Royal Velvet Gift Hamper"}</h2>
                  <p>{product?.shortDescription || "Dry fruits, artisanal sweets & brass lamp"}</p>
                </div>
                <div className="stitch-hero-product-price">
                  {product && product.mrp > product.price && <del>₹{product.mrp.toLocaleString("en-IN")}</del>}
                  <strong>₹{product?.price?.toLocaleString("en-IN") || "2,199"}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stitch-trust-strip" aria-label="Gift4U benefits">
        <div className="stitch-container stitch-trust-grid">
          <TrustItem tone="pink" icon="◷" title="Same Day Delivery" note="Orders before 4:00 PM" />
          <TrustItem tone="blue" icon="✎" title="100% Personalised" note="Live preview before crafting" />
          <TrustItem tone="pink" icon="▣" title="Luxury Packaging" note="Signature box & message card" />
          <TrustItem tone="blue" icon="♢" title="Secure Payments" note="UPI, RuPay, NetBanking" />
        </div>
      </section>
    </>
  );
}

function TrustItem({
  tone,
  icon,
  title,
  note,
}: {
  tone: "pink" | "blue";
  icon: string;
  title: string;
  note: string;
}) {
  return (
    <div className="stitch-trust-item">
      <span className={`stitch-trust-icon ${tone}`}>{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{note}</small>
      </span>
    </div>
  );
}
