import React from "react";
import { requireOwner } from "@/server/admin-auth";
import { AdminShell } from "@/components/admin/admin-shell";
import "../admin-reference.css";

export const metadata = {
  title: "OVIA Admin Control Center",
  description: "Private Shop-Owner Administration System",
};

export default async function AdminControlCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real server-side authorization check before ANY admin page renders:
  const owner = await requireOwner();

  return (
    <AdminShell ownerName={owner.name} ownerEmail={owner.email}>
      {children}
    </AdminShell>
  );
}
