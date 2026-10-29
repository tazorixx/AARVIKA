import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { getMerchandising, saveMerchandisingHero, serializeMerchandising } from "@/lib/merchandising/server";
import type { MerchandisingHero, MerchandisingPage } from "@/lib/merchandising/types";

export const runtime = "nodejs";
const PAGES: MerchandisingPage[] = ["wedding", "birthday", "anniversary", "hampers", "personalised", "clothing", "stationery", "furniture", "lifestyle"];
function pageOf(value: string): MerchandisingPage { if (!PAGES.includes(value as MerchandisingPage)) throw new Error("Invalid merchandising page."); return value as MerchandisingPage; }

export async function GET(request: Request, { params }: { params: Promise<{ page: string }> }) {
  try { await requireCatalogAdmin(request); const { page: raw } = await params; return NextResponse.json(serializeMerchandising(await getMerchandising(pageOf(raw)))); }
  catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ page: string }> }) {
  try {
    await requireCatalogAdmin(request);
    const { page: raw } = await params;
    const page = pageOf(raw);
    const body = (await request.json()) as { hero?: Partial<MerchandisingHero>; settings?: unknown; banner?: unknown };
    const current = await getMerchandising(page);
    const currentHero = current.page.hero ?? {
      eyebrow: "",
      heading: "",
      description: "",
      ctaText: "",
      ctaLink: "",
      desktopImage: "",
      mobileImage: "",
      active: true,
    };
    if (body.hero) {
      const hero: MerchandisingHero = {
        eyebrow: typeof body.hero.eyebrow === "string" ? body.hero.eyebrow.trim() : currentHero.eyebrow,
        heading: typeof body.hero.heading === "string" ? body.hero.heading.trim() : currentHero.heading,
        description: typeof body.hero.description === "string" ? body.hero.description.trim() : currentHero.description,
        ctaText: typeof body.hero.ctaText === "string" ? body.hero.ctaText.trim() : currentHero.ctaText,
        ctaLink: typeof body.hero.ctaLink === "string" ? body.hero.ctaLink.trim() : currentHero.ctaLink,
        desktopImage: typeof body.hero.desktopImage === "string" ? body.hero.desktopImage.trim() : currentHero.desktopImage,
        mobileImage: typeof body.hero.mobileImage === "string" ? body.hero.mobileImage.trim() : currentHero.mobileImage,
        active: body.hero.active !== false,
      };
      if (!hero.heading) throw new Error("Hero heading is required.");
      await saveMerchandisingHero(page, hero);
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
