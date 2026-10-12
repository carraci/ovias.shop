"use client";
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Render storefront navigation on the server; omit it from admin routes. */
export function StorefrontChrome({children, hideOnCheckout = false}: {children: ReactNode; hideOnCheckout?: boolean}) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname?.startsWith("/admin/")) return null;
  if (hideOnCheckout && pathname?.startsWith("/checkout")) return null;
  return children;
}
