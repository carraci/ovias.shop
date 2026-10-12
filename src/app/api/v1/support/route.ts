import {
  queueContactNotification,
  attemptContactNotification,
} from "@/server/contact-notifications";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { currentUser } from "@/server/auth";
import { transaction } from "@/server/db";

export const runtime = "nodejs";

const requestPayloadSchema = z.object({
  type: z.enum(["ticket", "return"]).optional().default("ticket"),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters long.")
    .max(200, "Subject cannot exceed 200 characters."),
  category: z.string().trim().min(2, "Please select a valid category."),
  orderId: z.string().trim().optional(),
  message: z
    .string()
    .trim()
    .min(10, "Please provide more details (at least 10 characters required).")
    .max(4000, "Message cannot exceed 4000 characters."),
  attachments: z.array(z.string()).optional(),
  customerName: z.string().trim().optional(),
  customerEmail: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .optional()
    .or(z.literal("")),
  // Return / Exchange specific fields
  returnAction: z.string().optional(),
  returnReason: z.string().optional(),
  returnCondition: z.string().optional(),
  returnItemName: z.string().optional(),
});

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: string;
  orderId?: string;
  message: string;
  status: "Open" | "Waiting for reply" | "Resolved";
  attachments: string[];
  returnAction?: string;
  returnReason?: string;
  returnCondition?: string;
  returnItemName?: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  const user = await currentUser();

  if (!user)
    return NextResponse.json(
      { error: "Please sign in to view your support requests." },
      { status: 401 },
    );

  return transaction(async (repo) => {
    let tickets: SupportTicket[] = [];

    if (user) {
      const byUser = await repo.find<SupportTicket>("support_tickets", {
        userId: user.id,
      });
      const byEmail = user.email
        ? await repo.find<SupportTicket>("support_tickets", {
            customerEmail: user.email,
          })
        : [];
      const map = new Map<string, SupportTicket>();
      for (const t of [...byUser, ...byEmail]) {
        map.set(t.id, t);
      }
      tickets = Array.from(map.values());
    }

    return NextResponse.json({
      success: true,
      tickets: tickets.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    });
  });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();

  try {
    const json = await req.json();
    const data = requestPayloadSchema.parse(json);

    // Validate returns specific rules
    if (data.type === "return" || data.category === "Returns & Exchanges") {
      if (!data.orderId) {
        return NextResponse.json(
          {
            error:
              "Please select an order for your return or exchange request.",
          },
          { status: 400 },
        );
      }
      if (
        !data.returnReason ||
        data.returnReason === "Select a reason" ||
        data.returnReason.trim().length < 3
      ) {
        return NextResponse.json(
          { error: "Please select a valid reason for return from the list." },
          { status: 400 },
        );
      }
      if (
        !data.returnCondition ||
        data.returnCondition === "Select condition" ||
        data.returnCondition.trim().length < 3
      ) {
        return NextResponse.json(
          { error: "Please specify the current condition of the item." },
          { status: 400 },
        );
      }
      if (
        data.returnAction === "Wrong / Damaged Item" &&
        (!data.attachments || data.attachments.length === 0)
      ) {
        return NextResponse.json(
          {
            error:
              "Photo evidence is required when reporting damaged or wrong items.",
          },
          { status: 400 },
        );
      }
    }

    const result = await transaction(async (repo) => {
      const now = new Date().toISOString();
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const ticketNumber = `#OV-${randomNum}`;

      const newTicket: SupportTicket = {
        id: randomUUID(),
        ticketNumber,
        userId: user?.id,
        customerName: data.customerName?.trim() || user?.name || "Customer",
        customerEmail:
          data.customerEmail?.trim() || user?.email || "customer@ovia.luxury",
        subject: data.subject.trim(),
        category: data.category,
        orderId: data.orderId?.trim() || undefined,
        message: data.message.trim(),
        status: "Open",
        attachments: data.attachments || [],
        returnAction: data.returnAction,
        returnReason: data.returnReason,
        returnCondition: data.returnCondition,
        returnItemName: data.returnItemName,
        createdAt: now,
        updatedAt: now,
      };

      await repo.put("support_tickets", newTicket);
      const notificationId = await queueContactNotification(repo, {
        id: newTicket.id,
        ticketId: "support_tickets:" + newTicket.id,
        name: newTicket.customerName,
        email: newTicket.customerEmail,
        message: newTicket.message,
        subject: newTicket.subject,
      });

      return {
        notificationId,
        success: true,
        message:
          data.type === "return"
            ? "Your return request has been submitted. Our team will arrange pickup shortly."
            : "Your support request has been submitted successfully.",
        ticket: newTicket,
      };
    });
    const emailNotification = await attemptContactNotification(
      result.notificationId,
    );
    const { notificationId, ...response } = result;
    return NextResponse.json({ ...response, emailNotification });
  } catch (err: any) {
    const firstIssue = err.issues?.[0] || err.errors?.[0];
    const errorMsg =
      firstIssue?.message ||
      err.message ||
      "Invalid values entered. Please check your submission.";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
