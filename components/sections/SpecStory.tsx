"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, EASE_OUT } from "@/lib/gsap";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

const CHAPTERS: { index: string; title: string; key: keyof Product["specs"] }[] = [
  { index: "01 / 03", title: "Fabric", key: "fabric" },
  { index: "02 / 03", title: "Cut", key: "cut" },
  { index: "03 / 03", title: "Print", key: "print" },
];

// There's no dedicated "cut" image field (only fabric/print detail shots
// exist, and only for the featured product — see data/products.ts). Falling
// back through gallery -> main/alt keeps every chapter populated for every
// product, not just hoodie-blackout.
function chapterImage(product: Product, key: keyof Product["specs"]): string {
  const { images } = product;
  if (key === "fabric") return images.details?.fabric ?? images.gallery[0] ?? images.main;
  if (key === "print") return images.details?.print ?? images.gallery[1] ?? images.alt;
  return images.gallery[1] ?? images.gallery[0] ?? images.main;
}

export function SpecStory({ product }: { product: Product }) {
  const maskRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useLayoutEffect(() => {
    setPrefersReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  // Same one-shot mask-wipe as TheDrop's detail panels, just full-width per
  // chapter instead of a stacked column — see CLAUDE.md "TheDrop" for the
  // ScrollTrigger pattern this reuses.
  useEffect(() => {
    if (prefersReduced) return;
    const triggers = maskRefs.current
      .filter((el): el is HTMLDivElement => !!el)
      .map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 80%",
          once: true,
          onEnter: () => {
            gsap.to(el, {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.1,
              ease: EASE_OUT,
            });
          },
        })
      );
    return () => triggers.forEach((trigger) => trigger.kill());
  }, [prefersReduced]);

  return (
    <section>
      {CHAPTERS.map(({ index, title, key }, i) => {
        const reverse = i % 2 === 1;
        return (
          <div
            key={key}
            className={cn(
              "grid grid-cols-1 md:grid-cols-2",
              i % 2 === 0 ? "bg-bg" : "bg-bg-raised"
            )}
          >
            <div
              className={cn(
                "relative aspect-square overflow-hidden md:aspect-auto",
                reverse ? "md:order-2" : "md:order-1"
              )}
            >
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
                  src={chapterImage(product, key)}
                  alt={`${product.name} — ${title}`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div
              className={cn(
                "flex flex-col justify-center gap-4 px-6 py-16 md:px-10 md:py-24",
                reverse ? "md:order-1" : "md:order-2"
              )}
            >
              <span className="mono-label text-muted">{index}</span>
              <h3 className="text-display font-display uppercase text-paper">
                {title}
              </h3>
              <p className="text-body text-paper">{product.specs[key]}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
