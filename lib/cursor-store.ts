import { create } from "zustand";

export type CursorLabel = "VIEW" | "DRAG" | "ADD" | null;

// Same tiny shared-UI-state shape as cart-store/capture-modal-store, minus
// isOpen/open/close — here the "state" is just whatever label the pointer
// is currently over, set by whichever component the pointer enters
// (ProductCard's image, SceneRail's desktop track, the various Add to Cart
// buttons) and cleared on mouse-leave. <Cursor/> is the only reader.
type CursorState = {
  label: CursorLabel;
  setLabel: (label: CursorLabel) => void;
};

export const useCursorStore = create<CursorState>((set) => ({
  label: null,
  setLabel: (label) => set({ label }),
}));
