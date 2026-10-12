import { randomBytes, randomUUID } from "node:crypto";
import https from "node:https";
import { transaction } from "./db";
import { hash, ApiError, backendErrorMessage } from "./http";
import { passwordHash } from "./auth";
import { getPasswordValidationError } from "@/lib/password-policy";
import type { Repository } from "./db";
import type { Order } from "@/lib/types";
import { money } from "@/lib/catalog";
import type { User, Session } from "@/lib/types";
type Token = {
  id: string;
  userId: string;
  purpose: "verify" | "reset";
  expiresAt: string;
};
type Mail = {
  id: string;
  to: string;
  subject: string;
  text: string;
  status: "pending" | "sent";
  createdAt: string;
};
export async function queueAccountMail(user: User, purpose: Token["purpose"]) {
  const token = randomBytes(32).toString("hex");
  const link = `${process.env.APP_ORIGIN || "http://localhost:3000"}/account/${purpose === "verify" ? "verify-email" : "reset-password"}?token=${token}`;
  await transaction(async (repo) => {
    for (const previous of await repo.find<Token>("tokens", {
      userId: user.id,
      purpose,
    }))
      await repo.remove("tokens", previous.id);
    await repo.put<Token>("tokens", {
      id: hash(token),
      userId: user.id,
      purpose,
      expiresAt: new Date(
        Date.now() + (purpose === "reset" ? 30 : 1440) * 60_000,
      ).toISOString(),
    });
    await repo.put<Mail>("outbox", {
      id: randomUUID(),
      to: user.email,
      subject:
        purpose === "verify"
          ? "Verify your OVIA email"
          : "Reset your OVIA password",
      text: `${purpose === "verify" ? "Verify your email" : "Reset your password"} using this link:\n${link}\n\nIf you did not request this, ignore this message.`,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  });
}
export async function consumeAccountToken(
  token: string,
  purpose: Token["purpose"],
  password?: string,
) {
  if (purpose === "reset") {
    if (!password) throw new ApiError(400, "A new password is required.");
    const message = getPasswordValidationError(password);
    if (message) throw new ApiError(400, message);
  }
  const updatedHash = password ? passwordHash(password) : undefined;
  await transaction(async (repo) => {
    const record = await repo.get<Token>("tokens", hash(token));
    if (
      !record ||
      record.purpose !== purpose ||
      Date.parse(record.expiresAt) < Date.now()
    )
      throw new ApiError(
        400,
        "This link is invalid or expired. Request a new one.",
      );
    const user = await repo.get<User>("users", record.userId);
    if (!user) throw new ApiError(400, "This link is invalid or expired.");
    if (purpose === "reset") {
      if (!updatedHash) throw new ApiError(400, "A new password is required.");
      await repo.put("users", {
        ...user,
        passwordHash: updatedHash,
        passwordChangedAt: new Date().toISOString(),
      });
      await repo.put<Mail>("outbox", {
        id: randomUUID(),
        to: user.email,
        subject: "Your OVIA password was changed",
        text: "Your account password has been changed and previous sessions have been signed out. If this was not you, use the password recovery page on the OVIA website and contact support.",
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      for (const session of await repo.find<Session>("sessions", {
        userId: user.id,
      }))
        await repo.remove("sessions", session.id);
    } else
      await repo.put("users", {
        ...user,
        verifiedAt: new Date().toISOString(),
      });
    await repo.remove("tokens", record.id);
  });
}
export function requireEmailConfiguration() {
  const missing = ["EMAIL_API_KEY", "EMAIL_FROM"].filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length)
    throw new ApiError(
      503,
      `Resend configuration missing: ${missing.join(", ")}.`,
    );
}
function requestWithHttps(
  url: string,
  apiKey: string,
  idempotencyKey: string,
  bodyData: string,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          "Content-Length": Buffer.byteLength(bodyData),
        },
        timeout: 10000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const bodyText = Buffer.concat(chunks).toString("utf8");
          resolve(
            new Response(bodyText, {
              status: res.statusCode || 200,
              statusText: res.statusMessage || "OK",
            }),
          );
        });
      },
    );
    req.on("timeout", () => {
      req.destroy(new Error("The operation was aborted due to timeout"));
    });
    req.on("error", reject);
    req.write(bodyData);
    req.end();
  });
}

