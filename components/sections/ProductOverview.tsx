"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/data/products";
import { useCartStore } from "@/lib/cart-store";
import { cn, formatPrice, EASE_OUT } from "@/lib/utils";

const MAX_QUANTITY = 10;

type Shot = { src: string; label: string };

// Every product has main/alt/gallery; only the featured product also has
// details (fabric/print/stitch) — see data/products.ts's "Product data"
// note. Falling back gracefully here means every PDP gets a real thumbnail
// rail, not just hoodie-blackout's.
function galleryFor(product: Product): Shot[] {
  const shots: Shot[] = [
    { src: product.images.main, label: "Front" },
    { src: product.images.alt, label: "Back" },
  ];
  product.images.gallery.forEach((src, i) => {
    shots.push({ src, label: `Look ${i + 1}` });
  });
  if (product.images.details) {
    shots.push({ src: product.images.details.fabric, label: "Fabric" });
    shots.push({ src: product.images.details.print, label: "Print" });
    shots.push({ src: product.images.details.stitch, label: "Stitch" });
  }
  return shots;
}

export function ProductOverview({ product }: { product: Product }) {
  const shots = galleryFor(product);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes.includes("M") ? "M" : product.sizes[0]
  );
  const [quantity, setQuantity] = useState(1);
  const prefersReducedMotion = useReducedMotion();

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);

  function handleAddToCart() {
    if (product.soldOut) return;
    addItem(product, selectedSize, quantity);
    openCart();
  }

  const active = shots[activeIndex];

  return (
    <section className="bg-bg">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Gallery column. top-20/calc(100vh-5rem) rather than TheDrop's
            plain top-0/h-screen — TopNav is fixed and appears on scroll, so
            a sticky column anchored at the very top would spend most of its
            stuck life partly hidden underneath it. */}
        <div className="flex flex-col md:sticky md:top-20 md:h-[calc(100vh-5rem)]">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="relative flex-1 cursor-zoom-in overflow-hidden bg-concrete"
            aria-label="Open full-size image"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.src}
              alt={`${product.name} — ${active.label}`}
              className="h-full w-full object-cover"
            />
          </button>

          <div className="flex gap-2 overflow-x-auto border-t border-line p-4">
            {shots.map((shot, i) => (
              <button
                key={shot.label}
                onClick={() => setActiveIndex(i)}
                aria-label={`View ${shot.label}`}
                aria-pressed={i === activeIndex}
                className={cn(
                  "relative aspect-square w-16 shrink-0 overflow-hidden border bg-concrete transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                  i === activeIndex
                    ? "border-acid"
                    : "border-line hover:border-muted"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shot.src}
                  alt=""
                  aria-hidden
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-6 px-6 py-16 md:px-10 md:py-24">
          <span className="mono-label text-muted">{product.colorway}</span>
          <h1 className="text-display font-display uppercase text-paper">
            {product.name}
          </h1>
          <p className="mono-label text-acid">{product.moodLine}</p>
          <p className="text-body text-paper">{product.hook}</p>
          <p className="mono-label text-muted">{product.useCase}</p>

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

          <div className={cn("flex flex-col gap-6", product.soldOut && "opacity-50")}>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={product.soldOut}
                  aria-pressed={selectedSize === size}
                  className={cn(
                    "mono-label border px-4 py-2 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] disabled:cursor-not-allowed",
                    selectedSize === size
                      ? "border-acid bg-acid text-bg"
                      : "border-line text-paper hover:border-acid"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <span className="mono-label text-muted">Qty</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={product.soldOut}
                  aria-label="Decrease quantity"
                  className="mono-label h-8 w-8 border border-line text-paper transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-acid disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="mono-label w-4 text-center text-paper">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                  disabled={product.soldOut}
                  aria-label="Increase quantity"
                  className="mono-label h-8 w-8 border border-line text-paper transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-acid disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleAddToCart}
              disabled={product.soldOut}
              className={cn(
                "w-full rounded-full px-8 py-4 mono-label transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                product.soldOut
                  ? "cursor-not-allowed border border-line text-muted"
                  : "bg-acid text-bg hover:bg-acid-dim"
              )}
            >
              {product.soldOut ? "Sold Out" : "Add to Cart"}
            </button>
            <span className="mono-label text-center text-muted">
              Ships within 24–48h
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            shots={shots}
            index={activeIndex}
            onIndexChange={setActiveIndex}
            onClose={() => setLightboxOpen(false)}
            prefersReducedMotion={!!prefersReducedMotion}
            productName={product.name}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function Lightbox({
  shots,
  index,
  onIndexChange,
  onClose,
  prefersReducedMotion,
  productName,
}: {
  shots: Shot[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  prefersReducedMotion: boolean;
  productName: string;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onIndexChange((index + 1) % shots.length);
      if (event.key === "ArrowLeft")
        onIndexChange((index - 1 + shots.length) % shots.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, shots.length, onClose, onIndexChange]);

  const shot = shots[index];
  const transition = { duration: prefersReducedMotion ? 0 : 0.4, ease: EASE_OUT };

  return (
    <motion.div
      role="dialog"
      aria-label="Image viewer"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-bg/95 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-6 top-6 mono-label text-paper transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-acid"
      >
        ✕
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shot.src}
        alt={`${productName} — ${shot.label}`}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[80vh] max-w-full object-contain"
      />

      <div
        className="mt-4 flex items-center gap-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={() => onIndexChange((index - 1 + shots.length) % shots.length)}
          aria-label="Previous image"
          className="mono-label text-paper transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-acid"
        >
          ← Prev
        </button>
        <span className="mono-label text-muted">{shot.label}</span>
        <button
          onClick={() => onIndexChange((index + 1) % shots.length)}
          aria-label="Next image"
          className="mono-label text-paper transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-acid"
        >
          Next →
        </button>
      </div>
    </motion.div>
  );
}
