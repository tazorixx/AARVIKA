"use client";

import Link from "next/link";
import { useCatalog } from "@/hooks/useCatalog";

const recipientIcons = ["👩", "👨", "👵👴", "👩‍❤️‍👨", "🧒", "🎉", "💼"];

export default function GiftForEveryone() {
  const { data, loading } = useCatalog();
  const recipients = (data?.recipients ?? []).slice(0, 7);

  return (
    <section className="stitch-recipient-section" aria-label="Gifts for everyone">
      <div className="stitch-container">
        <div className="stitch-section-heading simple">
          <div>
            <h2 className="gift-heading">Gifts for Everyone</h2>
            <p>Find a thoughtful surprise for every person you love</p>
          </div>
        </div>

        <div className="stitch-recipient-grid">
          {loading
            ? Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="stitch-recipient-card is-loading">Loading…</div>
              ))
            : recipients.map((recipient, index) => (
                <Link
                  key={recipient.id}
                  href={`/occasions?recipient=${encodeURIComponent(recipient.id)}`}
                  className="stitch-recipient-card"
                >
                  <span>{recipientIcons[index] ?? "🎁"}</span>
                  <strong>{recipient.name}</strong>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
