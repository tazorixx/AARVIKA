"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

const shopLinks = [
  { label: "Wedding Gifts & Hampers", href: "/wedding" },
  { label: "Birthday Surprises", href: "/birthday" },
  { label: "Anniversary Keepsakes", href: "/anniversary" },
  { label: "Corporate Gifting Packs", href: "/occasions" },
  { label: "Personalised Gifts", href: "/personalised" },
];

const helpLinks = [
  { label: "Track Your Order", href: "/orders" },
  { label: "Shipping & Delivery", href: "/policies/shipping" },
  { label: "Refund & Replacement Policy", href: "/policies/refund" },
  { label: "FAQs & Personalisation", href: "/support" },
  { label: "Terms of Service & Privacy", href: "/policies/privacy" },
  { label: "Delete My Account", href: "/account/delete" },
];

export default function Footer() {
  return (
    <footer className="stitch-footer">
      <div className="stitch-container">
        <div className="stitch-footer-newsletter">
          <div>
            <h3 className="gift-heading">Join the Gift4U Celebration Club</h3>
            <p>Get special member-only discount codes and early festival alerts.</p>
          </div>
          <form className="stitch-newsletter-form" onSubmit={(event) => event.preventDefault()}>
            <input type="email" placeholder="Enter your email address" aria-label="Email address" />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        <div className="stitch-footer-grid">
          <div>
            <Link href="/" className="stitch-footer-brand gift-heading">Gift4U</Link>
            <p className="stitch-footer-about">
              India&apos;s most trusted online destination for thoughtful, personalized gift hampers, celebrating life&apos;s joyous moments.
            </p>
            <div className="stitch-footer-contact">
              <p><strong>Customer Care:</strong> +91 (040) 8400-GIFT</p>
              <p><strong>Email:</strong> support@gift4u.in</p>
              <p><strong>Hours:</strong> 9:00 AM - 8:00 PM IST (Mon-Sun)</p>
            </div>
          </div>

          <div>
            <h4>Popular Categories</h4>
            {shopLinks.map((link) => (
              <p key={link.label}><Link href={link.href}>{link.label}</Link></p>
            ))}
          </div>

          <div>
            <h4>Customer Service</h4>
            {helpLinks.map((link) => (
              <p key={link.label}><Link href={link.href}>{link.label}</Link></p>
            ))}
          </div>

          <div>
            <h4>100% Secure Checkout</h4>
            <p>We accept all major secure Indian payment instruments:</p>
            <div className="stitch-payment-badges">
              <span>UPI / GPay</span>
              <span>RuPay</span>
              <span>Visa</span>
              <span>Mastercard</span>
              <span>NetBanking</span>
            </div>
            <div className="stitch-ssl">🔒 256-bit SSL Encrypted Transactions</div>
          </div>
        </div>

        <div className="stitch-footer-bottom">
          <span>© 2026 Gift4U Retail Technologies Pvt. Ltd. All rights reserved.</span>
          <span>Made with <Heart size={12} fill="currentColor" /> for heartfelt celebrations across India</span>
        </div>
      </div>
    </footer>
  );
}
