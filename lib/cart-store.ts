import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/data/products";

export type CartLine = {
  productId: string;
  size: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  // False until zustand's persist middleware has read (or confirmed the
  // absence of) a saved cart from localStorage. CartDrawer gates its empty
  // vs. loading UI on this so a returning visitor never sees a false
  // "your cart is empty" flash before their real lines load in.
  hasHydrated: boolean;
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeItem: (productId: string, size: string) => void;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      hasHydrated: false,
      addItem: (product, size, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find(
            (line) => line.productId === product.id && line.size === size
          );
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line === existing
                  ? { ...line, quantity: line.quantity + quantity }
                  : line
              ),
            };
          }
          return {
            lines: [...state.lines, { productId: product.id, size, quantity }],
          };
        }),
      removeItem: (productId, size) =>
        set((state) => ({
          lines: state.lines.filter(
            (line) => !(line.productId === productId && line.size === size)
          ),
        })),
      setQuantity: (productId, size, quantity) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.productId === productId && line.size === size
              ? { ...line, quantity }
              : line
          ),
        })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "brand:cart",
      // Only `lines` is worth surviving a reload — isOpen/hasHydrated are
      // transient UI state, not cart contents.
      partialize: (state) => ({ lines: state.lines }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