export async function sendAccountEmail(mail: {
  id: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: string[];
}) {
  try {
    requireEmailConfiguration();
    const { mailAttachments } = await import("./support-attachments");
    const attachments = mail.attachments?.length
      ? await mailAttachments(mail.attachments)
      : undefined;
    const payload = JSON.stringify({
      from: process.env.EMAIL_FROM!.trim(),
      to: [mail.to.trim().toLowerCase()],
      subject: mail.subject,
      ...(mail.cc?.length ? { cc: mail.cc } : {}),
      ...(mail.bcc?.length ? { bcc: mail.bcc } : {}),
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      ...(attachments ? { attachments } : {}),
      text: mail.text,
      ...(mail.html ? { html: mail.html } : {}),
    });

    let response: Response;
    // In tests where fetch is mocked, use fetch directly
    if (
      process.env.EMAIL_API_KEY === "test-only-provider-key" ||
      process.env.NODE_ENV === "test"
    ) {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": mail.id,
        },
        body: payload,
        signal: AbortSignal.timeout(10000),
      });
    } else {
      // In live runtime (Windows Node.js), use node:https to prevent Undici connect timeouts
      try {
        response = await requestWithHttps(
          "https://api.resend.com/emails",
          process.env.EMAIL_API_KEY!,
          mail.id,
          payload,
        );
      } catch {
        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": mail.id,
          },
          body: payload,
          signal: AbortSignal.timeout(10000),
        });
      }
    }

    if (!response.ok) {
      const raw = await response.text();
      let detail = raw || response.statusText;
      try {
        const error = JSON.parse(raw);
        detail =
          [error.name, error.message]
            .filter((value) => typeof value === "string")
            .join(": ") || detail;
      } catch {
        /* Preserve non-JSON provider errors. */
      }
      throw new ApiError(
        502,
        `Resend (${response.status}): ${backendErrorMessage(detail)}`,
      );
    }
  } catch (error) {
    const message = backendErrorMessage(error);
    console.error("[Resend delivery]", message);
    throw error instanceof ApiError
      ? new ApiError(error.status, message)
      : new ApiError(502, `Resend request failed: ${message}`);
  }
}
export async function deliverMail() {
  requireEmailConfiguration();
  const pending = await transaction((repo) =>
    repo.find<Mail>("outbox", { status: "pending" }),
  );
  let sent = 0;
  for (const mail of pending.slice(0, 25)) {
    try {
      await sendAccountEmail(mail);
    } catch {
      continue;
    }
    await transaction((repo) =>
      repo.put("outbox", { ...mail, text: "[delivered]", status: "sent" }),
    );
    sent++;
  }
  return { sent, pending: pending.length - sent };
}

