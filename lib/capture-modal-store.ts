import { create } from "zustand";

// Same tiny "global overlay" shape as lib/cart-store.ts's isOpen/open/close —
// CaptureModal is mounted once in app/layout.tsx and triggered from anywhere
// (currently Footer's "Join the Cult" button) without prop-drilling.
type CaptureModalState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useCaptureModalStore = create<CaptureModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
