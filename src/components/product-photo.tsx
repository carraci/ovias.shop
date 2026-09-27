"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type Props = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  fallbackSources?: string[];
};

// A missing asset must never be replaced with a different product's photograph.
export function ProductPhoto({ src, fallbackSources = [], ...props }: Props) {
  const [failed, setFailed] = useState<string[]>([]);
  const source = [src, ...fallbackSources].find(
    (value) => value && !failed.includes(value),
  );
  if (!source)
    return (
      <span
        role="img"
        aria-label={`${props.alt || "Product image"} — image unavailable`}
        style={{
          position: props.fill ? "absolute" : "relative",
          inset: props.fill ? 0 : undefined,
          display: "grid",
          placeItems: "center",
          padding: 16,
          color: "#77746c",
          fontSize: 11,
          textAlign: "center",
          background: "#eeece5",
          minHeight: props.fill ? undefined : 200,
        }}
      >
        Image unavailable
      </span>
    );
  return (
    <Image
      {...props}
      src={source}
      onError={() => setFailed((values) => [...values, source])}
    />
  );
}