export async function queueOrderConfirmation(repo: Repository, order: Order) {
  const id = `order-confirmation-${order.id}`;
  if (!(await repo.get<Mail>("outbox", id))) {
    const quote = order.checkoutQuote;
    const text = [
      "OVIA",
      "",
      `Thank you, ${order.address.name}.`,
      `Your order ${order.orderNumber || order.id.slice(0, 8)} has been confirmed.`,
      "",
      ...order.lines.map(
        (line) =>
          `${line.name} · ${line.color} · Qty ${line.quantity} · ${money(line.price * line.quantity)}`,
      ),
      "",
      `Total: ${money(order.total)}`,
      order.provider === "paypal" && quote?.payment
        ? `PayPal sandbox: ${(quote.payment.amount / 100).toFixed(2)} ${quote.payment.currency}`
        : order.provider === "razorpay"
          ? "Paid securely via Razorpay."
          : "",
      "",
      "Delivery",
      order.address.name,
      order.address.line1,
      order.address.line2 || "",
      `${order.address.city}, ${order.address.region} ${order.address.postalCode}`,
      "India",
      quote?.shippingLabel || "Standard Delivery",
      quote?.estimate || "3–7 business days",
      "",
      `View your order: ${process.env.APP_ORIGIN || "http://localhost:3000"}/orders/${order.id}/confirmation`,
      "",
      "With care, OVIA",
    ]
      .filter(Boolean)
      .join("\n");

    await repo.put<Mail>("outbox", {
      id,
      to: order.address.email,
      subject: `OVIA · Order ${order.orderNumber || order.id.slice(0, 8)} confirmed`,
      text,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }

  // Multi-party Notification: Store Owner notification
  const ownerId = `owner-order-confirmation-${order.id}`;
  if (
    (process.env.STORE_OWNER_EMAIL || process.env.ADMIN_EMAIL) &&
    !(await repo.get<Mail>("outbox", ownerId))
  ) {
    const ownerEmail =
      process.env.STORE_OWNER_EMAIL ||
      process.env.ADMIN_EMAIL ||
      "owner@ovias-shop.com";
    const ownerText = [
      "OVIA STORE OWNER NOTIFICATION",
      "=============================",
      `Order Confirmed: ${order.orderNumber || order.id.slice(0, 8)}`,
      `Customer: ${order.address.name} (${order.address.email}, ${order.address.phone || "No phone"})`,
      `Destination: ${order.address.line1}, ${order.address.city}, ${order.address.region} ${order.address.postalCode}`,
      `Total Value: ${money(order.total)}`,
      "",
      "Items ordered:",
      ...order.lines.map(
        (l) =>
          ` - ${l.name} (${l.sku}) x${l.quantity} = ${money(l.price * l.quantity)}`,
      ),
      "",
      `Dispatch & Shipping Management: ${process.env.APP_ORIGIN || "http://localhost:3000"}/admin/shipping?orderId=${order.id}`,
    ]
      .filter(Boolean)
      .join("\n");

    await repo.put<Mail>("outbox", {
      id: ownerId,
      to: ownerEmail,
      subject: `[OVIA NEW ORDER] ${order.orderNumber || order.id.slice(0, 8)} · ${order.address.name}`,
      text: ownerText,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }
}

export async function deliverOrderConfirmation(orderId: string) {
  const ids = [
    `order-confirmation-${orderId}`,
    `owner-order-confirmation-${orderId}`,
  ];
  for (const id of ids) {
    const mail = await transaction((repo) => repo.get<Mail>("outbox", id));
    if (!mail || mail.status === "sent") continue;
    try {
      await sendAccountEmail(mail);
      await transaction((repo) =>
        repo.put("outbox", { ...mail, text: "[delivered]", status: "sent" }),
      );
    } catch {
      /* Durable outbox is retried by mail deliverer */
    }
  }
}

export async function queueShippingNotification(
  repo: Repository,
  order: Order,
  status: string,
  awb?: string,
) {
  const trackingUrl = `${process.env.APP_ORIGIN || "http://localhost:3000"}/account/orders/${order.id}/tracking`;
  const adminUrl = `${process.env.APP_ORIGIN || "http://localhost:3000"}/admin/shipping?orderId=${order.id}`;
  const now = new Date().toISOString();

  // 1. Customer Notification
  const customerId = `shipping-${status.toLowerCase()}-${order.id}`;
  if (!(await repo.get<Mail>("outbox", customerId))) {
    let subject = `OVIA · Order ${order.orderNumber || order.id.slice(0, 8)} status update`;
    let headline = `Your shipment status is now: ${status.replaceAll("_", " ")}`;
    if (status === "PICKED_UP" || status === "IN_TRANSIT") {
      subject = `OVIA · Your order has shipped`;
      headline = `Your order has been dispatched via ${order.shipping?.courier || "Delhivery"}.`;
    } else if (status === "OUT_FOR_DELIVERY") {
      subject = `OVIA · Your order is out for delivery`;
      headline = `Your package is out for delivery today.`;
    } else if (status === "DELIVERED") {
      subject = `OVIA · Your order has been delivered`;
      headline = `Your package has been delivered. We hope you cherish your OVIA piece.`;
    }
    if (status === "CANCELLED")
      headline =
        "Your order cancellation has been confirmed. Refund status: " +
        (order.refunds?.at(-1)?.status || "Not initiated") +
        ".";
    if (status.startsWith("REFUND_"))
      headline =
        "Refund status for your original payment method: " +
        status.slice(7).toLowerCase() +
        ".";
    const text = [
      "OVIA",
      "",
      `Dear ${order.address.name},`,
      "",
      headline,
      awb ? `Tracking / AWB: ${awb}` : "",
      order.shipping?.logistics?.standardizedAddress
        ? `Verified Delivery Address: ${order.shipping.logistics.standardizedAddress}`
        : "",
      "",
      `Track your shipment in real time: ${trackingUrl}`,
      "",
      "With care, OVIA",
    ]
      .filter(Boolean)
      .join("\n");

    await repo.put<Mail>("outbox", {
      id: customerId,
      to: order.address.email,
      subject,
      text,
      status: "pending",
      createdAt: now,
    });
  }

  // 2. Store Owner Notification
  const ownerId = `owner-shipping-${status.toLowerCase()}-${order.id}`;
  if (
    (process.env.STORE_OWNER_EMAIL || process.env.ADMIN_EMAIL) &&
    !(await repo.get<Mail>("outbox", ownerId))
  ) {
    const ownerEmail =
      process.env.STORE_OWNER_EMAIL ||
      process.env.ADMIN_EMAIL ||
      "owner@ovias-shop.com";
    const ownerSubject = `[LOGISTICS ALERT] Order ${order.orderNumber || order.id.slice(0, 8)} · ${status.replaceAll("_", " ")}`;
    const ownerText = [
      "OVIA STORE OWNER LOGISTICS ALERT",
      "================================",
      `Order: ${order.orderNumber || order.id.slice(0, 8)}`,
      `Status Milestone: ${status.replaceAll("_", " ")}`,
      `Courier: ${order.shipping?.courier || "Delhivery Express"}`,
      awb ? `AWB: ${awb}` : "",
      `Customer: ${order.address.name} (${order.address.phone || "No phone"})`,
      `Destination: ${order.shipping?.logistics?.standardizedAddress || `${order.address.line1}, ${order.address.city}`}`,
      order.shipping?.logistics?.route
        ? `Route Distance: ${order.shipping.logistics.route.distanceKm.toFixed(1)} km (approx ${order.shipping.logistics.route.durationMinutes} mins)`
        : "",
      "",
      `Admin Panel: ${adminUrl}`,
      `Customer Tracking: ${trackingUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    await repo.put<Mail>("outbox", {
      id: ownerId,
      to: ownerEmail,
      subject: ownerSubject,
      text: ownerText,
      status: "pending",
      createdAt: now,
    });
  }

  // 3. Delivery Personnel / Rider Dispatch Notification
  if (
    process.env.DELIVERY_PERSONNEL_EMAIL &&
    ["SHIPMENT_CREATED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(status)
  ) {
    const riderId = `rider-dispatch-${status.toLowerCase()}-${order.id}`;
    if (!(await repo.get<Mail>("outbox", riderId))) {
      const riderEmail =
        process.env.DELIVERY_PERSONNEL_EMAIL ||
        "dispatch-riders@ovias-shop.com";
      const riderSubject = `[DISPATCH RUNSHEET] Order ${order.orderNumber || order.id.slice(0, 8)} · ${status.replaceAll("_", " ")}`;
      const riderText = [
        "OVIA RIDER & DISPATCH MANIFEST",
        "===============================",
        `AWB: ${awb || order.shipping?.awb || "Pending"}`,
        `Task: ${status === "OUT_FOR_DELIVERY" ? "Deliver to Customer" : "Pickup & Stage Package"}`,
        `Customer: ${order.address.name}`,
        `Contact Phone: ${order.address.phone || "Contact via app"}`,
        `Drop Address: ${order.shipping?.logistics?.standardizedAddress || `${order.address.line1}, ${order.address.city}, ${order.address.postalCode}`}`,
        order.shipping?.logistics?.coordinates
          ? `GPS: ${order.shipping.logistics.coordinates.lat}, ${order.shipping.logistics.coordinates.lng}`
          : "",
        order.shipping?.logistics?.route
          ? `Optimal Route: ${order.shipping.logistics.route.distanceKm.toFixed(1)} km · ${order.shipping.logistics.route.durationMinutes} min drive`
          : "",
        "",
        "Instructions: Require signature upon delivery. Check tamper-evident seal.",
      ]
        .filter(Boolean)
        .join("\n");

      await repo.put<Mail>("outbox", {
        id: riderId,
        to: riderEmail,
        subject: riderSubject,
        text: riderText,
        status: "pending",
        createdAt: now,
      });
    }
  }
}

export async function deliverShippingNotification(
  orderId: string,
  status: string,
) {
  const ids = [
    `shipping-${status.toLowerCase()}-${orderId}`,
    `owner-shipping-${status.toLowerCase()}-${orderId}`,
    `rider-dispatch-${status.toLowerCase()}-${orderId}`,
  ];

  for (const id of ids) {
    const mail = await transaction((repo) => repo.get<Mail>("outbox", id));
    if (!mail || mail.status === "sent") continue;
    try {
      await sendAccountEmail(mail);
      await transaction((repo) =>
        repo.put("outbox", { ...mail, text: "[delivered]", status: "sent" }),
      );
    } catch {
      /* Outbox fallback */
    }
  }

  // Automatic event-driven notification service hook for Customer Email & Studio Logs
  try {
    const { dispatchNotification } = await import("./notification-service");
    const order = await transaction((repo) =>
      repo.get<Order>("orders", orderId),
    );
    if (order) {
      const normalized = status.toUpperCase();
      if (normalized === "OUT_FOR_DELIVERY") {
        await dispatchNotification(
          "OUT_FOR_DELIVERY",
          {
            orderId: order.id,
            orderNumber: order.orderNumber || order.id.slice(0, 8),
            customerName: order.address.name,
            recipientEmail: order.address.email,
            awb: order.shipping?.awb || "Pending",
            destination: `${order.address.line1}, ${order.address.city}`,
          },
          {
            dedupeKey: `notif_OUT_FOR_DELIVERY_${order.id}`,
          },
        );
      } else if (normalized === "DELIVERED") {
        await dispatchNotification(
          "DELIVERED",
          {
            orderId: order.id,
            orderNumber: order.orderNumber || order.id.slice(0, 8),
            customerName: order.address.name,
            recipientEmail: order.address.email,
            deliveredAt: new Date().toLocaleTimeString("en-IN", {
              hour: "numeric",
              minute: "numeric",
            }),
          },
          {
            dedupeKey: `notif_DELIVERED_${order.id}`,
          },
        );
      } else if (
        ["PICKED_UP", "IN_TRANSIT", "SHIPPED"].includes(
          normalized,
        )
      ) {
        await dispatchNotification(
          "ORDER_SHIPPED",
          {
            orderId: order.id,
            orderNumber: order.orderNumber || order.id.slice(0, 8),
            customerName: order.address.name,
            recipientEmail: order.address.email,
            awb: order.shipping?.awb || "Delhivery Air Express",
            courier: order.shipping?.courier || "Delhivery Air Express",
            estimatedDelivery: "3–4 business days",
          },
          {
            dedupeKey: `notif_ORDER_SHIPPED_${order.id}_${order.shipping?.awb || ""}`,
          },
        );
      }
    }
  } catch (err) {
    console.warn(
      "[mail] Error dispatching event-driven shipping notification:",
      err,
    );
  }
}
