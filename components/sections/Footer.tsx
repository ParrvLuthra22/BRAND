"use client";

import { useCaptureModalStore } from "@/lib/capture-modal-store";

export function Footer() {
  const openCaptureModal = useCaptureModalStore((state) => state.open);

  return (
    <footer className="flex flex-col gap-8 border-t border-line px-6 py-10 md:px-10">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <span className="text-h3 font-display uppercase text-paper">Brand</span>
        <button
          onClick={openCaptureModal}
          className="mono-label rounded-full border border-acid px-6 py-3 text-acid transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid hover:text-bg"
        >
          Join the Cult
        </button>
      </div>
      <span className="mono-label text-muted">
        © {new Date().getFullYear()} Brand. All rights reserved.
      </span>
    </footer>
  );
}
