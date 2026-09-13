"use client";

import { useLayoutEffect, useState, type MouseEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { Product } from "@/data/products";
import { useCartStore } from "@/lib/cart-store";
import { cn, formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/ui/ProductImage";

// Subtle tilt cap, in degrees — a "hint" of 3D, not a gimmick.
const MAX_TILT = 6;

export function ProductCard({
  product,
  className,
  imageClassName,
}: {
  product: Product;
  className?: string;
  /**
   * Overrides the image container's default `aspect-[3/4]` box — for
   * ShopGrid's bento cells, where the cell's own grid row/col span (not a
   * fixed aspect ratio) determines the shape, so the image needs to fill
   * whatever height the cell gives it instead. Every other caller (the
   * PDP's RelatedProducts rail) omits this and keeps the standard card
   * shape.
   */
  imageClassName?: string;
}) {
  const [showAlt, setShowAlt] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  // Same "coarse pointer" check used for Hero/SceneRail's mobile-lite split —
  // tap-to-swap replaces hover-crossfade, and tilt (a hover gesture) is
  // skipped entirely rather than driven by touch coordinates.
  useLayoutEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  function handleMouseEnter() {
    if (isTouch) return;
    setShowAlt(true);
  }

  function handleMouseLeave() {
    if (isTouch) return;
    setShowAlt(false);
    rotateX.set(0);
    rotateY.set(0);
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (isTouch || prefersReducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * MAX_TILT);
    rotateX.set(-py * MAX_TILT);
  }

  function handleTap() {
    if (!isTouch) return;
    setShowAlt((value) => !value);
  }

  function handleAddToCart() {
    if (product.soldOut) return;
    const size = product.sizes.includes("M") ? "M" : product.sizes[0];
    addItem(product, size);
    openCart();
  }

  return (
    <article className={cn("flex flex-col gap-4", className)}>
      <motion.div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleTap}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformPerspective: 800,
        }}
        className={imageClassName ?? "relative aspect-[3/4] overflow-hidden bg-concrete"}
      >
        {product.priceSale && (
          <span className="mono-label absolute left-3 top-3 z-10 border border-sale bg-bg/80 px-2 py-1 text-sale">
            Sale
          </span>
        )}

        <ProductImage
          src={product.images.main}
          alt={product.name}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-[var(--dur-fast)] ease-[var(--ease-out)]",
            showAlt && "opacity-0"
          )}
        />
        <ProductImage
          src={product.images.alt}
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-[var(--dur-fast)] ease-[var(--ease-out)]",
            showAlt && "opacity-100"
          )}
        />
      </motion.div>

      <div className="flex flex-col gap-1">
        <h3 className="text-h3 font-display uppercase text-paper">
          {product.name}
        </h3>
        <p className="mono-label text-acid">{product.moodLine}</p>

        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          {product.priceSale ? (
            <>
              <span className="mono-label text-sale">
                {formatPrice(product.priceSale)}
              </span>
              <span className="mono-label text-muted line-through">
                {formatPrice(product.priceMRP)}
              </span>
            </>
          ) : (
            <span className="mono-label text-paper">
              {formatPrice(product.priceMRP)}
            </span>
          )}
        </div>
        <span className="mono-label text-muted">Incl. of all taxes</span>
      </div>

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
    </article>
  );
}
