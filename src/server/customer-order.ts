import { currentUser } from "./auth";
import { readRepository } from "./db";
import { ApiError } from "./http";
import type { Order } from "@/lib/types";
export async function customerOrder(id: string) {
  const user = await currentUser();
  if (!user) throw new ApiError(401, "Sign in to view your order.");
  const order = await readRepository((repo) => repo.get<Order>("orders", id));
  if (
    !order ||
    !(
      order.owner === user.id ||
      order.userId === user.id ||
      order.address.email?.toLowerCase() === user.email.toLowerCase()
    )
  )
    throw new ApiError(404, "Order not found.");
  return { order, user };
}
