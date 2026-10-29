export {};

declare global {
  namespace google {
    namespace maps {
      interface MapsLibrary {
        Map: unknown;
      }

      interface PlacesLibrary {
        AutocompleteSuggestion: unknown;
        AutocompleteSessionToken: unknown;
      }

      function importLibrary(name: string): Promise<unknown>;
    }
  }

  interface Window {
    google?: typeof google;
    __gift4uMapsCallback?: () => void;
  }
}
