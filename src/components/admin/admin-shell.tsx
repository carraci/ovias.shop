"use client";

import React from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { DesktopGuard } from "./desktop-guard";

interface AdminShellProps {
  children: React.ReactNode;
  ownerName?: string;
  ownerEmail?: string;
}

export function AdminShell({
  children,
  ownerName = "Adarsh Shukla",
  ownerEmail,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  return (
    <DesktopGuard>
      <div
        className={`ovia-admin ${sidebarOpen ? "" : "admin-sidebar-collapsed"}`}
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
          color: "#18181B",
          fontFamily: "var(--sans)",
        }}
      >
        {/* Left Fixed Sidebar */}
        <AdminSidebar ownerName={ownerName} ownerEmail={ownerEmail} />

        {/* Right Main Column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflowX: "hidden",
          }}
        >
          {/* Top Bar Header */}
          <AdminHeader
            ownerName={ownerName}
            ownerEmail={ownerEmail}
            onToggleSidebar={() => setSidebarOpen((value) => !value)}
            sidebarOpen={sidebarOpen}
          />

          {/* Main Work Area */}
          <main
            className="admin-workspace"
            style={{
              flex: 1,
              padding: "28px 32px 48px",
              maxWidth: 1600,
              width: "100%",
              margin: "0 auto",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </DesktopGuard>
  );
}
