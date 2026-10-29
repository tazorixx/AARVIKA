import type { ReadonlyURLSearchParams } from "next/navigation";

type SearchParams = URLSearchParams | ReadonlyURLSearchParams;

function isInternalPath(candidate: string) {
  return candidate.startsWith("/") && !candidate.startsWith("//");
}

function isAdminPath(candidate: string) {
  return candidate === "/admin" || candidate.startsWith("/admin/");
}

/**
 * Resolve a customer destination after authentication.
 * Supports both legacy `redirect` and newer `next` parameters.
 * Admin destinations are deliberately excluded from the customer portal.
 */
export function resolveCustomerRedirect(
  params: SearchParams,
  fallback = "/account",
) {
  const candidate = params.get("next") || params.get("redirect") || fallback;

  if (!isInternalPath(candidate) || isAdminPath(candidate)) {
    return fallback;
  }

  return candidate;
}

/**
 * Resolve an admin destination after authentication.
 * Only the /admin namespace is accepted, so adding a new admin page does not
 * require updating an allow-list here.
 */
export function resolveAdminRedirect(
  params: SearchParams,
  fallback = "/admin",
) {
  const candidate = params.get("next") || params.get("redirect") || fallback;

  if (!isInternalPath(candidate) || !isAdminPath(candidate)) {
    return fallback;
  }

  return candidate;
}

/** Backwards-compatible customer redirect helper used by existing customer auth pages. */
export function resolveSafeRedirect(
  params: SearchParams,
  fallback = "/account",
) {
  return resolveCustomerRedirect(params, fallback);
}

export function loginHref(destination: string) {
  const safe = isInternalPath(destination) && !isAdminPath(destination)
    ? destination
    : "/account";
  return `/login?next=${encodeURIComponent(safe)}`;
}

export function adminLoginHref(destination = "/admin") {
  const safe = isInternalPath(destination) && isAdminPath(destination)
    ? destination
    : "/admin";
  return `/admin/login?next=${encodeURIComponent(safe)}`;
}
