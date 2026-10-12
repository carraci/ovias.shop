import { getAuthenticatedOwner } from "@/server/admin-auth";
import { redirect } from "next/navigation";
import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default async function AdminUnauthorizedPage() {
  if (await getAuthenticatedOwner()) redirect("/admin");
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
      }}
    >
      <div
        style={{
          maxWidth: 480,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #FEE2E2",
          }}
        >
          <ShieldAlert size={28} color="#DC2626" strokeWidth={1.5} />
        </div>

        <div>
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#DC2626",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            403 FORBIDDEN — OWNER ACCESS ONLY
          </p>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: 28,
              fontWeight: 400,
              margin: "0 0 16px",
              letterSpacing: "-0.01em",
            }}
          >
            Access Denied
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#6B6B6B",
              margin: "0 0 8px",
            }}
          >
            The OVIA Admin Control Center is a private operational system strictly restricted to the verified shop owner (role: <strong>OWNER</strong>).
          </p>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "#9CA3AF",
              margin: 0,
            }}
          >
            Your current account credentials do not grant access to store management, customer records, inventory, or financial analytics.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              backgroundColor: "#111111",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              borderRadius: 2,
            }}
          >
            <ArrowLeft size={14} /> Return to Store
          </Link>

          <Link
            href="/admin/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "12px 20px",
              backgroundColor: "#F7F7F5",
              color: "#111111",
              border: "1px solid #E5E5E5",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              borderRadius: 2,
            }}
          >
            Sign in as Owner
          </Link>
        </div>
      </div>
    </div>
  );
}
