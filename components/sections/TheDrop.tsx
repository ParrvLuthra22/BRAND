"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, EASE_OUT } from "@/lib/gsap";
import { products } from "@/data/products";
import { useCartStore } from "@/lib/cart-store";
import { useCursorStore } from "@/lib/cursor-store";
import { cn, formatPrice } from "@/lib/utils";

// VENOM is the hero product — its acid-green cords/inner-hood lining are
// the one place the brand's signal color appears as a physical detail, not
// UI chrome, which is exactly the "featured" argument. See its own comment
// in data/products.ts.
const FEATURED = products.find((product) => product.id === "venom-hoodie")!;

// Two non-primary detail shots. Prefer images.details (fabric/print) when
// the featured product has it — VENOM does now (real crops from main/alt,
// see data/products.ts), and reading from there is what fixed a real bug:
// this used to fall back to gallery[2]/[3] with each entry independently
// defaulting to `main` when absent, which for VENOM (gallery is just
// [main, alt], no dedicated shots) meant *both* "Cuff" and "Flatlay" quietly
// rendered the exact same full-body photo, model included. onyx-hoodie has
// no `details` populated (its real detail-cuff/flatlay shots live directly
// in gallery[2]/[3] instead), so it still uses that branch correctly if it
// were ever featured again.
const DETAILS: { src: string; label: string }[] = FEATURED.images.details
  ? [
      { src: FEATURED.images.details.fabric, label: "Fabric" },
      { src: FEATURED.images.details.print, label: "Print" },
    ]
  : [
      { src: FEATURED.images.gallery[2] ?? FEATURED.images.main, label: "Cuff" },
      { src: FEATURED.images.gallery[3] ?? FEATURED.images.main, label: "Flatlay" },
    ];

const SPEC_STORY: { label: string; key: keyof typeof FEATURED.specs }[] = [
  { label: "Fabric", key: "fabric" },
  { label: "Cut", key: "cut" },
  { label: "Print", key: "print" },
];

export function TheDrop() {
  const product = FEATURED;
  const [selectedSize, setSelectedSize] = useState(
    product.sizes.includes("M") ? "M" : product.sizes[0]
  );
  const [prefersReduced, setPrefersReduced] = useState(false);

  const maskRefs = useRef<(HTMLDivElement | null)[]>([]);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);
  const setCursorLabel = useCursorStore((state) => state.setLabel);

  useLayoutEffect(() => {
    setPrefersReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // Each detail shot mask-wipes open once, the first time it's scrolled
  // into view — not scrubbed, not pinned, just a one-shot reveal per panel.
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

  return (
    <section className="bg-bg">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="md:sticky md:top-20 md:h-[calc(100vh-5rem)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images.main}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex flex-col gap-6 px-6 py-16 md:px-10 md:py-24">
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
          </div>

          {/* Fabric / Cut / Print, straight from specs — a lighter-weight
              text-only teaser for the same story the PDP's SpecStory tells
              in full (see that component). No dedicated imagery for this,
              deliberately: the two real detail shots below already carry
              the visual weight. */}
          <div className="grid grid-cols-1 gap-6 border-t border-line px-6 py-10 sm:grid-cols-3 md:px-10">
            {SPEC_STORY.map(({ label, key }) => (
              <div key={key} className="flex flex-col gap-2">
                <span className="mono-label text-acid">{label}</span>
                <p className="text-body text-paper">{product.specs[key]}</p>
              </div>
            ))}
          </div>

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${product.name} — ${label} detail`}
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
