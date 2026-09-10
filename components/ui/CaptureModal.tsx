"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCaptureModalStore } from "@/lib/capture-modal-store";
import { cn, EASE_OUT } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "loading" | "success" | "error";

// No real backend — this simulates the round trip so the loading/success
// states are genuine, not just decorative. Rejects on invalid input only,
// so both outcomes stay deterministic and testable.
function submitEmail(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (EMAIL_RE.test(email)) resolve();
      else reject(new Error("invalid"));
    }, 700);
  });
}

export function CaptureModal() {
  const isOpen = useCaptureModalStore((state) => state.isOpen);
  const close = useCaptureModalStore((state) => state.close);
  const prefersReducedMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  // Reset to a blank form each time the modal is reopened, rather than
  // leaving a prior success/error message stuck behind the next open.
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setStatus("idle");
    }
  }, [isOpen]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      await submitEmail(email);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const overlayTransition = { duration: prefersReducedMotion ? 0 : 0.4, ease: EASE_OUT };
  const panelTransition = {
    duration: prefersReducedMotion ? 0 : 0.5,
    ease: EASE_OUT,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="capture-overlay"
            aria-hidden
            onClick={close}
            className="fixed inset-0 z-40 bg-bg/85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
          />
          <motion.div
            key="capture-panel"
            role="dialog"
            aria-label="Join the Cult"
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
          >
            <motion.div
              className="relative w-full max-w-md border border-line bg-bg-raised p-8 md:p-10"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 24 }}
              transition={panelTransition}
            >
              <button
                onClick={close}
                aria-label="Close"
                className="mono-label absolute right-6 top-6 text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-paper"
              >
                ✕
              </button>

              {status === "success" ? (
                <div className="flex flex-col gap-3 py-8 text-center">
                  <p className="text-h2 font-display uppercase text-acid">
                    You&rsquo;re In.
                  </p>
                  <p className="mono-label text-muted">
                    First access, every drop. No noise.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-h2 font-display uppercase text-paper">
                      Join the Cult
                    </h2>
                    <p className="mono-label text-muted">
                      Early access. Restocks first. No spam, ever.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="YOUR@EMAIL.COM"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      aria-invalid={status === "error"}
                      className={cn(
                        "mono-label w-full border bg-transparent px-4 py-3 text-paper placeholder:text-muted focus:outline-none",
                        status === "error"
                          ? "border-sale"
                          : "border-line focus:border-acid"
                      )}
                    />
                    {status === "error" && (
                      <span className="mono-label text-sale">
                        That&rsquo;s not a real email. Try again.
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-full bg-acid px-8 py-4 mono-label text-bg transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-acid-dim disabled:cursor-wait disabled:opacity-70"
                  >
                    {status === "loading" ? "Joining…" : "Join the Cult"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
