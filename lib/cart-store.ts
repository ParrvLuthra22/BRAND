import { create } from "zustand";
import type { Product } from "@/data/products";

export type CartLine = {
  productId: string;
  size: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeItem: (productId: string, size: string) => void;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  isOpen: false,
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
}));
