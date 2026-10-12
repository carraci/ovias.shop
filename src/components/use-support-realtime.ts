"use client";
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
export function useSupportRealtime(refresh: () => void, enabled = true) {
  const latest = useRef(refresh);
  latest.current = refresh;
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let socket: Socket | undefined,
      alive = true;
    async function connect() {
      try {
        const res = await fetch("/api/support/realtime", { cache: "no-store" });
        if (!res.ok) return;
        const config = await res.json();
        if (!config.enabled || !alive) return;
        const { io } = await import("socket.io-client");
        if (!alive) return;
        socket?.disconnect();
        socket = io(config.url, {
          auth: { token: config.token },
          transports: ["websocket", "polling"],
          timeout: 5000,
          reconnectionAttempts: 3,
        });
        socket.on("connect", () => {
          if (alive) setConnected(true);
          latest.current();
        });
        socket.on("disconnect", () => {
          if (alive) setConnected(false);
        });
        socket.on("connect_error", () => {
          if (alive) setConnected(false);
        });
        socket.on("support:changed", () => latest.current());
        socket.on("account:changed", () => latest.current());
      } catch {
        if (alive) setConnected(false);
      }
    }
    void connect();
    const timer = setInterval(() => void connect(), 8 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(timer);
      socket?.disconnect();
    };
  }, [enabled]);
  return connected;
}
