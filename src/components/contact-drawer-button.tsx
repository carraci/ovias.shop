"use client";

import { openContactDrawer } from "@/lib/client-services-config";
import React from "react";

interface ContactDrawerButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "link";
  ariaLabel?: string;
}

export function ContactDrawerButton({
  children = "CONTACT US",
  className = "",
  variant = "primary",
  ariaLabel = "Contact OVIA Client Services",
}: ContactDrawerButtonProps) {
  let baseStyle = "ovia-contact-trigger";
  if (variant === "primary") baseStyle += " button dark";
  else if (variant === "secondary") baseStyle += " button light";
  else if (variant === "link") baseStyle += " text-link";

  return (
    <button
      type="button"
      className={`${baseStyle} ${className}`.trim()}
      onClick={() => openContactDrawer()}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
