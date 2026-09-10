"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, EASE_OUT } from "@/lib/gsap";
import { products } from "@/data/products";
import { ProductCard } from "@/components/ui/ProductCard";

export function ShopGrid() {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useLayoutEffect(() => {
    setPrefersReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // Same one-shot reveal-on-enter pattern as TheDrop's detail panels — each
  // card animates in independently the first time it crosses the trigger
  // point, which naturally staggers row by row as the grid scrolls into view.
  useEffect(() => {
    if (prefersReduced) return;
    const triggers = itemRefs.current
      .filter((el): el is HTMLDivElement => !!el)
      .map((el, i) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () => {
            gsap.to(el, {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: EASE_OUT,
              delay: (i % 4) * 0.06,
            });
          },
        })
      );
    return () => triggers.forEach((trigger) => trigger.kill());
  }, [prefersReduced]);

  return (
    <section className="px-6 py-24 md:px-10">
      <h2 className="mb-12 text-h3 font-display uppercase text-paper">
        Shop the Drop
      </h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-16 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, i) => (
          <div
            key={product.id}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            style={
              prefersReduced
                ? undefined
                : { opacity: 0, transform: "translateY(32px)" }
            }
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
