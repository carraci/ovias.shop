"use client";
import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export function LiveStorefront() {
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const pending = useRef(refreshing);
  pending.current = refreshing;

  // Real-time visitor heartbeat tracking
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    try {
      let visitorId = sessionStorage.getItem("ovia_vid");
      if (!visitorId) {
        visitorId = `v-${Math.random().toString(36).substring(2, 10)}`;
        sessionStorage.setItem("ovia_vid", visitorId);
      }
      const sendPing = () => {
        if (document.visibilityState !== "visible") return;
        const payload = JSON.stringify({ path: pathname, visitorId });
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/v1/analytics/heartbeat", new Blob([payload], { type: "application/json" }));
        } else {
          void fetch("/api/v1/analytics/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      };

      sendPing();
      const interval = setInterval(sendPing, 30000);
      return () => clearInterval(interval);
    } catch {}
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/products" && !/^\/(bags|luggage|accessories|new|collections|search)(\/|$)/.test(pathname)) return;
    const loadedAt = performance.now();
    const refresh = () => {
      if (document.readyState !== "complete" || performance.now() - loadedAt < 15000) return;
      if (!pending.current && document.visibilityState === "visible") startTransition(() => router.refresh());
    };
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [pathname, router]);

  return null;
}

