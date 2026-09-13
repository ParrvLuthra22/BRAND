export type ProductImages = {
  main: string;
  alt: string;
  gallery: string[];
  /** Transparent-background PNG, garment isolated — SceneRail's floating cutout. */
  cutout: string;
  /**
   * Full-bleed backdrop plate behind the cutout in SceneRail — not read by
   * any component right now. No product has real backdrop photography yet,
   * and SceneRail generates a per-product tone-gradient stand-in instead
   * (RAIL_TONE_STOPS in SceneRail.tsx) rather than pointing an <img> at this
   * path. Left in the type as a future affordance: once real plates exist,
   * point this at them and give SceneRail's tone div a background-image.
   */
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

// DROP 01 — the first real collection, replacing the old 1-real/5-placeholder
// seed set entirely. All 4 have real, generated photography under
// /public/media/images/products/<id>/; completeness varies (see each
// product's own comment) — this file is the single source of truth for
// which assets are real vs. temporarily falling back to `main`, not the
// components that read it. No more placeholder-path generator helpers
// (the old railImages()/SIZES constant) — every path below is real or an
// explicit, commented fallback, not a 404-by-design placeholder.

// The one constant to change when the rotation sequence's frame count
// changes (e.g. after further watermark/segment cleanup) — every
// product's sequenceFrames reads this, nothing hardcodes a frame count
// directly. Currently 96: the real, delivered floating-garment segment
// (see CLAUDE.md's SceneUnfold section for how that number was reached).
export const SEQUENCE_FRAME_COUNT = 96;

function sequenceFramePaths(count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) => `/media/sequence/frame_${String(i + 1).padStart(4, "0")}.jpg`
  );
}

