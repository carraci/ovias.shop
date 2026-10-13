"use client";

import type { ImageProps } from "next/image";
import Image from "next/image";
import { useState, useEffect } from "react";

type Props = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSources?: (string | undefined | null)[];
};

export function isProductPhoto(source?: string | null): boolean {
  if (!source || typeof source !== "string") return false;
  const s = source.trim();
  return s.length > 0;
}

export function ProductPhoto({ src, fallbackSources = [], alt, ...props }: Props) {
  const candidates = [src, ...fallbackSources].filter(
    (source): source is string => Boolean(source && typeof source === "string" && isProductPhoto(source))
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [src]);

  const current = candidates[currentIndex];
  if (!current) return null;

  let unoptimized = props.unoptimized;
  if (!unoptimized && current.startsWith("http")) {
    try {
      const u = new URL(current);
      if (!["res.cloudinary.com", "www.rimowa.com"].includes(u.hostname)) {
        unoptimized = true;
      }
    } catch {
      unoptimized = true;
    }
  }

  return (
    <Image
      {...props}
      unoptimized={unoptimized}
      alt={alt || "Product photo"}
      src={current}
      onError={() => {
        if (currentIndex + 1 < candidates.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setCurrentIndex(-1);
        }
      }}
    />
  );
}

