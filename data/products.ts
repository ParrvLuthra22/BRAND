export type ProductImages = {
  main: string;
  alt: string;
  gallery: string[];
  /** Transparent-background PNG, garment isolated — SceneRail's floating cutout. */
  cutout: string;
  /** Full-bleed backdrop plate behind the cutout in SceneRail. */
  backdrop: string;
  /**
   * Optional extra mask-wipe detail shots, keyed by spec. Currently unset
   * for every seed product — TheDrop's featured-product detail panels now
   * pull straight from `gallery` instead (see TheDrop.tsx), and SpecStory's
   * chapterImage() falls through to `gallery`/`main`/`alt` when this is
   * absent. Left in the type as a future affordance for a product that gets
   * dedicated per-spec photography.
   */
  details?: {
    fabric: string;
    print: string;
    stitch: string;
  };
};

export type ProductSpecs = {
  fabric: string;
  cut: string;
  print: string;
};

export type Product = {
  id: string;
  name: string;
  /** Exactly three UPPERCASE words, e.g. "HEAVY. CROPPED. RELENTLESS." */
  moodLine: string;
  priceMRP: number;
  priceSale?: number;
  /** Only set true for products currently out of stock — absent/false everywhere else. */
  soldOut?: boolean;
  /** One punchy standalone line — the PDP's attention-grabbing headline, distinct from moodLine. */
  hook: string;
  /** One line of who/when/where — grounds the hook in an actual moment of wear. */
  useCase: string;
  colorway: string;
  sizes: string[];
  images: ProductImages;
  sequenceFrames?: string[];
  description: string;
  specs: ProductSpecs;
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// SceneRail's cutout + backdrop plate, per product.
function railImages(id: string): Pick<ProductImages, "cutout" | "backdrop"> {
  return {
    cutout: `/media/images/${id}/cutout.png`,
    backdrop: `/media/images/${id}/backdrop.jpg`,
  };
}

export const products: Product[] = [
  {
    // The one real product — assets live under /public/media/images/products/
    // onyx-hoodie/, a different directory shape than the other 5 placeholders'
    // /media/images/<id>/... convention (no "products/" segment), so its
    // paths are written out explicitly below rather than through
    // railImages()/detailImages(). Don't "fix" those helpers to match; the
    // other 5 are deliberately untouched placeholders (see their own paths).
    id: "onyx-hoodie",
    name: "ONYX HOODIE",
    moodLine: "WASHED. HEAVY. QUIET.",
    priceMRP: 4999,
    priceSale: 3499,
    hook: "The loudest thing in the room says nothing at all.",
    useCase: "For the days you've got nothing to prove and nowhere to be.",
    colorway: "Washed Black",
    sizes: ["S", "M", "L", "XL"],
    images: {
      main: "/media/images/products/onyx-hoodie/main.jpg",
      alt: "/media/images/products/onyx-hoodie/alt.jpg",
      gallery: [
        "/media/images/products/onyx-hoodie/main.jpg",
        "/media/images/products/onyx-hoodie/alt.jpg",
        "/media/images/products/onyx-hoodie/detail-cuff.jpg",
        "/media/images/products/onyx-hoodie/flatlay.jpg",
      ],
      cutout: "/media/images/products/onyx-hoodie/cutout.png",
      // Not delivered yet (only SceneRail needs this) — placeholder path in
      // the same real-asset folder, same 404-gracefully treatment as every
      // other not-yet-real path in this file.
      backdrop: "/media/images/products/onyx-hoodie/backdrop.jpg",
    },
    // The featured product for the homepage's SceneUnfold reveal — 96 real,
    // delivered frames (.jpg; the 5 placeholder products still just use an
    // empty sequenceFrames: [] below, no generator function needed for
    // that). These are the floating-garment segment extracted from the
    // source rotation video (trimmed to the clean half, watermark removed
    // via delogo — see CLAUDE.md's SceneUnfold section for the extraction
    // details), written out explicitly for the same reason the images
    // above are.
    sequenceFrames: Array.from(
      { length: 96 },
      (_, i) => `/media/sequence/frame_${String(i + 1).padStart(4, "0")}.jpg`
    ),
    description:
      "Heavyweight. Washed to a quiet, faded black. Built to be lived in.",
    specs: {
      fabric: "480 GSM brushed-back French terry, garment-dyed washed black.",
      cut: "Oversized boxy fit, dropped shoulder, cropped hem.",
      print: "Blank canvas — tonal woven label at the left hem, no front or back print.",
    },
  },
  {
    id: "hoodie-concrete",
    name: "Concrete Hoodie",
    moodLine: "RAW. OVERSIZED. UNBOTHERED.",
    priceMRP: 13200,
    soldOut: true,
    hook: "Built like it's never once apologized.",
    useCase: "For grey days, long commutes, and not making eye contact.",
    colorway: "Concrete Grey",
    sizes: SIZES,
    images: {
      main: "/media/images/hoodie-concrete/main.jpg",
      alt: "/media/images/hoodie-concrete/alt.jpg",
      gallery: [
        "/media/images/hoodie-concrete/gallery-1.jpg",
        "/media/images/hoodie-concrete/gallery-2.jpg",
      ],
      ...railImages("hoodie-concrete"),
    },
    sequenceFrames: [],
    description:
      "Garment-dyed for a lived-in wash, finished with an exposed reverse-coverstitch hood.",
    specs: {
      fabric: "420gsm garment-dyed fleece",
      cut: "Oversized, boxy body",
      print: "Rubberized sleeve tab",
    },
  },
  {
    id: "tee-relentless",
    name: "Relentless Tee",
    moodLine: "HEAVY. CROPPED. RELENTLESS.",
    priceMRP: 5800,
    priceSale: 4200,
    hook: "Cut short. Patience shorter.",
    useCase: "Layer it, don't explain it.",
    colorway: "Jet Black",
    sizes: SIZES,
    images: {
      main: "/media/images/tee-relentless/main.jpg",
      alt: "/media/images/tee-relentless/alt.jpg",
      gallery: [
        "/media/images/tee-relentless/gallery-1.jpg",
        "/media/images/tee-relentless/gallery-2.jpg",
      ],
      ...railImages("tee-relentless"),
    },
    sequenceFrames: [],
    description:
      "240gsm heavyweight cotton, boxy oversized block fit with a dropped shoulder seam.",
    specs: {
      fabric: "240gsm heavyweight cotton",
      cut: "Oversized box fit",
      print: "Screen-print front + back",
    },
  },
  {
    id: "tee-static",
    name: "Static Tee",
    moodLine: "LOUD. FADED. UNAPOLOGETIC.",
    priceMRP: 5800,
    hook: "Already lived in. Never lived down.",
    useCase: "For the after-party you weren't invited to.",
    colorway: "Acid Wash Grey",
    sizes: SIZES,
    images: {
      main: "/media/images/tee-static/main.jpg",
      alt: "/media/images/tee-static/alt.jpg",
      gallery: [
        "/media/images/tee-static/gallery-1.jpg",
        "/media/images/tee-static/gallery-2.jpg",
      ],
      ...railImages("tee-static"),
    },
    sequenceFrames: [],
    description:
      "Acid-washed heavyweight cotton with a distressed hand-feel and dropped hem.",
    specs: {
      fabric: "230gsm acid-washed cotton",
      cut: "Oversized, dropped hem",
      print: "Discharge print, distressed",
    },
  },
  {
    id: "tee-concrete-jungle",
    name: "Concrete Jungle Tee",
    moodLine: "RAW. OVERSIZED. UNBOTHERED.",
    priceMRP: 6200,
    hook: "Made for pavement, not pleasantries.",
    useCase: "City block, back alley, either exit.",
    colorway: "Concrete Grey",
    sizes: SIZES,
    images: {
      main: "/media/images/tee-concrete-jungle/main.jpg",
      alt: "/media/images/tee-concrete-jungle/alt.jpg",
      gallery: [
        "/media/images/tee-concrete-jungle/gallery-1.jpg",
        "/media/images/tee-concrete-jungle/gallery-2.jpg",
      ],
      ...railImages("tee-concrete-jungle"),
    },
    sequenceFrames: [],
    description:
      "Oversized fit with an all-over back print and a boxy silhouette built for layering.",
    specs: {
      fabric: "240gsm heavyweight cotton",
      cut: "Oversized box fit",
      print: "All-over back placement",
    },
  },
  {
    id: "tee-signal",
    name: "Signal Tee",
    moodLine: "SHARP. ACID. UNSEEN.",
    priceMRP: 6200,
    priceSale: 4900,
    hook: "Catches light. Holds attention.",
    useCase: "For the room you walk into last, on purpose.",
    colorway: "Paper White",
    sizes: SIZES,
    images: {
      main: "/media/images/tee-signal/main.jpg",
      alt: "/media/images/tee-signal/alt.jpg",
      gallery: [
        "/media/images/tee-signal/gallery-1.jpg",
        "/media/images/tee-signal/gallery-2.jpg",
      ],
      ...railImages("tee-signal"),
    },
    sequenceFrames: [],
    description:
      "Off-white heavyweight cotton with an acid-green foil print that catches light on movement.",
    specs: {
      fabric: "240gsm heavyweight cotton",
      cut: "Oversized box fit",
      print: "Acid-green foil, chest hit",
    },
  },
];
