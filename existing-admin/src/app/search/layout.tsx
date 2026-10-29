import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search gifts",
  description: "Search Gift4U gifts and personalised hampers.",
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