export const products: Product[] = [
  {
    id: "onyx-hoodie",
    name: "ONYX",
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
      // Not delivered yet, and not currently read anywhere (SceneRail
      // generates a tone-gradient stand-in instead of pointing an <img>
      // here — see ProductImages["backdrop"]'s own type comment).
      backdrop: "/media/images/products/onyx-hoodie/backdrop.jpg",
    },
    // The featured product for the homepage's SceneUnfold reveal — 96 real,
    // delivered frames (.jpg). See SEQUENCE_FRAME_COUNT below — the single
    // constant to change once the watermark/segment cleanup's frame count
    // is finalized; every product's sequenceFrames should keep using it
    // rather than a hardcoded 96/85/whatever.
    sequenceFrames: sequenceFramePaths(SEQUENCE_FRAME_COUNT),
    description:
      "Heavyweight. Washed to a quiet, faded black. Built to be lived in.",
    specs: {
      fabric: "480 GSM brushed-back French terry, garment-dyed washed black.",
      cut: "Oversized boxy fit, dropped shoulder, cropped hem.",
      print: "Blank canvas — tonal woven label at the left hem, no front or back print.",
    },
  },
  {
    // Complete set: main, alt (real back view), and cutout (real — the
    // ghost-mannequin shot's grey studio background was removed with a
    // color-distance keying script, PIL-based, no ML model available in
    // this environment; see CLAUDE.md's "DROP 01" note for the approach
    // and its one known softness — faint bleed inside the hood's shadow).
    id: "bone-hoodie",
    name: "BONE",
    moodLine: "RAW. PALE. UNBOTHERED.",
    priceMRP: 4999,
    priceSale: 3499,
    hook: "Pale doesn't mean it's asking permission.",
    useCase: "For daylight hours and not caring who's watching.",
    colorway: "Bone",
    sizes: ["S", "M", "L", "XL"],
    images: {
      main: "/media/images/products/bone-hoodie/main.jpg",
      alt: "/media/images/products/bone-hoodie/alt.jpg",
      gallery: [
        "/media/images/products/bone-hoodie/main.jpg",
        "/media/images/products/bone-hoodie/alt.jpg",
      ],
      cutout: "/media/images/products/bone-hoodie/cutout.png",
      // TODO: no backdrop plate generated yet, same as onyx-hoodie's — not
      // currently read anywhere, see ProductImages["backdrop"]'s comment.
      backdrop: "/media/images/products/bone-hoodie/backdrop.jpg",
      // Real crops from main/alt (fabric texture + pocket; hood from the
      // back), not a dedicated shoot — see the same note on venom-hoodie's
      // `details` below for why these exist and what they fixed.
      details: {
        fabric: "/media/images/products/bone-hoodie/detail-fabric.jpg",
        print: "/media/images/products/bone-hoodie/detail-hood.jpg",
        stitch: "/media/images/products/bone-hoodie/detail-fabric.jpg",
      },
    },
    sequenceFrames: [],
    description:
      "Heavyweight and pale on purpose — the one piece that doesn't disappear into the rest of the drop. Built the same way, worn a different way.",
    specs: {
      fabric: "480 GSM brushed-back French terry, garment-dyed bone.",
      cut: "Oversized boxy fit, dropped shoulder, cropped hem.",
      print: "Blank canvas — tonal woven label at the left hem, no front or back print.",
    },
  },
  {
    // FEATURED — the acid-green cords/inner-hood are the one place the
    // brand's signal color appears as a physical detail, not UI chrome.
    // Complete set: main, alt (real back view, hood down, green lining
    // visible), and cutout (real — this one shipped with native alpha
    // transparency straight out of generation, no PIL keying needed).
    id: "venom-hoodie",
    name: "VENOM",
    moodLine: "SHARP. LACED. TOXIC.",
    priceMRP: 5499,
    priceSale: 3999,
    hook: "One green thread and the whole room notices.",
    useCase: "For when blending in was never the plan.",
    colorway: "Black / Acid",
    sizes: ["S", "M", "L", "XL"],
    images: {
      main: "/media/images/products/venom-hoodie/main.jpg",
      alt: "/media/images/products/venom-hoodie/alt.jpg",
      gallery: [
        "/media/images/products/venom-hoodie/main.jpg",
        "/media/images/products/venom-hoodie/alt.jpg",
      ],
      cutout: "/media/images/products/venom-hoodie/cutout.png",
      // TODO: no backdrop plate generated yet, same as the others — not
      // currently read anywhere, see ProductImages["backdrop"]'s comment.
      backdrop: "/media/images/products/venom-hoodie/backdrop.jpg",
      // Real crops from main (drawcords/pocket) and alt (hood lining, shot
      // from the back) — not a dedicated shoot, but genuinely distinct
      // detail photography, cropped tight enough that the model's face
      // never enters frame. Added because TheDrop's Cuff/Flatlay panels and
      // SpecStory's Print chapter were both silently falling back to the
      // exact same image (main.jpg) for this product, which is a real bug,
      // not a cosmetic one — see TheDrop.tsx's DETAILS and SpecStory.tsx's
      // chapterImage(), both of which now prefer these when present.
      // `stitch` isn't read by anything currently (see this type's own
      // comment) — reusing the cords crop rather than leaving it unset,
      // since the field isn't optional once `details` itself is present.
      details: {
        fabric: "/media/images/products/venom-hoodie/detail-cords.jpg",
        print: "/media/images/products/venom-hoodie/detail-hood.jpg",
        stitch: "/media/images/products/venom-hoodie/detail-cords.jpg",
      },
    },
    sequenceFrames: [],
    description:
      "Same heavyweight build, laced with the one color this brand allows itself. Toxic in the details, quiet everywhere else.",
    specs: {
      fabric:
        "480 GSM brushed-back French terry, washed black, acid-green drawcords and inner-hood lining.",
      cut: "Oversized boxy fit, dropped shoulder, cropped hem.",
      print: "Blank canvas — the acid-green cords and hood lining are the only color contact on the piece.",
    },
  },
  {
    // Complete set: main, alt (real back view), and cutout (real — also
    // shipped with native alpha transparency, no PIL keying needed).
    id: "mono-tee",
    name: "MONO",
    moodLine: "BOXY. BLANK. LOUD.",
    priceMRP: 2499,
    priceSale: 1799,
    hook: "Says nothing. Still the loudest thing in the room.",
    useCase: "Under anything, over everything, first out of the drawer.",
    colorway: "Washed Black",
    sizes: ["S", "M", "L", "XL"],
    images: {
      main: "/media/images/products/mono-tee/main.jpg",
      alt: "/media/images/products/mono-tee/alt.jpg",
      gallery: [
        "/media/images/products/mono-tee/main.jpg",
        "/media/images/products/mono-tee/alt.jpg",
      ],
      cutout: "/media/images/products/mono-tee/cutout.png",
      // TODO: no backdrop plate generated yet, same as the other three —
      // not currently read anywhere, see ProductImages["backdrop"]'s comment.
      backdrop: "/media/images/products/mono-tee/backdrop.jpg",
      // Real crops from main (sleeve/hem) and alt (back yoke) — see the
      // same note on venom-hoodie's `details` above for why these exist.
      details: {
        fabric: "/media/images/products/mono-tee/detail-cuff.jpg",
        print: "/media/images/products/mono-tee/detail-back.jpg",
        stitch: "/media/images/products/mono-tee/detail-cuff.jpg",
      },
    },
    sequenceFrames: [],
    description:
      "Heavy cotton, cut boxy, says nothing and means it. The blank you reach for when everything else is doing too much.",
    specs: {
      fabric: "260 GSM heavyweight cotton jersey, washed black.",
      cut: "Oversized boxy fit, dropped shoulder seam, straight hem.",
      print: "Blank canvas — no front or back print.",
    },
  },
];
