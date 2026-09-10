"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { gsap } from "@/lib/gsap";
import { products, type Product } from "@/data/products";
import { RailTransitionCanvas } from "@/components/webgl/RailTransitionCanvas";

const SCROLL_PER_ITEM_VH = 1; // vertical scroll (viewport heights) per item
const BACKDROP_PARALLAX = 10; // %, drifts opposite to the cutout
const CUTOUT_PARALLAX = 6; // %

const EXPLORE_LINK_CLASS =
  "mono-label shrink-0 rounded-full border border-acid px-5 py-2 text-acid transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid hover:text-bg";

function preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = src;
        })
    )
  );
}

function isMobileViewport(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

type RailMode = "mobile" | "desktop" | "reduced";

export function SceneRail() {
  // SSR-safe default: the lightest markup (no pin, no WebGL), matching the
  // first client render too — upgraded pre-paint in the layout effect below,
  // same pattern as Hero/SceneUnfold's reduced-motion / WebGL-support checks.
  const [mode, setMode] = useState<RailMode>("mobile");
  const [backdropImages, setBackdropImages] = useState<HTMLImageElement[]>([]);

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const backdropRefs = useRef<(HTMLImageElement | null)[]>([]);
  const cutoutRefs = useRef<(HTMLImageElement | null)[]>([]);
  const progressRef = useRef(0);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setMode("reduced");
    } else if (isMobileViewport()) {
      setMode("mobile");
    } else {
      setMode("desktop");
    }
  }, []);

  // The rail's own backdrop plates, for the shared WebGL transition overlay.
  // Not gated behind the pin — the DOM backdrops render immediately either
  // way, and the overlay is invisible at rest regardless of load state.
  useEffect(() => {
    let cancelled = false;
    preloadImages(products.map((product) => product.images.backdrop)).then(
      (loaded) => {
        if (!cancelled) setBackdropImages(loaded);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const getProgress = useCallback(() => progressRef.current, []);

  useEffect(() => {
    if (mode !== "desktop" || !sectionRef.current || !trackRef.current) return;

    const itemCount = products.length;
    const travelX = () => (itemCount - 1) * window.innerWidth;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: () =>
          `+=${(itemCount - 1) * window.innerHeight * SCROLL_PER_ITEM_VH}`,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      },
    });

    // Main horizontal travel — the track itself.
    tl.to(trackRef.current, { x: () => -travelX(), ease: "none", duration: 1 }, 0);

    // Parallax: backdrop and cutout drift by different (small, opposite)
    // amounts across the same scroll range, layered on top of the track's
    // own translation.
    for (const el of backdropRefs.current) {
      if (!el) continue;
      tl.fromTo(
        el,
        { xPercent: -BACKDROP_PARALLAX },
        { xPercent: BACKDROP_PARALLAX, ease: "none", duration: 1 },
        0
      );
    }
    for (const el of cutoutRefs.current) {
      if (!el) continue;
      tl.fromTo(
        el,
        { xPercent: CUTOUT_PARALLAX },
        { xPercent: -CUTOUT_PARALLAX, ease: "none", duration: 1 },
        0
      );
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [mode]);

  if (mode === "reduced") {
    return (
      <section className="bg-bg px-6 py-24 md:px-10">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
          {products.map((product) => (
            <RailCard
              key={product.id}
              product={product}
              className="w-[80%] shrink-0 snap-start md:w-[40%]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (mode === "mobile") {
    return <SceneRailCarousel />;
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-bg"
    >
      <div ref={trackRef} className="absolute inset-0 flex">
        {products.map((product, i) => (
          <div
            key={product.id}
            className="relative h-full w-screen shrink-0 overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={(el) => {
                backdropRefs.current[i] = el;
              }}
              src={product.images.backdrop}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={(el) => {
                cutoutRefs.current[i] = el;
              }}
              src={product.images.cutout}
              alt={product.name}
              className="absolute inset-0 m-auto h-[62%] w-auto object-contain"
            />
            <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-6 p-6 md:p-10">
              <p className="max-w-xl text-display font-display uppercase text-paper">
                {product.moodLine}
              </p>
              <Link href={`/products/${product.id}`} className={EXPLORE_LINK_CLASS}>
                Explore
              </Link>
            </div>
          </div>
        ))}
      </div>

      <RailTransitionCanvas
        images={backdropImages}
        getProgress={getProgress}
        className="pointer-events-none absolute inset-0 z-20"
      />
    </section>
  );
}

function SceneRailCarousel() {
  const [emblaRef] = useEmblaCarousel({ align: "start", dragFree: false });

  return (
    <section className="bg-bg px-6 py-16">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((product) => (
            <RailCard
              key={product.id}
              product={product}
              className="w-[85%] min-w-0 shrink-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RailCard({
  product,
  className,
}: {
  product: Product;
  className: string;
}) {
  return (
    <div className={className}>
      <div className="relative aspect-[3/4] overflow-hidden bg-concrete">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images.backdrop}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images.cutout}
          alt={product.name}
          className="absolute inset-0 m-auto h-[62%] w-auto object-contain"
        />
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-h3 font-display uppercase text-paper">
          {product.moodLine}
        </p>
        <Link href={`/products/${product.id}`} className={EXPLORE_LINK_CLASS}>
          Explore
        </Link>
      </div>
    </div>
  );
}
