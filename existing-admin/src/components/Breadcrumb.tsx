import Link from "next/link";
import { ChevronRight } from "lucide-react";

/* =========================================
   BREADCRUMB COMPONENT

   Usage:

   <Breadcrumb currentPage="Wedding" />

   Output:

   Home > Wedding

   Clicking Home redirects to "/"
   ========================================= */

interface BreadcrumbProps {
  currentPage: string;
}

export default function Breadcrumb({
  currentPage,
}: BreadcrumbProps) {
  return (
    <div className="gift4u-standard-breadcrumb bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">

        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm"
        >

          {/* =====================================
              HOME LINK

              Clicking Home redirects to homepage
              ===================================== */}

          <Link
            href="/"
            className="font-medium text-[#667085] transition hover:text-[#d92f66]"
          >
            Home
          </Link>

          {/* =====================================
              SEPARATOR
              ===================================== */}

          <ChevronRight
            size={16}
            className="text-[#667085]"
          />

          {/* =====================================
              CURRENT PAGE

              This is NOT clickable.
              ===================================== */}

          <span
            className="font-semibold text-[#172033]"
            aria-current="page"
          >
            {currentPage}
          </span>

        </nav>

      </div>
    </div>
  );
}