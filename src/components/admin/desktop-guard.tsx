"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Monitor } from "lucide-react";

export function DesktopGuard({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWidth = () => {
      // A narrow desktop window is still a desktop; viewport width alone is not a device check.
      setIsDesktop(window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.screen.width >= 1024 || window.innerWidth >= 1024);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // During SSR or initial mount, avoid layout flash by rendering or matching media
  if (isDesktop === false) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          padding: "32px 24px",
          fontFamily: "var(--sans)",
          color: "#111111",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 440, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "#F7F7F5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E5E5E5",
            }}
          >
            <Monitor size={24} color="#111111" strokeWidth={1.5} />
          </div>

          <div>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#6B6B6B",
                marginBottom: 8,
              }}
            >
              OVIA LUXURY TRAVEL ESSENTIALS
            </p>
            <h1
              style={{
                fontFamily: "var(--serif)",
                fontSize: 24,
                fontWeight: 400,
                margin: "0 0 16px",
                letterSpacing: "-0.01em",
              }}
            >
              OVIA Admin Control Center
            </h1>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#6B6B6B",
                margin: 0,
              }}
            >
              The administration console is designed for desktop and laptop devices. Open it on a computer for the full workspace.
            </p>
          </div>

          <Link
            href="/"
            style={{
              marginTop: 12,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 28px",
              backgroundColor: "#111111",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textDecoration: "none",
              borderRadius: 2,
              transition: "opacity 0.2s ease",
            }}
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
