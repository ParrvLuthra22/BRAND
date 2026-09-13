"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { gsap, ScrollTrigger, EASE_OUT } from "@/lib/gsap";
import { products, type ProductSpecs } from "@/data/products";
import { useCartStore } from "@/lib/cart-store";
import { useCursorStore } from "@/lib/cursor-store";
import { cn, formatPrice, EASE_OUT as EASE_OUT_MOTION } from "@/lib/utils";

// This section's own presentation order — VENOM first (the hero colorway,
// acid-green as a physical detail rather than UI chrome), then ONYX, BONE,
// MONO. Deliberately not `products` array order (the catalog's own order,
// [onyx, bone, venom, mono]) — this list is TheDrop's rotation sequence,
// kept separate on purpose.
const ROTATION_ORDER = ["venom-hoodie", "onyx-hoodie", "bone-hoodie", "mono-tee"];

// Fast enough to read as a deliberate, kinetic rotation rather than a slow
// static swap — enough time to register the name/price/CTA, not so much
// that it stalls.
const ROTATION_MS = 7_000;

const SPEC_STORY: { label: string; key: keyof ProductSpecs }[] = [
  { label: "Fabric", key: "fabric" },
  { label: "Cut", key: "cut" },
  { label: "Print", key: "print" },
];

function defaultSizeFor(sizes: string[]): string {
  return sizes.includes("M") ? "M" : sizes[0];
}

export function TheDrop() {
  const [activeIndex, setActiveIndex] = useState(0);
  const product = products.find((p) => p.id === ROTATION_ORDER[activeIndex])!;

  const [selectedSize, setSelectedSize] = useState(defaultSizeFor(product.sizes));
  const [prefersReduced, setPrefersReduced] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const maskRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Pauses the rotation timer on hover so it never swaps content out from
  // under someone mid-read or mid-size-pick — a ref, not state, since it's
  // read inside the interval tick rather than driving a render itself.
  const pausedRef = useRef(false);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);
  const setCursorLabel = useCursorStore((state) => state.setLabel);

  useLayoutEffect(() => {
    setPrefersReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // Auto-rotates through ROTATION_ORDER on a flat interval. Keeps running
  // under reduced motion — this is a content rotation, not a motion effect
  // (see the crossfades below for what reduced motion actually changes) —
  // matching the Loader's "preloading still runs for real either way,
  // reduced motion changes the animation, not the gating" precedent.
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setActiveIndex((i) => (i + 1) % ROTATION_ORDER.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, []);

  // A size chosen for the previous product shouldn't silently carry over
  // once the rotation swaps to a new one.
  useEffect(() => {
    setSelectedSize(defaultSizeFor(product.sizes));
  }, [product]);

  // Each detail shot mask-wipes open once, the first time it's scrolled
  // into view — not scrubbed, not pinned, just a one-shot reveal per panel.
  // Runs once on mount only: the mask elements themselves never remount as
  // the rotation advances (only the <img> inside — see DETAILS.map below),
  // so this reveal doesn't replay on every product swap, only the first
  // time each panel position is ever scrolled into view.
  useEffect(() => {
    if (prefersReduced) return;
    const triggers = maskRefs.current
      .filter((el): el is HTMLDivElement => !!el)
      .map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.to(el, {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1,
              ease: EASE_OUT,
            });
          },
        })
      );
    return () => triggers.forEach((trigger) => trigger.kill());
  }, [prefersReduced]);

  function handleAddToCart() {
    addItem(product, selectedSize);
    openCart();
  }

  // Prefer images.details (fabric/print) as the source when the active
  // product has it — all four rotation products do now — falling back to
  // gallery[2]/[3] for any future rotation entry that doesn't.
  const DETAILS: { src: string; label: string }[] = product.images.details
    ? [
        { src: product.images.details.fabric, label: "Cuff" },
        { src: product.images.details.print, label: "Flatlay" },
      ]
    : [
        { src: product.images.gallery[2] ?? product.images.main, label: "Cuff" },
        { src: product.images.gallery[3] ?? product.images.main, label: "Flatlay" },
      ];

  const crossfadeTransition = {
    duration: shouldReduceMotion ? 0 : 0.5,
    ease: EASE_OUT_MOTION,
  };

  return (
    <section
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      className="bg-bg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="md:sticky md:top-20 md:h-[calc(100vh-5rem)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={product.id}
              src={product.images.main}
              alt={product.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={crossfadeTransition}
              className="h-full w-full object-cover"
            />
          </AnimatePresence>
        </div>

        <div className="flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={crossfadeTransition}
              className="flex flex-col gap-6 px-6 py-16 md:px-10 md:py-24"
            >
              <span className="mono-label text-muted">Latest Drop</span>
              <h2 className="text-display font-display uppercase text-paper">
                {product.name}
              </h2>
              <p className="mono-label text-acid">{product.moodLine}</p>

              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-3">
                  {product.priceSale ? (
                    <>
                      <span className="font-mono text-h3 uppercase tracking-mono text-sale">
                        {formatPrice(product.priceSale)}
                      </span>
                      <span className="font-mono text-h3 uppercase tracking-mono text-muted line-through">
                        {formatPrice(product.priceMRP)}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono text-h3 uppercase tracking-mono text-paper">
                      {formatPrice(product.priceMRP)}
                    </span>
                  )}
                </div>
                <span className="mono-label text-muted">Incl. of all taxes</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    className={cn(
                      "mono-label border px-4 py-2 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                      selectedSize === size
                        ? "border-acid bg-acid text-bg"
                        : "border-line text-paper hover:border-acid"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddToCart}
                onMouseEnter={() => setCursorLabel("ADD")}
                onMouseLeave={() => setCursorLabel(null)}
                className="mt-2 w-full rounded-full bg-acid px-8 py-4 mono-label text-bg transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid-dim md:w-auto"
              >
                Add to Cart
              </button>
            </motion.div>
          </AnimatePresence>

          {/* Fabric / Cut / Print, straight from specs — a lighter-weight
              text-only teaser for the same story the PDP's SpecStory tells
              in full (see that component). No dedicated imagery for this,
              deliberately: the two real detail shots below already carry
              the visual weight. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={crossfadeTransition}
              className="grid grid-cols-1 gap-6 border-t border-line px-6 py-10 sm:grid-cols-3 md:px-10"
            >
              {SPEC_STORY.map(({ label, key }) => (
                <div key={key} className="flex flex-col gap-2">
                  <span className="mono-label text-acid">{label}</span>
                  <p className="text-body text-paper">{product.specs[key]}</p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {DETAILS.map(({ src, label }, i) => (
            <div key={label} className="relative aspect-[4/5] overflow-hidden">
              <div
                ref={(el) => {
                  maskRefs.current[i] = el;
                }}
                className="absolute inset-0"
                style={{
                  clipPath: prefersReduced
                    ? "inset(0% 0% 0% 0%)"
                    : "inset(0% 0% 100% 0%)",
                }}
              >
                {/* Keyed by product id so it fades in fresh on every
                    rotation, without remounting the mask div above (and
                    re-arming its one-shot scroll reveal). */}
                <motion.img
                  key={`${label}-${product.id}`}
                  src={src}
                  alt={`${product.name} — ${label} detail`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={crossfadeTransition}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="absolute bottom-6 left-6 mono-label text-paper">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
