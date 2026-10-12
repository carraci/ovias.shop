import { validateAttachmentLinks } from "./support-attachments";
import { hydrateCareTicket } from "./support-conversations";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  supportCategories,
  type CareOrderAction,
  type CareTicket,
} from "@/lib/care";
import type { Order, User } from "@/lib/types";
import type { Repository } from "@/server/db";
import { ApiError } from "@/server/http";

export const careTicketInputSchema = z
  .object({
    category: z.enum(supportCategories),
    subject: z.string().trim().min(3).max(150),
    message: z.string().trim().min(10).max(3000),
    orderId: z.union([z.uuid(), z.literal("")]).optional(),
    idempotencyKey: z.uuid(),
    attachments: z.array(z.uuid()).max(5).optional(),
    orderAction: z
      .object({
        type: z.enum(["cancellation", "return", "refund"]),
        items: z
          .array(
            z
              .object({
                sku: z.string().trim().min(1).max(150),
                quantity: z.number().int().positive(),
              })
              .strict(),
          )
          .min(1)
          .max(100)
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const actionCategories = {
  cancellation: "Order issue",
  return: "Return",
  refund: "Refund",
} as const;
const activeStatuses = new Set(["Open", "In Review", "Waiting for Customer"]);

function normalizeAction(action: CareOrderAction): CareOrderAction {
  return action.type === "cancellation"
    ? { type: action.type }
    : {
        type: action.type,
        items: [...(action.items || [])].sort((a, b) =>
          a.sku.localeCompare(b.sku),
        ),
      };
}

function sameAction(left?: CareOrderAction, right?: CareOrderAction) {
  return (
    !!left &&
    !!right &&
    JSON.stringify(normalizeAction(left)) ===
      JSON.stringify(normalizeAction(right))
  );
}

function validateActionShape(input: z.infer<typeof careTicketInputSchema>) {
  const action = input.orderAction;
  if (!action) return;
  if (!input.orderId)
    throw new ApiError(400, "Choose an order for this request.");
  if (input.category !== actionCategories[action.type])
    throw new ApiError(
      400,
      "The request category does not match the order action.",
    );
  if (action.type === "cancellation" && action.items !== undefined)
    throw new ApiError(400, "Cancellation requests apply to the entire order.");
  if (action.type !== "cancellation" && !action.items?.length)
    throw new ApiError(400, "Choose at least one product for this request.");
  if (
    action.items &&
    new Set(action.items.map((item) => item.sku)).size !== action.items.length
  )
    throw new ApiError(400, "Choose each product only once.");
}

function validateEligibility(order: Order, action: CareOrderAction) {
  if (
    order.provider === "demo" ||
    ["demo", "cancelled", "expired", "payment_failed"].includes(order.status)
  )
    throw new ApiError(
      409,
      "This order is not eligible for this request. Contact OVIA support if you need help.",
    );
  if (action.type === "cancellation") {
    if (
      !["pending", "payment_pending", "paid"].includes(order.status) ||
      order.shipping?.shippedAt ||
      (order.shipping &&
        !["ORDER_CONFIRMED", "PACKED", "SHIPMENT_CREATED"].includes(
          order.shipping.status,
        ))
    )
      throw new ApiError(
        409,
        "This order has already been dispatched or needs payment review. Please request a return or contact OVIA support.",
      );
  } else {
    if (!["paid", "refund_required"].includes(order.status))
      throw new ApiError(
        409,
        "A verified payment is required before requesting a return or refund.",
      );
    for (const item of action.items || []) {
      const line = order.lines.find((value) => value.sku === item.sku);
      if (!line || item.quantity > line.quantity)
        throw new ApiError(
          400,
          "Choose products and quantities from this order only.",
        );
    }
  }
}

/** Called inside the existing transaction; records a review request, never a refund or shipment mutation. */
export async function createCareTicket(
  repo: Repository,
  user: Pick<User, "id" | "name" | "email">,
  raw: unknown,
  now = new Date().toISOString(),
): Promise<CareTicket> {
  const input = careTicketInputSchema.parse(raw);
  validateActionShape(input);
  const action = input.orderAction
    ? normalizeAction(input.orderAction)
    : undefined;
  const existing = await repo.get<CareTicket>("tickets", input.idempotencyKey);
  if (existing) {
    if (
      existing.userId !== user.id ||
      (action &&
        (existing.orderId !== input.orderId ||
          !sameAction(existing.orderAction, action)))
    )
      throw new ApiError(409, "Request conflict.");
    return hydrateCareTicket(repo, existing) as Promise<CareTicket>;
  }

  let order: Order | undefined;
  if (input.orderId) {
    order = await repo.get<Order>("orders", input.orderId);
    if (!order || order.userId !== user.id)
      throw new ApiError(404, "Order not found.");
  }
  if (action && order) {
    const active = (
      await repo.find<CareTicket>("tickets", {
        userId: user.id,
        orderId: order.id,
      })
    ).filter(
      (ticket) => ticket.orderAction && activeStatuses.has(ticket.status),
    );
    if (active.some((ticket) => !sameAction(ticket.orderAction, action)))
      throw new ApiError(
        409,
        "An order request is already under review. Open that request to update OVIA support.",
      );
    if (active[0])
      return hydrateCareTicket(repo, active[0]) as Promise<CareTicket>;
    validateEligibility(order, action);
    // Concurrent MongoDB transactions write the same existing order document,
    // so a conflict retries the active-request check before another ticket can be saved.
    await repo.put("orders", { ...order, careRequestRevision: randomUUID() });
  }
  const ticket: CareTicket = {
    id: input.idempotencyKey,
    userId: user.id,
    name: user.name,
    email: user.email,
    category: input.category,
    subject: input.subject,
    orderId: input.orderId || undefined,
    ...(action ? { orderAction: action } : {}),
    status: "Open",
    messages: [
      {
        id: randomUUID(),
        author: "customer",
        text: input.message,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  await validateAttachmentLinks(
    repo,
    input.attachments || [],
    "tickets:" + ticket.id,
    user.id,
  );
  ticket.messages[0].attachments = input.attachments || [];
  await repo.put("tickets", ticket);
  await repo.put("support_conversations", {
    id: "tickets:" + ticket.id,
    status: "New",
    priority: "Normal",
  });

  if (action?.type === "return") {
    try {
      const { dispatchNotification } = await import("./notification-service");
      dispatchNotification(
        "RETURN_RECEIVED",
        {
          returnId: ticket.id.slice(0, 8).toUpperCase(),
          orderNumber:
            order?.orderNumber ||
            (input.orderId ? input.orderId.slice(0, 8) : "N/A"),
          customerName: user.name,
          recipientEmail: user.email,
          item:
            action.items?.map((i) => `${i.quantity}x (${i.sku})`).join(", ") ||
            "Luggage piece",
          reason: input.message.slice(0, 100),
        },
        {
          dedupeKey: `notif_RETURN_RECEIVED_${ticket.id}`,
        },
      ).catch((err) =>
        console.warn("[care] Return received notification error:", err),
      );
    } catch (err) {
      console.warn(
        "[care] Error dispatching return received notification:",
        err,
      );
    }
  }

  return hydrateCareTicket(repo, ticket) as Promise<CareTicket>;
}
