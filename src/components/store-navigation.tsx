"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Static card links share navigation instead of each subscribing to the router.
export function StoreNavigation() {
  const router = useRouter();
  useEffect(() => {
    function navigate(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-store-navigation]") : null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/") || anchor.getAttribute("href")?.startsWith("#")) return;
      event.preventDefault();
      router.push(`${url.pathname}${url.search}${url.hash}`);
    }
    document.addEventListener("click", navigate);
    return () => document.removeEventListener("click", navigate);
  }, [router]);
  return null;
}
