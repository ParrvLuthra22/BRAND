export type ProductImages = {
  main: string;
  alt: string;
  gallery: string[];
  /** Transparent-background PNG, garment isolated — SceneRail's floating cutout. */
  cutout: string;
  /** Full-bleed backdrop plate behind the cutout in SceneRail. */
  backdrop: string;
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
  colorway: string;
  sizes: string[];
  images: ProductImages;
  sequenceFrames?: string[];
  description: string;
  specs: ProductSpecs;
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// SceneUnfold's scroll-scrubbed reveal frames — 4-digit, zero-padded,
// matching the filenames SceneUnfold expects under /public/media/sequence/.
function sequenceFrames(count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) => `/media/sequence/frame_${String(i + 1).padStart(4, "0")}.webp`
  );
}

// SceneRail's cutout + backdrop plate, per product.
function railImages(id: string): Pick<ProductImages, "cutout" | "backdrop"> {
  return {
    cutout: `/media/images/${id}/cutout.png`,
    backdrop: `/media/images/${id}/backdrop.jpg`,
  };
}

export const products: Product[] = [
  {
    id: "hoodie-blackout",
    name: "Blackout Hoodie",
    moodLine: "HEAVY. CROPPED. RELENTLESS.",
    priceMRP: 12800,
    priceSale: 9600,
    colorway: "Jet Black",
    sizes: SIZES,
    images: {
      main: "/media/images/hoodie-blackout/main.jpg",
      alt: "/media/images/hoodie-blackout/alt.jpg",
      gallery: [
        "/media/images/hoodie-blackout/gallery-1.jpg",
        "/media/images/hoodie-blackout/gallery-2.jpg",
        "/media/images/hoodie-blackout/gallery-3.jpg",
      ],
      ...railImages("hoodie-blackout"),
    },
    // The featured product for the homepage's SceneUnfold reveal.
    sequenceFrames: sequenceFrames(60),
    description:
      "Oversized fit built from 480gsm double-lined fleece. Dropped shoulders, boxy body, raw-cut hem.",
    specs: {
      fabric: "480gsm brushed cotton fleece",
      cut: "Oversized, dropped shoulder",
      print: "Puff-print chest hit + back placement",
    },
  },
  {
    id: "hoodie-concrete",
    name: "Concrete Hoodie",
    moodLine: "RAW. OVERSIZED. UNBOTHERED.",
    priceMRP: 13200,
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
