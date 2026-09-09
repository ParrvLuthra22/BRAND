export const LOADER_COMPLETE_EVENT = "brand:loader-complete";
const SESSION_KEY = "brand:loader-played";

/** Has the intro loader already played this session (tab lifetime)? */
export function hasLoaderPlayed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLoaderPlayed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable (e.g. private mode) — loader will just replay.
  }
}

export function dispatchLoaderComplete(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOADER_COMPLETE_EVENT));
}

export type PreloadTarget = {
  id: string;
  load: () => Promise<void>;
};

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

function preloadFont(family: string, weight: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined" || !("fonts" in document)) {
      resolve();
      return;
    }
    document.fonts
      .load(`${weight} 1em "${family}"`)
      .then(() => resolve())
      .catch(() => resolve());
  });
}

// Real assets the Hero needs before its intro can start. Missing files
// (e.g. Clash Display's woff2s, or media not dropped in yet) still resolve
// via the onerror/catch branches above — a 404 must never hang the loader.
export const HERO_IMAGE_SRC = "/media/images/hero/hero-main.jpg";
export const FIRST_SEQUENCE_FRAME_SRC = "/media/sequence/scene-unfold/0001.jpg";

export function getCriticalPreloadTargets(): PreloadTarget[] {
  return [
    { id: "hero-image", load: () => preloadImage(HERO_IMAGE_SRC) },
    // Hero itself is video/image-agnostic right now — this doubles as the
    // "hero video" slot. Swap to a video preload if Hero grows a <video>.
    { id: "hero-media", load: () => preloadImage(FIRST_SEQUENCE_FRAME_SRC) },
    { id: "font-display", load: () => preloadFont("Clash Display", "600") },
    { id: "font-body", load: () => preloadFont("Space Grotesk", "400") },
  ];
}
