import { createHash } from "node:crypto";
import type { AccountActivity } from "@/lib/account-activity";
import type { Order, Session, User } from "@/lib/types";
import type { CareTicket } from "@/lib/care";
import type { Repository } from "./db";
import type { ConversationMessage } from "./support-conversations";

export async function recordAccountActivity(repo: Repository, collection: string, value: { id: string }, previous?: { id: string }) {
  const add = async (userId: string | undefined, key: string, category: AccountActivity["category"], title: string, description: string, href: string, at: string) => {
    if (!userId || !Number.isFinite(Date.parse(at))) return;
    const id = createHash("sha256").update(`${userId}:${collection}:${value.id}:${key}`).digest("hex");
    if (await repo.get<AccountActivity>("account_notifications", id)) return;
    await repo.put<AccountActivity>("account_notifications", { id, userId, category, title, description, href, createdAt: at });
  };
  if (collection === "orders") {
    const order = value as Order, old = previous as Order | undefined;
    if (order.provider === "demo" || order.status === "demo") return;
    const number = order.orderNumber || order.id, href = `/account/orders/${order.id}`;
    if (!old) await add(order.userId, "placed", "Orders", "Order placed", `Order #${number} was placed.`, href, order.createdAt);
    if (order.paidAt && order.captureId && !old?.paidAt) await add(order.userId, "paid", "Orders", "Payment confirmed", `Payment for order #${number} was confirmed.`, href + "?section=payment", order.paidAt);
    if (old && order.status === "cancelled" && old.status !== "cancelled") await add(order.userId, "cancelled", "Orders", "Order cancelled", `Order #${number} was cancelled.`, href, new Date().toISOString());
    if (old && order.fulfillmentStatus !== old.fulfillmentStatus && order.fulfillmentStatus && ["PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.fulfillmentStatus) && !order.shipping?.events?.some(event => event.isSimulated || event.status === order.fulfillmentStatus)) {
      await add(order.userId, `fulfillment:${order.fulfillmentStatus}`, "Orders", `Order ${order.fulfillmentStatus.replaceAll("_", " ").toLowerCase()}`, `Order #${number} has a new fulfillment update.`, href, new Date().toISOString());
    }
    for (const event of order.shipping?.events || []) {
      if (event.isSimulated || !order.shipping?.verified || order.shipping.environment !== "production" || order.shipping.provider === "simulator" || old?.shipping?.events?.some((item) => item.timestamp === event.timestamp && item.status === event.status)) continue;
      await add(order.userId, `shipping:${event.timestamp}:${event.status}`, "Orders", `Delivery update: ${event.status.replaceAll("_", " ").toLowerCase()}`, `Delivery status updated for order #${number}.`, href + "/tracking", event.timestamp);
    }
    for (const refund of order.refunds || []) {
      if (old?.refunds?.some((item) => item.id === refund.id && item.status === refund.status)) continue;
      const amount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(refund.amount / 100);
      await add(order.userId, `refund:${refund.id}:${refund.status}`, "Returns & refunds", refund.status === "Refunded" ? "Refund processed" : refund.status === "Failed" ? "Refund failed" : "Refund in progress", `${amount} · Order #${number}. ${refund.status === "Refunded" ? "Payment provider processing confirmed." : "View the recorded refund status."}`, href + `?section=payment#refund-${encodeURIComponent(refund.id)}`, refund.updatedAt);
    }
  } else if (collection === "tickets") {
    const ticket = value as CareTicket, old = previous as CareTicket | undefined;
    const kind = ticket.orderAction?.type === "cancellation" ? "Cancellation" : ticket.category === "Return" ? (ticket.subject.startsWith("Exchange consent") ? "Exchange" : "Return") : ticket.category === "Refund" ? "Refund" : "Support";
    const category = kind === "Support" ? "Support" : kind === "Cancellation" ? "Orders" : "Returns & refunds";
    const href = `/account/support?request=${encodeURIComponent("tickets:" + ticket.id)}`;
    if (!old) await add(ticket.userId, "created", category, `${kind} request created`, `Request ${ticket.ticketNumber || ticket.id} has been saved for review.`, href, ticket.createdAt);
    if (old && ticket.status !== old.status) await add(ticket.userId, `status:${ticket.status}:${ticket.updatedAt}`, category, `${kind} request updated`, `Request ${ticket.ticketNumber || ticket.id}: ${ticket.status}.`, href, ticket.updatedAt);
    for (const message of ticket.messages || []) {
      if (old?.messages?.some((item) => item.id === message.id) || message.author !== "support") continue;
      await add(ticket.userId, `reply:${message.id}`, "Support", "New support reply", `OVIA Support replied to request ${ticket.ticketNumber || ticket.id}.`, href, message.createdAt);
    }
  } else if (collection === "support_messages" && !previous) {
    const message = value as ConversationMessage;
    const [parent, ...parts] = message.ticketId.split(":");
    if (!["tickets", "support_tickets", "contact"].includes(parent)) return;
    const ticket = await repo.get<{id: string; userId?: string}>(parent, parts.join(":"));
    await add(ticket?.userId, "message", "Support", message.sender === "support" ? "New support reply" : "Support reply sent", message.sender === "support" ? "OVIA Support replied to your request." : "Your reply was saved to the conversation.", `/account/support?request=${encodeURIComponent(message.ticketId)}`, message.time);
  } else if (collection === "sessions" && !previous) {
    const session = value as Session;
    await add(session.userId, "sign-in", "Security", "New account sign-in", "A new sign-in was recorded on your account.", `/account/security#session-${encodeURIComponent(session.id)}`, session.createdAt || "");
  } else if (collection === "users" && previous) {
    const user = value as User, old = previous as User;
    if (user.passwordHash !== old.passwordHash) await add(user.id, `password:${user.passwordHash}`, "Security", "Password changed", "Your account password was changed.", "/account/security", new Date().toISOString());
    if (user.email !== old.email) await add(user.id, `email:${user.email}`, "Security", "Email changed", "Your sign-in email address was changed.", "/account/security", new Date().toISOString());
  }
}
