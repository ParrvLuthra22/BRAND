"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { gsap } from "@/lib/gsap";
import { products, type Product } from "@/data/products";
import { RailTransitionCanvas } from "@/components/webgl/RailTransitionCanvas";
import { ProductImage } from "@/components/ui/ProductImage";

const SCROLL_PER_ITEM_VH = 1; // vertical scroll (viewport heights) per item
const BACKDROP_PARALLAX = 10; // %, drifts opposite to the cutout
const CUTOUT_PARALLAX = 6; // %

const EXPLORE_LINK_CLASS =
  "mono-label shrink-0 rounded-full border border-acid px-5 py-2 text-acid transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid hover:text-bg";

// Per-product ambient tone, standing in for real backdrop photography — no
// product has a backdrop plate shot yet (images.backdrop is now unused
// entirely; kept on the type as a future affordance for whenever real
// photography arrives, see data/products.ts). This is the Tier-2
// "per-product backdrop tone shift" brief (cold graphite ONYX/MONO, warm
// light BONE, faint acid-green glow VENOM), implemented as a radial-gradient
// wash — a single source of truth (`inner`/`outer` colour stops) drives both
// the DOM layer (CSS radial-gradient, see railToneCss) and the WebGL
// transition overlay's texture (canvas-drawn, see createGradientBackdrop),
// so the two never drift out of sync with each other.
const RAIL_TONE_STOPS: Record<string, [inner: string, outer: string]> = {
  "onyx-hoodie": ["#242424", "#0A0A0A"],
  "bone-hoodie": ["rgba(242,240,235,0.22)", "#0A0A0A"],
  "venom-hoodie": ["rgba(198,255,0,0.22)", "#0A0A0A"],
  "mono-tee": ["#242424", "#0A0A0A"],
};

function railToneCss(id: string): string {
  const [inner, outer] = RAIL_TONE_STOPS[id];
  return `radial-gradient(ellipse at center, ${inner} 0%, ${outer} 65%)`;
}

// Bakes the same tone stops into a real bitmap (near-black base fill, then
// the radial wash on top) so RailTransitionCanvas's WebGL pulse — which
// needs an actual <img>/texture, not a CSS value — always has a real,
// on-brand-coloured image to distort instead of a failed network image
// (transparent/black), which is what produced the "dead black frame" during
// between-item transitions before this fix (a 404'd <img> has no natural
// dimensions, so the shared shader had nothing to bind and rendered mostly
// black at exactly the moment its distortion pulse peaked).
// 16:9 — the WebGL overlay's shader does a "contain fit" (see heroShaders.ts's
// containUv), so a texture whose aspect ratio is far from the viewport's
// (a portrait canvas under a wide desktop viewport, say) gets letterboxed
// into flat near-black bands covering most of the frame — which is exactly
// what produced a "dead black frame" at the exact midpoint of a between-item
// transition (canvas opacity peaks to 1 there, so the letterbox bands become
// the whole visible screen). A wide, common-viewport-ish aspect keeps the
// letterbox minimal for realistic desktop widths.
function createGradientBackdrop(
  stops: [string, string],
  width = 1600,
  height = 900
): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, width, height);
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.65
  );
  gradient.addColorStop(0, stops[0]);
  gradient.addColorStop(1, stops[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.src = canvas.toDataURL("image/png");
  });
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
  const backdropRefs = useRef<(HTMLDivElement | null)[]>([]);
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

  // Generated (not fetched) backdrop plates for the shared WebGL transition
  // overlay — see createGradientBackdrop's comment above. Not gated behind
  // the pin: the DOM tone layers render immediately either way via plain
  // CSS, and the overlay itself is invisible at rest regardless of load
  // state; this only needs to resolve before the rail's between-item pulse
  // first plays.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      products.map((product) => createGradientBackdrop(RAIL_TONE_STOPS[product.id]))
    ).then((generated) => {
      if (!cancelled) setBackdropImages(generated);
    });
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
            {/* Generated tone wash, not a photo — no product has a backdrop
                plate shot yet. Carries the same parallax ref/tween a real
                backdrop <img> would have (see the parallax loop below), so
                swapping in real photography later is a one-line change: give
                this div a background-image instead of just a color. */}
            <div
              ref={(el) => {
                backdropRefs.current[i] = el;
              }}
              aria-hidden
              className="absolute inset-0"
              style={{ background: railToneCss(product.id) }}
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
        {/* Generated tone wash, not a photo — same as the desktop track's
            backdrop layer above. No <img> at all here: no product has a
            backdrop plate shot yet, and ProductImage's "Coming Soon"
            fallback (right for a missing garment photo) would just paint an
            opaque box over this glow if used for a decorative backdrop. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: railToneCss(product.id) }}
        />
        <ProductImage
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
