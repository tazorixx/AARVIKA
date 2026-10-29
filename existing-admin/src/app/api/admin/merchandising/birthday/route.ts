import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { getBirthdayMerchandising, normalizeMerchandisingItemInput, saveMerchandisingHero, serializeMerchandising } from "@/lib/merchandising/server";
import type { MerchandisingHero } from "@/lib/merchandising/types";

export const runtime = "nodejs";

export async function GET(request: Request) { try { await requireCatalogAdmin(request); return NextResponse.json(serializeMerchandising(await getBirthdayMerchandising())); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request) { try { await requireCatalogAdmin(request); const body = (await request.json()) as { hero?: Partial<MerchandisingHero> }; if (!body.hero || typeof body.hero !== "object") throw new Error("Hero configuration is required."); const hero: MerchandisingHero = { eyebrow: typeof body.hero.eyebrow === "string" ? body.hero.eyebrow.trim() : "", heading: typeof body.hero.heading === "string" ? body.hero.heading.trim() : "", description: typeof body.hero.description === "string" ? body.hero.description.trim() : "", ctaText: typeof body.hero.ctaText === "string" ? body.hero.ctaText.trim() : "", ctaLink: typeof body.hero.ctaLink === "string" ? body.hero.ctaLink.trim() : "/birthday", desktopImage: typeof body.hero.desktopImage === "string" ? body.hero.desktopImage.trim() : "", mobileImage: typeof body.hero.mobileImage === "string" ? body.hero.mobileImage.trim() : "", active: body.hero.active !== false }; if (!hero.heading) throw new Error("Birthday hero heading is required."); await saveMerchandisingHero("birthday", hero); return NextResponse.json({ ok: true }); } catch (error) { return errorResponse(error); } }
