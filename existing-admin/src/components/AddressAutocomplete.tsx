"use client";

import { useEffect, useRef, useState } from "react";

export type ParsedAddress = {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
};

type PlaceSuggestion = {
  placePrediction?: {
    text: { toString: () => string };
    toPlace: () => GooglePlace;
  };
};

type GooglePlace = {
  fetchFields: (options: { fields: string[] }) => Promise<void>;
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
};

type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types: string[];
};

type PlacesLibrary = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      sessionToken?: unknown;
      includedPrimaryTypes?: string[];
    }) => Promise<{ suggestions: PlaceSuggestion[] }>;
  };
  AutocompleteSessionToken: new () => unknown;
};

type MapsApi = {
  importLibrary: (name: string) => Promise<unknown>;
};

let scriptLoadingPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const maps = (window.google?.maps as unknown as MapsApi | undefined);
  if (maps?.importLibrary) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const callbackName = "__gift4uMapsCallback";
    window.__gift4uMapsCallback = () => resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-gift4u-google-maps="true"]',
    );
    if (existing) return;

    const script = document.createElement("script");
    script.dataset.gift4uGoogleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      scriptLoadingPromise = null;
      reject(new Error("Failed to load Google Maps."));
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

function getComponent(place: GooglePlace, type: string): string {
  return (
    place.addressComponents?.find((component) => component.types.includes(type))
      ?.longText || ""
  );
}

function parsePlace(place: GooglePlace): ParsedAddress {
  const streetNumber = getComponent(place, "street_number");
  const route = getComponent(place, "route");
  const sublocality =
    getComponent(place, "sublocality") ||
    getComponent(place, "sublocality_level_1");
  const locality =
    getComponent(place, "locality") ||
    getComponent(place, "administrative_area_level_2");

  const addressLine =
    [streetNumber, route, sublocality].filter(Boolean).join(", ") ||
    place.formattedAddress ||
    "";

  return {
    addressLine,
    city: locality,
    state: getComponent(place, "administrative_area_level_1"),
    pincode: getComponent(place, "postal_code"),
  };
}

/**
 * Google Places (New) address search for the saved-address form.
 * Uses AutocompleteSuggestion instead of the legacy google.maps.places.Autocomplete.
 * Falls back to normal manual entry when Maps is unavailable or not configured.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelected,
  placeholder = "Start typing your address...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onAddressSelected: (address: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<unknown>(null);
  const [places, setPlaces] = useState<PlacesLibrary | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    let cancelled = false;

    void loadGoogleMapsScript(apiKey)
      .then(async () => {
        if (cancelled || !window.google?.maps) return;
        const library = (await (window.google.maps as unknown as MapsApi).importLibrary(
          "places",
        )) as PlacesLibrary;
        if (cancelled) return;
        setPlaces(library);
        sessionTokenRef.current = new library.AutocompleteSessionToken();
      })
      .catch(() => {
        // Manual entry remains available if Maps cannot be loaded.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!places || !focused || value.trim().length < 2) {
      Promise.resolve().then(() => setSuggestions([]));
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: value.trim(),
        sessionToken: sessionTokenRef.current ?? undefined,
      })
        .then((result) => {
          if (!cancelled) setSuggestions(result.suggestions.slice(0, 6));
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [places, value, focused]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setSuggestions([]);
        setFocused(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function selectSuggestion(suggestion: PlaceSuggestion) {
    try {
      const prediction = suggestion.placePrediction;
      if (!prediction) return;
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["formattedAddress", "addressComponents"],
      });
      const parsed = parsePlace(place);
      onChange(parsed.addressLine);
      onAddressSelected(parsed);
    } catch {
      // Keep the user's typed value if place details cannot be fetched.
    } finally {
      setSuggestions([]);
      setFocused(false);
      if (places) {
        sessionTokenRef.current = new places.AutocompleteSessionToken();
      }
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {focused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[80] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl">
          {suggestions.map((suggestion, index) => {
            const prediction = suggestion.placePrediction;
            if (!prediction) return null;
            return (
            <button
              key={`${prediction.text.toString()}-${index}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void selectSuggestion(suggestion)}
              className="flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-[#f5fbff]"
            >
              <span className="mt-0.5 text-[#2f628f]">⌖</span>
              <span className="min-w-0">{prediction.text.toString()}</span>
            </button>
            );
          })}
          <div className="px-4 pb-2 pt-1 text-[10px] text-slate-400">Powered by Google</div>
        </div>
      )}
    </div>
  );
}
