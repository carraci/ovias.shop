import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getAdminCustomers } from "@/server/admin-service";
import { transaction } from "@/server/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const customers = await getAdminCustomers();
  // Ensure no password hashes or sensitive auth fields are ever exposed
  const sanitized = customers.map(({ ...c }) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    ordersCount: c.ordersCount,
    totalSpent: c.totalSpent,
    joined: c.joined,
    registered: (c as any).registered || c.joined,
    country: (c as any).country || "India",
    group: (c as any).group || "Default",
    status: c.status,
    avatar: (c as any).avatar || "",
  }));

  return NextResponse.json({ success: true, customers: sanitized }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const country = typeof body.country === "string" ? body.country.trim() : "India";
  const group = typeof body.group === "string" ? body.group.trim() : "Default";

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const result = await transaction(async (repo) => {
    const existingUsers = await repo.find<any>("users");
    const existing = existingUsers.find((u) => u.email?.toLowerCase() === email);
    if (existing) {
      return { error: "A customer with this email already exists." };
    }

    const newUser = {
      id: randomUUID(),
      name,
      email,
      phone,
      country,
      group,
      role: group === "Owner" ? "OWNER" : "CUSTOMER",
      status: "Active",
      createdAt: new Date().toISOString(),
      avatar: body.avatar || "",
      addresses: body.address ? [{
        id: `addr_${randomUUID().slice(0, 8)}`,
        name,
        type: "Default Shipping",
        address: body.address,
      }] : [],
    };

    await repo.put("users", newUser);
    return { customer: newUser };
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, customer: result.customer }, { status: 201 });
}
