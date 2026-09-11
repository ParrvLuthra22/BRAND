"use client";

import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * A plain <img> that falls back to a flat placeholder panel on error
 * instead of the browser's broken-image icon — for the 5 seed products
 * that don't have real photography yet (only onyx-hoodie does; see
 * data/products.ts). Same props as <img>, so it drops in anywhere one
 * currently is.
 */
export function ProductImage({
  className,
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden={!alt}
        className={cn(
          "flex items-center justify-center bg-concrete",
          className
        )}
      >
        <span className="mono-label text-muted">Coming Soon</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
