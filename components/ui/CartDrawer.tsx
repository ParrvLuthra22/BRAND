"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";
import { products } from "@/data/products";
import { cn } from "@/lib/utils";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const lines = useCartStore((state) => state.lines);
  const close = useCartStore((state) => state.close);
  const removeItem = useCartStore((state) => state.removeItem);

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

  return (
    <>
      <div
        aria-hidden
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-bg/70 transition-opacity duration-[var(--dur-med)] ease-[var(--ease-out)]",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        role="dialog"
        aria-label="Cart"
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-bg-raised transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <span className="mono-label text-paper">Cart ({items.length})</span>
          <button
            onClick={close}
            aria-label="Close cart"
            className="mono-label text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-paper"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <p className="mono-label text-muted">Your cart is empty.</p>
          ) : (
            <ul className="flex flex-col gap-6">
              {items.map(({ line, product }) => {
                const price = product.priceSale ?? product.priceMRP;
                return (
                  <li
                    key={`${line.productId}-${line.size}`}
                    className="flex items-start justify-between gap-4 border-b border-line pb-6"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-h3 font-display uppercase text-paper">
                        {product.name}
                      </span>
                      <span className="mono-label text-muted">
                        Size {line.size} · Qty {line.quantity}
                      </span>
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
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-6 py-6">
            <div className="flex items-center justify-between">
              <span className="mono-label text-muted">Subtotal</span>
              <span className="mono-label text-paper">{formatPrice(subtotal)}</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
