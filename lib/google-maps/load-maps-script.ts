type GoogleMapsNamespace = typeof google.maps;

let loadPromise: Promise<GoogleMapsNamespace> | null = null;

declare global {
  interface Window {
    google?: typeof google;
  }
}

export function loadGoogleMapsScript(apiKey: string): Promise<GoogleMapsNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-kartex-google-maps="true"]',
      );
      if (existing) {
        existing.addEventListener("load", () => {
          if (window.google?.maps) resolve(window.google.maps);
          else reject(new Error("Google Maps failed to initialize"));
        });
        existing.addEventListener("error", () => {
          reject(new Error("Google Maps script failed to load"));
        });
        return;
      }

      const script = document.createElement("script");
      script.dataset.kartexGoogleMaps = "true";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.maps) resolve(window.google.maps);
        else reject(new Error("Google Maps failed to initialize"));
      };
      script.onerror = () => reject(new Error("Google Maps script failed to load"));
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}
