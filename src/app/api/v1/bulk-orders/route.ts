import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { transaction } from "@/server/db";

export const runtime = "nodejs";

const bulkOrderSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters.")
    .max(60, "First name cannot exceed 60 characters.")
    .regex(/^[a-zA-Z\s.'-]+$/, "First name can only contain letters and spaces."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(60, "Last name cannot exceed 60 characters.")
    .regex(/^[a-zA-Z\s.'-]+$/, "Last name can only contain letters and spaces."),
  email: z
    .string()
    .trim()
    .email("Please provide a valid business or personal email address.")
    .max(120, "Email is too long."),
  countryCode: z.string().trim().default("+91"),
  contactNumber: z
    .string()
    .trim()
    .regex(/^\d{10,12}$/, "Please enter a valid 10-digit phone number."),
  altCountryCode: z.string().trim().optional(),
  alternateNumber: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^\d{10,12}$/.test(val), {
      message: "Alternate phone number must be a valid 10-digit number.",
    }),
  companyName: z
    .string()
    .trim()
    .max(120, "Company name cannot exceed 120 characters.")
    .optional(),
  deliveryLocation: z
    .string()
    .trim()
    .min(2, "Please select your delivery state or union territory."),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits."),
  product: z
    .string()
    .trim()
    .min(2, "Please specify the OVIA product you are interested in."),
  quantity: z
    .string()
    .trim()
    .min(1, "Please select the desired quantity."),
  additionalDetails: z
    .string()
    .trim()
    .max(2000, "Additional details cannot exceed 2000 characters.")
    .optional(),
});

export interface BulkOrderRecord {
  id: string;
  orderId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  countryCode: string;
  contactNumber: string;
  alternateNumber?: string;
  companyName: string;
  deliveryLocation: string;
  pincode: string;
  product: string;
  quantity: string;
  additionalDetails: string;
  status: "Received" | "Under Review" | "Quoted" | "Fulfilled";
  brand: "OVIA";
  fromEmail: "no-reply@ovias.shop";
  createdAt: string;
  updatedAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validated = bulkOrderSchema.safeParse(rawBody);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors)[0]?.[0] || "Invalid submission data.";
      return NextResponse.json(
        {
          success: false,
          error: firstErrorMessage,
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validated.data;
    const numericPart = Math.floor(10000 + Math.random() * 90000);
    const orderId = `OV-BLK-${numericPart}`;
    const id = randomUUID();
    const now = new Date().toISOString();

    const record: BulkOrderRecord = {
      id,
      orderId,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email.toLowerCase(),
      countryCode: data.countryCode,
      contactNumber: `${data.countryCode} ${data.contactNumber}`,
      alternateNumber: data.alternateNumber
        ? `${data.altCountryCode || "+91"} ${data.alternateNumber}`
        : undefined,
      companyName: data.companyName || "Individual / Private Client",
      deliveryLocation: data.deliveryLocation,
      pincode: data.pincode,
      product: data.product,
      quantity: data.quantity,
      additionalDetails: data.additionalDetails || "",
      status: "Received",
      brand: "OVIA",
      fromEmail: "no-reply@ovias.shop",
      createdAt: now,
      updatedAt: now,
    };

    // Save into repository
    await transaction(async (repo) => {
      await repo.put("bulk_orders", record);

      // Queue an outbox confirmation mail notification from no-reply@ovias.shop
      await repo.put("outbox", {
        id: randomUUID(),
        type: "BULK_ORDER_CONFIRMATION",
        from: "OVIA Corporate Concierge <no-reply@ovias.shop>",
        to: record.email,
        subject: `Thanks for ordering with us! OVIA Bulk Order Confirmation [${orderId}]`,
        text: `Dear ${record.fullName},\n\nThank you for ordering with us!\n\nWe have received your bulk order request for ${record.quantity} of "${record.product}".\n\nOrder Reference: ${orderId}\nDelivery State: ${record.deliveryLocation} (${record.pincode})\n\nOur concierge team will review your requirements and reach out to you within 24 hours.\n\nWarm regards,\nOVIA Luxury Travel Goods\nno-reply@ovias.shop`,
        status: "QUEUED",
        createdAt: now,
      });
    });

    return NextResponse.json({
      success: true,
      message: "Thanks for ordering with us!",
      orderId,
      data: {
        orderId,
        fullName: record.fullName,
        email: record.email,
        contactNumber: record.contactNumber,
        companyName: record.companyName,
        deliveryLocation: record.deliveryLocation,
        pincode: record.pincode,
        product: record.product,
        quantity: record.quantity,
        officialEmail: "no-reply@ovias.shop",
        submittedAt: now,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process bulk order.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    const orders = await transaction(async (repo) => {
      if (orderId) {
        return await repo.find<BulkOrderRecord>("bulk_orders", { orderId });
      }
      return await repo.find<BulkOrderRecord>("bulk_orders", {});
    });

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch bulk orders.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
