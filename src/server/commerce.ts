import { randomUUID } from "node:crypto";
import { z } from "zod";
import { catalog, transaction, type Repository } from "./db";
import { ApiError } from "./http";
import type { Cart, Order, Address, OrderLine } from "@/lib/types";
import type { Product } from "@/lib/catalog";
export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  line1: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  postalCode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid six-digit Indian postal code."),
  country: z.literal("IN"),
});
export function quote(lines: Cart["lines"], products: Product[]) {
  return lines.map((line) => {
    const product = products.find((p) =>
      p.variants.some((v) => v.sku === line.sku),
    );
    const v = product?.variants.find((v) => v.sku === line.sku);
    if (!product || !v)
      throw new ApiError(409, "An item is no longer available.");
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 10 ||
      line.quantity > v.stock
    )
      throw new ApiError(409, "Requested quantity is unavailable.");
    return {
      sku: v.sku,
      name: product.name,
      color: v.color,
      price: v.price,
      quantity: line.quantity,
      image: product.image,
      slug: product.slug,
    };
  });
}
export const total = (lines: OrderLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
export async function readCart(owner: string) {
  const products = await catalog();
  return transaction(async (repo) => {
    const cart = (await repo.get<Cart>("carts", owner)) || {
      id: owner,
      lines: [],
      version: 0,
    };
    const lines = quote(cart.lines, products);
    return { ...cart, lines, total: total(lines) };
  });
}
export async function changeCart(
  owner: string,
  sku: string,
  quantity: number,
  mode: "add" | "set",
  version?: number,
) {
  const products = await catalog();
  return transaction(async (repo) => {
    const cart = (await repo.get<Cart>("carts", owner)) || {
      id: owner,
      lines: [],
      version: 0,
    };
    if (version !== undefined && version !== cart.version)
      throw new ApiError(409, "Your bag changed. Refresh and try again.");
    const existing = cart.lines.find((l) => l.sku === sku);
    const next =
      mode === "add" ? (existing?.quantity || 0) + quantity : quantity;
    const lines = cart.lines.filter((l) => l.sku !== sku);
    if (next > 0) lines.push({ sku, quantity: next });
    const quoted = quote(lines, products);
    await repo.put("carts", { ...cart, lines, version: cart.version + 1 });
    return {
      id: owner,
      lines: quoted,
      version: cart.version + 1,
      total: total(quoted),
    };
  });
}
type Inventory = { id: string; available: number };
async function inventory(repo: Repository, sku: string, products: Product[]) {
  return (
    (await repo.get<Inventory>("inventory", sku)) || {
      id: sku,
      available:
        products.flatMap((p) => p.variants).find((v) => v.sku === sku)?.stock ||
        0,
    }
  );
}
export async function createOrder(
  owner: string,
  userId: string | undefined,
  address: Address,
  key: string,
  provider: Order["provider"],
) {
  const products = await catalog();
  return transaction(async (repo) => {
    const prior = (
      await repo.find<Order>("orders", { owner, idempotencyKey: key })
    )[0];
    if (prior) return prior;
    const cart = await repo.get<Cart>("carts", owner);
    if (!cart?.lines.length) throw new ApiError(400, "Your bag is empty.");
    const lines = quote(cart.lines, products);
    if (provider !== "demo")
      for (const line of lines) {
        const stock = await inventory(repo, line.sku, products);
        if (stock.available < line.quantity)
          throw new ApiError(
            409,
            "An item has just sold out. Update your bag.",
          );
        await repo.put("inventory", {
          ...stock,
          available: stock.available - line.quantity,
        });
      }
    const order: Order = {
      id: randomUUID(),
      owner,
      userId,
      address,
      idempotencyKey: key,
      lines,
      total: total(lines),
      provider,
      status: provider === "demo" ? "demo" : "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 35 * 60_000).toISOString(),
    };
    await repo.put("orders", order);
    if (provider === "demo")
      await repo.put("carts", {
        ...cart,
        lines: [],
        version: cart.version + 1,
      });
    return order;
  });
}
export async function attachProvider(id: string, providerId: string) {
  return transaction(async (repo) => {
    const order = await repo.get<Order>("orders", id);
    if (!order) throw new ApiError(404, "Order not found.");
    await repo.put("orders", { ...order, providerId });
  });
}
export async function finalizePayment(
  id: string,
  providerId: string,
  amount: number,
  eventId: string,
) {
  return transaction(async (repo) => {
    if (await repo.get("events", eventId)) return;
    const order = await repo.get<Order>("orders", id);
    if (
      !order ||
      order.provider === "demo" ||
      order.total !== amount ||
      order.providerId !== providerId
    )
      throw new ApiError(409, "Payment details do not match.");
    if (order.status !== "paid") {
      await repo.put("orders", {
        ...order,
        status: order.status === "expired" ? "refund_required" : "paid",
      });
      if (order.status === "pending") {
        const cart = await repo.get<Cart>("carts", order.owner);
        if (cart) {
          const remaining = cart.lines
            .map((l) => ({
              ...l,
              quantity: Math.max(
                0,
                l.quantity -
                  (order.lines.find((o) => o.sku === l.sku)?.quantity || 0),
              ),
            }))
            .filter((l) => l.quantity > 0);
          await repo.put("carts", {
            ...cart,
            lines: remaining,
            version: cart.version + 1,
          });
        }
      }
    }
    await repo.put("events", { id: eventId, at: new Date().toISOString() });
  });
}
export async function expireOrders() {
  return transaction(async (repo) => {
    let count = 0;
    for (const order of await repo.find<Order>("orders", {
      status: "pending",
    })) {
      if (Date.parse(order.expiresAt) > Date.now()) continue;
      for (const line of order.lines) {
        const stock = await repo.get<Inventory>("inventory", line.sku);
        if (stock)
          await repo.put("inventory", {
            ...stock,
            available: stock.available + line.quantity,
          });
      }
      await repo.put("orders", { ...order, status: "expired" });
      count++;
    }
    return { expired: count };
  });
}
