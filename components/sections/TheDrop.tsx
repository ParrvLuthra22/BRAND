"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, EASE_OUT } from "@/lib/gsap";
import { products } from "@/data/products";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const FEATURED = products.find((product) => product.id === "hoodie-blackout")!;

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const DETAILS: {
  key: keyof NonNullable<(typeof FEATURED)["images"]["details"]>;
  label: string;
}[] = [
  { key: "fabric", label: "Fabric" },
  { key: "print", label: "Print" },
  { key: "stitch", label: "Stitch" },
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

  if (!product.images.details) return null;
  const details = product.images.details;

  return (
    <section className="bg-bg">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="md:sticky md:top-0 md:h-screen">
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
              className="mt-2 w-full rounded-full bg-acid px-8 py-4 mono-label text-bg transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid-dim md:w-auto"
            >
              Add to Cart
            </button>
          </div>

          {DETAILS.map(({ key, label }, i) => (
            <div key={key} className="relative aspect-[4/5] overflow-hidden">
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
                  src={details[key]}
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
