"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, UserPlus, Key, Mail, CheckCircle2 } from "lucide-react";

export default function AdminUsersPage() {
  const [users] = useState([
    {
      id: "u-1",
      name: "Adarsh Shukla",
      email: "shuklaadarshcs232447@gmail.com",
      role: "Store Owner",
      permissions: "Full Access / Super Admin",
      status: "Active",
      lastLogin: "Active now",
    },
    {
      id: "u-2",
      name: "OVIA Concierge Staff",
      email: "concierge@ovias.shop",
      role: "Support Agent",
      permissions: "Orders, Live Chat & Customer Tickets",
      status: "Active",
      lastLogin: "2 hours ago",
    },
    {
      id: "u-3",
      name: "Fulfillment & Logistics Lead",
      email: "logistics@ovias.shop",
      role: "Operations Manager",
      permissions: "Delhivery Shipping & Inventory",
      status: "Active",
      lastLogin: "Yesterday",
    },
    {
      id: "u-4",
      name: "Editorial Content Lead",
      email: "editor@ovias.shop",
      role: "Content Editor",
      permissions: "Blog, Journal & Media Library",
      status: "Active",
      lastLogin: "3 days ago",
    },
  ]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", fontFamily: "var(--sans)" }}>
      {/* Breadcrumb */}
      <nav style={{ display: "flex", gap: 8, fontSize: 13, color: "#71717A", marginBottom: 12 }}>
        <Link href="/admin/settings" style={{ color: "#71717A", textDecoration: "none" }}>
          Settings
        </Link>
        <span>/</span>
        <span style={{ color: "#18181B", fontWeight: 500 }}>Users</span>
      </nav>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#18181B", margin: "0 0 6px 0" }}>
            Users & Roles
          </h1>
          <p style={{ fontSize: 14, color: "#71717A", margin: 0 }}>
            Manage administrative team members, security roles, and permissions.
          </p>
        </div>

        <button
          onClick={() => alert("Staff invitations sent via secure link.")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            backgroundColor: "#18181B",
            color: "#FFFFFF",
            borderRadius: 8,
            border: "1px solid #18181B",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <UserPlus size={14} />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Users Table Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E4E7",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F1F4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#18181B" }}>
            Active Team Members ({users.length})
          </span>
          <span style={{ fontSize: 12, color: "#71717A" }}>
            Owner: Adarsh Shukla
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F1F1F4", backgroundColor: "#FAFAFA", color: "#71717A", fontSize: 12 }}>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>NAME & EMAIL</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>ROLE</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>ACCESS SCOPE</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>LAST ACTIVE</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #F1F1F4" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, color: "#18181B" }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "#71717A" }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        backgroundColor: u.role === "Store Owner" ? "#FEF3C7" : "#F4F4F5",
                        color: u.role === "Store Owner" ? "#92400E" : "#3F3F46",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", color: "#52525B", fontSize: 12 }}>
                    {u.permissions}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#15803D", fontSize: 12, fontWeight: 500 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22C55E" }}></span>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", color: "#71717A", fontSize: 12 }}>
                    {u.lastLogin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
