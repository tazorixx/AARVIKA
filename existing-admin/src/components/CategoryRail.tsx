"use client";

import Link from "next/link";
import { useCatalog } from "@/hooks/useCatalog";

const categoryIcons = ["💍", "🎂", "🥂", "🧺", "✍️", "🌿"];

export default function CategoryRail() {
  const { data, loading } = useCatalog();
  const categories = (data?.categories ?? []).slice(0, 6);
  const products = data?.products ?? [];

  return (
    <section className="stitch-category-section" aria-label="Shop by category">
      <div className="stitch-container">
        <div className="stitch-section-heading">
          <div>
            <h2 className="gift-heading">Shop by Category</h2>
            <p>Curated gifts for every celebration</p>
          </div>
          <Link href="/occasions">View All <span>→</span></Link>
        </div>

        <div className="stitch-category-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="stitch-category-card is-loading">Loading…</div>
              ))
            : categories.map((category, index) => {
                const count = products.filter((product) =>
                  product.categoryIds.includes(category.id),
                ).length;
                return (
                  <Link
                    key={category.id}
                    href={`/occasions?category=${encodeURIComponent(category.id)}`}
                    className="stitch-category-card"
                  >
                    <span className={`stitch-category-icon category-${index + 1}`}>
                      {categoryIcons[index] ?? "✦"}
                    </span>
                    <strong>{category.name}</strong>
                    <small>{count > 0 ? `${count}+ items` : "Explore gifts"}</small>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
