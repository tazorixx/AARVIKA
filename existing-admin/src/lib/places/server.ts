const PLACES_BASE = "https://places.googleapis.com/v1";

export type ParsedPlaceAddress = {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  formattedAddress: string;
};

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type PlaceDetailsPayload = {
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
};

export function getPlacesServerKey() {
  const key = process.env.GOOGLE_PLACES_SERVER_API_KEY?.trim();
  if (!key) throw new Error("Google Places address search is not configured.");
  return key;
}

export function cleanSessionToken(value: string | null) {
  const token = value?.trim() ?? "";
  return /^[A-Za-z0-9_-]{8,36}$/.test(token) ? token : "";
}

export function cleanPlaceId(value: string | null) {
  const placeId = value?.trim() ?? "";
  return /^[A-Za-z0-9_-]{3,220}$/.test(placeId) ? placeId : "";
}

function component(payload: PlaceDetailsPayload, type: string) {
  return payload.addressComponents?.find((row) => row.types?.includes(type))?.longText?.trim() ?? "";
}

export function parsePlaceAddress(payload: PlaceDetailsPayload): ParsedPlaceAddress {
  const subpremise = component(payload, "subpremise");
  const premise = component(payload, "premise");
  const streetNumber = component(payload, "street_number");
  const route = component(payload, "route");
  const neighborhood = component(payload, "neighborhood");
  const sublocality = component(payload, "sublocality") || component(payload, "sublocality_level_1");
  const city = component(payload, "locality") || component(payload, "administrative_area_level_2");
  const state = component(payload, "administrative_area_level_1");
  const pincode = component(payload, "postal_code").replace(/\D/g, "").slice(0, 6);
  const addressLine = [subpremise, premise, [streetNumber, route].filter(Boolean).join(" "), neighborhood || sublocality]
    .filter(Boolean)
    .join(", ") || payload.formattedAddress?.trim() || "";

  return {
    addressLine,
    city,
    state,
    pincode,
    formattedAddress: payload.formattedAddress?.trim() ?? "",
  };
}

export async function fetchPlacesAutocomplete(input: string, sessionToken: string) {
  const key = getPlacesServerKey();
  const response = await fetch(`${PLACES_BASE}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
    },
    body: JSON.stringify({
      input,
      sessionToken,
      regionCode: "IN",
      includedRegionCodes: ["in"],
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({})) as {
    suggestions?: { placePrediction?: { placeId?: string; text?: { text?: string } } }[];
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(payload.error?.message || "Google Places autocomplete failed.");

  return (payload.suggestions ?? [])
    .map((row) => ({
      placeId: row.placePrediction?.placeId?.trim() ?? "",
      text: row.placePrediction?.text?.text?.trim() ?? "",
    }))
    .filter((row) => row.placeId && row.text)
    .slice(0, 6);
}

export async function fetchPlaceDetails(placeId: string, sessionToken: string) {
  const key = getPlacesServerKey();
  const params = new URLSearchParams({ languageCode: "en", regionCode: "IN", sessionToken });
  const response = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}?${params}`, {
    headers: {
      Accept: "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "formattedAddress,addressComponents",
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as PlaceDetailsPayload & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "Google Places details failed.");
  return parsePlaceAddress(payload);
}
