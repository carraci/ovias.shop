import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/server/admin-auth";
import { getAdminCustomerById } from "@/server/admin-service";
import { transaction } from "@/server/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  const { id } = await ctx.params;
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const customer = await getAdminCustomerById(id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  const saved = await transaction(async (repo) => {
    let user = await repo.get<any>("users", customer.id);
    if (!user) {
      const allUsers = await repo.find<any>("users");
      user = allUsers.find(
        (u) => u.email?.toLowerCase() === customer.email.toLowerCase()
      );
    }
    if (!user) return false;

    const updatedUser = { ...user };

    // Update note
    if (typeof body.note === "string") {
      const note = body.note.trim();
      if (note.length > 2000) {
        throw new Error("Enter a note of up to 2,000 characters.");
      }
      const notes = Array.isArray(user.adminNotes) ? user.adminNotes : [];
      updatedUser.adminNotes = [
        ...notes,
        {
          id: randomUUID(),
          author: auth.user!.email,
          note,
          date: new Date().toISOString(),
        },
      ];
    }

    // Direct profile updates (Name, Phone, EmailMarketing, Avatar, Status)
    if (typeof body.name === "string" && body.name.trim()) {
      updatedUser.name = body.name.trim();
    }
    if (typeof body.phone === "string") {
      updatedUser.phone = body.phone.trim();
    }
    if (typeof body.emailMarketing === "string") {
      updatedUser.emailMarketing = body.emailMarketing;
    }
    if (typeof body.avatar === "string") {
      updatedUser.avatar = body.avatar.trim();
    }
    if (typeof body.status === "string") {
      updatedUser.status = body.status;
    }

    // Addresses management
    if (Array.isArray(body.addresses)) {
      updatedUser.addresses = body.addresses;
    } else if (body.newAddress && typeof body.newAddress === "object") {
      const existing = Array.isArray(updatedUser.addresses) ? updatedUser.addresses : [];
      const newAddr = {
        id: body.newAddress.id || `addr_${randomUUID().slice(0, 8)}`,
        name: body.newAddress.name || updatedUser.name || "Customer",
        type: body.newAddress.type || "Shipping",
        address: body.newAddress.address || "",
      };
      updatedUser.addresses = [...existing, newAddr];
    } else if (body.deleteAddressId) {
      const existing = Array.isArray(updatedUser.addresses) ? updatedUser.addresses : [];
      updatedUser.addresses = existing.filter((a: any) => a.id !== body.deleteAddressId);
    }

    await repo.put("users", updatedUser);
    return true;
  });

  if (!saved) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  const updatedCustomer = await getAdminCustomerById(id);
  return NextResponse.json({ success: true, customer: updatedCustomer });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) return auth.response;
  const { id } = await ctx.params;

  const customer = await getAdminCustomerById(id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  const deleted = await transaction(async (repo) => {
    let user = await repo.get<any>("users", customer.id);
    if (!user) {
      const allUsers = await repo.find<any>("users");
      user = allUsers.find(
        (u) => u.email?.toLowerCase() === customer.email.toLowerCase()
      );
    }
    if (!user) return false;

    // Soft delete or remove
    await repo.put("users", {
      ...user,
      deleted: true,
      status: "Archived",
      deletedAt: new Date().toISOString(),
    });
    return true;
  });

  return NextResponse.json({ success: deleted });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminApi(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { id } = await ctx.params;
  const customer = await getAdminCustomerById(id);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      avatar: customer.avatar,
      ordersCount: customer.ordersCount,
      totalSpent: customer.totalSpent,
      clv: customer.clv,
      joined: customer.joined,
      registered: customer.registered,
      emailMarketing: customer.emailMarketing,
      averageOrderValue: customer.averageOrderValue,
      lastOrder: customer.lastOrder,
      latestNote: customer.latestNote,
      status: customer.status,
      addresses: customer.addresses,
      wishlist: customer.wishlist,
      orders: customer.orders,
      supportHistory: customer.supportHistory,
      notes: customer.notes,
    },
  });
}
