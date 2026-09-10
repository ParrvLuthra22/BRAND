"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCartStore } from "@/lib/cart-store";
import { products } from "@/data/products";
import { formatPrice, EASE_OUT } from "@/lib/utils";

const MAX_QUANTITY = 10;

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const lines = useCartStore((state) => state.lines);
  const close = useCartStore((state) => state.close);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  const items = lines
    .map((line) => ({
      line,
      product: products.find((product) => product.id === line.productId),
    }))
    .filter(
      (entry): entry is { line: typeof entry.line; product: NonNullable<typeof entry.product> } =>
        !!entry.product
    );

  const subtotal = items.reduce(
    (sum, { line, product }) =>
      sum + (product.priceSale ?? product.priceMRP) * line.quantity,
    0
  );
  const mrpTotal = items.reduce(
    (sum, { line, product }) => sum + product.priceMRP * line.quantity,
    0
  );
  const savings = mrpTotal - subtotal;

  function handleDecrement(productId: string, size: string, quantity: number) {
    if (quantity <= 1) {
      removeItem(productId, size);
    } else {
      setQuantity(productId, size, quantity - 1);
    }
  }

  function handleIncrement(productId: string, size: string, quantity: number) {
    setQuantity(productId, size, Math.min(quantity + 1, MAX_QUANTITY));
  }

  const overlayTransition = { duration: prefersReducedMotion ? 0 : 0.4, ease: EASE_OUT };
  const panelTransition = { duration: prefersReducedMotion ? 0 : 0.5, ease: EASE_OUT };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cart-overlay"
            aria-hidden
            onClick={close}
            className="fixed inset-0 z-40 bg-bg/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
          />
          <motion.aside
            key="cart-panel"
            role="dialog"
            aria-label="Cart"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-bg-raised"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={panelTransition}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <span className="mono-label text-paper">
                Cart {hasHydrated && `(${items.length})`}
              </span>
              <button
                onClick={close}
                aria-label="Close cart"
                className="mono-label text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-paper"
              >
                ✕
              </button>
            </div>

            {!hasHydrated ? (
              <div className="flex flex-1 flex-col gap-4 px-6 py-6" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse bg-concrete" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="mono-label text-muted">Your cart is empty.</p>
                <Link
                  href="/#shop"
                  onClick={close}
                  className="mono-label text-acid underline underline-offset-4"
                >
                  Shop the Drop
                </Link>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <ul className="flex flex-col gap-6">
                  {items.map(({ line, product }) => {
                    const price = product.priceSale ?? product.priceMRP;
                    return (
                      <li
                        key={`${line.productId}-${line.size}`}
                        className="flex items-start justify-between gap-4 border-b border-line pb-6"
                      >
                        <div className="flex flex-col gap-2">
                          <span className="text-h3 font-display uppercase text-paper">
                            {product.name}
                          </span>
                          <span className="mono-label text-muted">
                            Size {line.size}
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                handleDecrement(line.productId, line.size, line.quantity)
                              }
                              aria-label="Decrease quantity"
                              className="mono-label h-6 w-6 border border-line text-paper transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-acid"
                            >
                              −
                            </button>
                            <span className="mono-label w-4 text-center text-paper">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleIncrement(line.productId, line.size, line.quantity)
                              }
                              disabled={line.quantity >= MAX_QUANTITY}
                              aria-label="Increase quantity"
                              className="mono-label h-6 w-6 border border-line text-paper transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-acid disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="mono-label text-paper">
                            {formatPrice(price * line.quantity)}
                          </span>
                          <button
                            onClick={() => removeItem(line.productId, line.size)}
                            className="mono-label text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-sale"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {hasHydrated && items.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-line px-6 py-6">
                {savings > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="mono-label text-muted">MRP Total</span>
                    <span className="mono-label text-muted line-through">
                      {formatPrice(mrpTotal)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="mono-label text-muted">Subtotal</span>
                  <span className="mono-label text-paper">{formatPrice(subtotal)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="mono-label text-muted">You Saved</span>
                    <span className="mono-label text-sale">{formatPrice(savings)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="mono-label text-muted">Shipping</span>
                  <span className="mono-label text-paper">Free</span>
                </div>
                <Link
                  href="/checkout"
                  className="mt-2 w-full rounded-full bg-acid px-8 py-4 text-center mono-label text-bg transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid-dim"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
