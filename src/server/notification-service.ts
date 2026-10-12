import { randomUUID } from "node:crypto";
import { mongo, isDemo, transaction } from "./db";
import { sendAccountEmail } from "./mail";
import { money } from "@/lib/catalog";

export type NotificationEventType =
  | "ORDER_CONFIRMATION"
  | "PAYMENT_RECEIVED"
  | "ORDER_SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RETURN_RECEIVED"
  | "RETURN_APPROVED"
  | "REFUND_COMPLETED"
  | "OTP_AUTHORIZATION";

export interface NotificationLog {
  id: string;
  eventType: NotificationEventType;
  templateName: string;
  recipient: string;
  subject: string;
  channel: string;
  status: "Delivered" | "Failed" | "Skipped (Duplicate)";
  entityId?: string;
  error?: string;
  createdAt: string;
  isTest?: boolean;
}

export interface NotificationTemplateDefinition {
  id: NotificationEventType;
  name: string;
  channel: string;
  defaultSubject: string;
  description: string;
  sampleData: Record<string, unknown>;
  render: (data: any) => { subject: string; text: string; html: string };
}

function renderEmailLayout(params: {
  title: string;
  subtitle?: string;
  greeting: string;
  bodyParagraphs: string[];
  highlightBox?: { label?: string; content: string | { label: string; value: string }[] };
  actionButton?: { text: string; url: string };
  footerNote?: string;
}) {
  const highlightHtml = params.highlightBox
    ? typeof params.highlightBox.content === "string"
      ? `<div style="background-color: #F8F7F4; border: 1px solid #E6E4DF; border-radius: 6px; padding: 20px; margin: 24px 0; text-align: center;">
           ${params.highlightBox.label ? `<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8E693E; margin-bottom: 6px; font-weight: 600;">${params.highlightBox.label}</div>` : ""}
           <div style="font-size: 24px; font-weight: 700; letter-spacing: 0.2em; color: #111111; font-family: monospace;">${params.highlightBox.content}</div>
         </div>`
      : `<div style="background-color: #F8F7F4; border: 1px solid #E6E4DF; border-radius: 6px; padding: 18px 20px; margin: 24px 0;">
           ${params.highlightBox.label ? `<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8E693E; margin-bottom: 12px; font-weight: 600;">${params.highlightBox.label}</div>` : ""}
           <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
             ${params.highlightBox.content
               .map(
                 (row) => `
               <tr>
                 <td style="padding: 6px 0; color: #6B7280; font-weight: 500; width: 40%; vertical-align: top;">${row.label}:</td>
                 <td style="padding: 6px 0; color: #111827; font-weight: 600; text-align: right; vertical-align: top;">${row.value}</td>
               </tr>`,
               )
               .join("")}
           </table>
         </div>`
    : "";

  const actionHtml = params.actionButton
    ? `<div style="text-align: center; margin: 30px 0;">
         <a href="${params.actionButton.url}" style="background-color: #111111; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block;">
           ${params.actionButton.text}
         </a>
       </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F4F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F4F2; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          
          <!-- Header / Brand -->
          <tr>
            <td style="padding: 36px 30px 24px; text-align: center; border-bottom: 1px solid #F0EFEA;">
              <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 400; letter-spacing: 0.12em; color: #111111; margin-bottom: 6px;">OVIA</div>
              <div style="font-size: 9px; letter-spacing: 0.25em; color: #8E693E; text-transform: uppercase; font-weight: 600;">
                LUXURY TRAVEL ESSENTIALS
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <div style="font-size: 17px; font-weight: 600; color: #111111; margin-bottom: 16px;">
                ${params.greeting}
              </div>

              ${params.bodyParagraphs
                .map(
                  (p) => `
                <p style="font-size: 14px; line-height: 1.65; color: #374151; margin: 0 0 16px;">
                  ${p}
                </p>`,
                )
                .join("")}

              ${highlightHtml}
              ${actionHtml}

              <p style="font-size: 12px; line-height: 1.6; color: #6B7280; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid #F3F3F0;">
                ${params.footerNote || "Should you require tailored luggage monogramming, private concierge assistance, or itinerary adjustments, simply reply directly to this notice."}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAFAF8; padding: 24px 30px; text-align: center; border-top: 1px solid #EFEFEA; font-size: 11px; color: #9CA3AF; line-height: 1.6;">
              <div style="margin-bottom: 6px;">&copy; ${new Date().getFullYear()} OVIA Atelier · All Rights Reserved</div>
              <div>Engineered for effortless overhead carry and lifelong global voyages.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export const NOTIFICATION_TEMPLATES: Record<NotificationEventType, NotificationTemplateDefinition> = {
  ORDER_CONFIRMATION: {
    id: "ORDER_CONFIRMATION",
    name: "Order Confirmation",
    channel: "Email (Resend)",
    defaultSubject: "Your OVIA Voyage Order is Confirmed #{orderNumber}",
    description: "Sent automatically when a customer completes order placement.",
    sampleData: {
      orderNumber: "OV123456789",
      customerName: "Rahul Mehta",
      itemsSummary: "1x OVIA Pro Cabin (Black Obsidian)",
      courier: "Delhivery Air Express",
      totalFormatted: "₹24,980",
      orderUrl: "http://localhost:3000/orders/sample/confirmation",
    },
    render: (data) => {
      const orderNumber = data.orderNumber || "OV123456789";
      const customerName = data.customerName || "Valued Voyager";
      const itemsSummary = data.itemsSummary || "1x OVIA Luxury Cabin (Obsidian Black)";
      const courier = data.courier || "Delhivery Air Express";
      const totalFormatted = data.totalFormatted || "₹24,980";
      const orderUrl = data.orderUrl || `${process.env.APP_ORIGIN || "http://localhost:3000"}/orders/${data.orderId || "sample"}/confirmation`;

      const subject = `Your OVIA Voyage Order is Confirmed #${orderNumber}`;
      const text = [
        "OVIA · LUXURY TRAVEL ESSENTIALS",
        "",
        `Dear ${customerName},`,
        `Thank you for selecting OVIA for your upcoming travels. We take immense pleasure in confirming order #${orderNumber}.`,
        "",
        `Items: ${itemsSummary}`,
        `Fulfillment Partner: ${courier}`,
        `Total: ${totalFormatted} (Complimentary Insured Shipping)`,
        "",
        `View your order: ${orderUrl}`,
        "",
        "With care, OVIA Concierge",
      ].join("\n");

      const html = renderEmailLayout({
        title: subject,
        greeting: `Dear ${customerName},`,
        bodyParagraphs: [
          `Thank you for selecting OVIA for your upcoming travels. We take immense pleasure in confirming order <strong>#${orderNumber}</strong>.`,
          "Our craftsmen have reserved your luggage piece. It is currently being inspected and prepared for precision protective packaging.",
        ],
        highlightBox: {
          label: "Order Summary",
          content: [
            { label: "Order Number", value: `#${orderNumber}` },
            { label: "Selected Pieces", value: itemsSummary },
            { label: "Fulfillment Courier", value: courier },
            { label: "Total Paid", value: totalFormatted },
          ],
        },
        actionButton: {
          text: "View Order Confirmation",
          url: orderUrl,
        },
      });

      return { subject, text, html };
    },
  },

  PAYMENT_RECEIVED: {
    id: "PAYMENT_RECEIVED",
    name: "Payment Received",
    channel: "Email & SMS",
    defaultSubject: "Payment Receipt for OVIA Order #{orderNumber}",
    description: "Sent automatically when Razorpay webhook confirms successful capture.",
    sampleData: {
      orderNumber: "OV123456789",
      customerName: "Rahul Mehta",
      paymentId: "pay_Rzp9041OviaSecure",
      amountFormatted: "₹24,980",
      method: "Razorpay (UPI / NetBanking / Cards)",
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    },
    render: (data) => {
      const orderNumber = data.orderNumber || "OV123456789";
      const customerName = data.customerName || "Valued Voyager";
      const paymentId = data.paymentId || "pay_razorpay_verified";
      const amountFormatted = data.amountFormatted || "₹24,980";
      const method = data.method || "Razorpay Secure Gateway";
      const date = data.date || new Date().toISOString().slice(0, 10);

      const subject = `Payment Receipt for OVIA Order #${orderNumber}`;
      const text = [
        "OVIA · PAYMENT RECEIPT",
        "",
        `Dear ${customerName},`,
        `We have successfully received your payment of ${amountFormatted} for order #${orderNumber} via Razorpay.`,
        "",
        `Transaction ID: ${paymentId}`,
        `Payment Method: ${method}`,
        `Settlement Date: ${date}`,
        "",
        "An official GST invoice has been generated for your record.",
        "With care, OVIA Finance Atelier",
      ].join("\n");

      const html = renderEmailLayout({
        title: subject,
        greeting: `Dear ${customerName},`,
        bodyParagraphs: [
          `We have successfully received and verified your payment of <strong>${amountFormatted}</strong> for order <strong>#${orderNumber}</strong>.`,
          "Your transaction was processed securely via Razorpay. Your luggage allocation is now locked for dispatch.",
        ],
        highlightBox: {
          label: "Payment Verification Record",
          content: [
            { label: "Payment Reference", value: paymentId },
            { label: "Amount Confirmed", value: amountFormatted },
            { label: "Payment Gateway", value: method },
            { label: "Settlement Status", value: "Verified & Cleared" },
          ],
        },
        footerNote: "This receipt serves as confirmation of payment. An official tax invoice is available in your OVIA account dashboard.",
      });

      return { subject, text, html };
    },
  },

  ORDER_SHIPPED: {
    id: "ORDER_SHIPPED",
    name: "Order Shipped (AWB)",
    channel: "Email & WhatsApp",
    defaultSubject: "Your OVIA Suitcase Has Dispatched with Delhivery",
    description: "Sent automatically when an AWB is assigned and marked dispatched.",
    sampleData: {
      orderNumber: "OV123456789",
      customerName: "Rahul Mehta",
      awb: "DEL908124582",
      courier: "Delhivery Air Express",
      estimatedDelivery: "3 business days",
      trackingUrl: "http://localhost:3000/account/orders/sample/tracking",
    },
    render: (data) => {
      const orderNumber = data.orderNumber || "OV123456789";
      const customerName = data.customerName || "Valued Voyager";
      const awb = data.awb || "DEL889123019";
      const courier = data.courier || "Delhivery Air Express";
      const trackingUrl = data.trackingUrl || `${process.env.APP_ORIGIN || "http://localhost:3000"}/account/orders/${data.orderId || "sample"}/tracking`;

      const subject = `Your OVIA Suitcase Has Dispatched with ${courier}`;
      const text = [
        "OVIA · DISPATCH NOTIFICATION",
        "",
        `Dear ${customerName},`,
        `Your handcrafted OVIA luggage has been dispatched and is currently en route with ${courier}.`,
        "",
        `AWB / Tracking Number: ${awb}`,
        `Courier Partner: ${courier}`,
        `Track real-time: ${trackingUrl}`,
        "",
        "With care, OVIA Logistics",
      ].join("\n");

      const html = renderEmailLayout({
        title: subject,
        greeting: `Dear ${customerName},`,
        bodyParagraphs: [
          `Your handcrafted OVIA luggage for order <strong>#${orderNumber}</strong> has completed master inspection and is now en route with our express logistics partner, <strong>${courier}</strong>.`,
          "You can monitor live milestone updates, hub scans, and dispatch progression directly through our tracking portal.",
        ],
        highlightBox: {
          label: "Dispatch Credentials",
          content: [
            { label: "Tracking / AWB Number", value: awb },
            { label: "Courier Partner", value: courier },
            { label: "Dispatch Hub", value: "New Delhi Central Atelier" },
            { label: "Service Tier", value: "Air Express Insured" },
          ],
        },
        actionButton: {
          text: "Track Shipment Live",
          url: trackingUrl,
        },
      });

      return { subject, text, html };
    },
  },

  OUT_FOR_DELIVERY: {
    id: "OUT_FOR_DELIVERY",
    name: "Out for Delivery",
    channel: "SMS & Email",
    defaultSubject: "Your OVIA delivery agent is arriving today",
    description: "Sent automatically when courier webhook updates shipping milestone to OUT_FOR_DELIVERY.",
    sampleData: {
      orderNumber: "OV123456789",
      customerName: "Rahul Mehta",
      awb: "DEL908124582",
      destination: "Bandra West, Mumbai",
    },
    render: (data) => {
      const orderNumber = data.orderNumber || "OV123456789";
      const customerName = data.customerName || "Valued Voyager";
      const awb = data.awb || "DEL889123019";
      const destination = data.destination || "Your registered shipping address";

      const subject = "Your OVIA delivery agent is arriving today";
      const text = [
        "OVIA · OUT FOR DELIVERY",
        "",
        `Dear ${customerName},`,
        "Your OVIA package is out for delivery today. Our courier agent will reach you shortly.",
        "",
        `Order: #${orderNumber}`,
        `AWB: ${awb}`,
        `Destination: ${destination}`,
        "",
        "Please ensure someone is available at the address to sign for the sealed shipment.",
        "With care, OVIA Dispatch",
      ].join("\n");

      const html = renderEmailLayout({
        title: subject,
        greeting: `Dear ${customerName},`,
        bodyParagraphs: [
          `Great news! Your OVIA shipment for order <strong>#${orderNumber}</strong> is on the final leg of its voyage and is <strong>out for delivery today</strong>.`,
          "A dedicated courier delivery executive will arrive at your destination address shortly.",
        ],
        highlightBox: {
          label: "Final Mile Details",
          content: [
            { label: "AWB Tracking", value: awb },
            { label: "Delivery Window", value: "Today before 7:00 PM" },
            { label: "Security Protocol", value: "Tamper-Evident Seal Verification" },
          ],
        },
        footerNote: "Please inspect the outer packaging seal upon arrival. If the seal is compromised, please refuse delivery and contact us immediately.",
      });

      return { subject, text, html };
    },
  },

  DELIVERED: {
    id: "DELIVERED",
    name: "Delivered",
    channel: "Email & SMS",
    defaultSubject: "Your OVIA Luggage Has Arrived — Welcome to the Voyage",
    description: "Sent automatically when courier webhook updates shipping milestone to DELIVERED.",
    sampleData: {
      orderNumber: "OV123456789",
      customerName: "Rahul Mehta",
      deliveredAt: "Today at 2:15 PM",
    },
    render: (data) => {
      const orderNumber = data.orderNumber || "OV123456789";
      const customerName = data.customerName || "Valued Voyager";
      const deliveredAt = data.deliveredAt || "Today";

      const subject = "Your OVIA Luggage Has Arrived — Welcome to the Voyage";
      const text = [
        "OVIA · DELIVERED",
        "",
        `Dear ${customerName},`,
        `Your OVIA shipment for order #${orderNumber} has been successfully delivered (${deliveredAt}).`,
        "",
        "We hope your new travel companion accompanies you on many memorable journeys across the globe.",
        "Remember that your piece is backed by our 5-Year Global Warranty and Lifetime Craftsmanship Guarantee.",
        "",
        "With warm regards, OVIA Atelier",
      ].join("\n");

      const html = renderEmailLayout({
        title: subject,
        greeting: `Dear ${customerName},`,
        bodyParagraphs: [
          `Your OVIA shipment for order <strong>#${orderNumber}</strong> has been successfully delivered (${deliveredAt}).`,
          "Every stitch, rivet, and silent Japanese Hinomoto wheel was engineered for lifetime resilience. May it elevate every journey you embark upon.",
        ],
        highlightBox: {
          label: "Complimentary Privileges Activated",
          content: [
            { label: "Global Warranty", value: "5-Year Hassle-Free Coverage" },
            { label: "Hardware Support", value: "TSA Lock Calibration Support" },
            { label: "Concierge Access", value: "Priority Atelier Care" },
          ],
        },
        footerNote: "Need assistance setting up your TSA combination lock or registering your serial number? Visit your OVIA account or reply to this email.",
      });

      return { subject, text, html };
    },
  },

  RETURN_RECEIVED: {
    id: "RETURN_RECEIVED",
    name: "Return Received",
    channel: "Email",
    defaultSubject: "Your OVIA Return Request is Being Reviewed #{returnId}",
    description: "Sent automatically when a customer submits a return or exchange request.",
    sampleData: {
      returnId: "RET-9041",
      orderNumber: "OV123456770",
      customerName: "Karan Patel",
      item: "Travel Kit (Tan Leather)",
      reason: "Wrong color received; requested exchange or refund",
    },
    render: (data) => {
      const returnId = data.returnId || "RET-9041";
      const orderNumber = data.orderNumber || "OV123456770";
      const customerName = data.customerName || "Valued Voyager";
      const item = data.item || "OVIA Piece";
      const reason = data.reason || "Return initiated";

      const subject = `Your OVIA Return Request is Being Reviewed #${returnId}`;
      const text = [
        "OVIA · RETURN REQUEST ACKNOWLEDGEMENT",
        "",
        `Dear ${customerName},`,
        `We have received your return request (${returnId}) for order #${orderNumber}.`,
        "",
        `Item: ${item}`,
        `Reason: ${reason}`,
        "Status: In Review by OVIA Concierge",
        "",
        "Our team will review your request within 24 hours and issue a complimentary return pickup.",
        "With care, OVIA Concierge",
      ].join("\n");

      const html = renderEmailLayout({
        title: subject,
        greeting: `Dear ${customerName},`,
        bodyParagraphs: [
          `We have received your return request <strong>#${returnId}</strong> for order <strong>#${orderNumber}</strong>.`,
          "Our concierge team is reviewing the details to ensure your resolution is handled with the utmost efficiency and care.",
        ],
        highlightBox: {
          label: "Return Ticket Record",
          content: [
            { label: "Return Reference", value: `#${returnId}` },
            { label: "Associated Order", value: `#${orderNumber}` },
            { label: "Item(s) Specified", value: item },
            { label: "Current Status", value: "Under Concierge Review" },
          ],
        },
        footerNote: "You will receive an instant notification as soon as your return is approved and your complimentary doorstep pickup is scheduled.",
      });

      return { subject, text, html };
    },
  },

  RETURN_APPROVED: {
    id: "RETURN_APPROVED",
    name: "Return Approved",
    channel: "Email",
    defaultSubject: "Your OVIA Return Request Has Been Approved",
    description: "Sent automatically when an admin approves a return request.",
    sampleData: {
      returnId: "RET-9040",
      orderNumber: "OV123456762",
      customerName: "Simran Kaur",
      pickupCourier: "Delhivery Express Doorstep Pickup",
      instructions: "Place luggage inside original dust bag and protective carton.",
    },
    render: (data) => {
      const returnId = data.returnId || "RET-9040";
      const orderNumber = data.orderNumber || "OV123456762";
      const customerName = data.customerName || "Valued Voyager";
      const pickupCourier = data.pickupCourier || "Delhivery Doorstep Logistics";

      const subject = "Your OVIA Return Request Has Been Approved";
      const text = [
        "OVIA · RETURN APPROVED",
        "",
        `Dear ${customerName},`,
        `Your return request #${returnId} for order #${orderNumber} has been approved.`,
        "",
        `Pickup Courier: ${pickupCourier}`,
        "Next Steps: Please place your OVIA piece in its protective dust cover and carton.",
        "The courier agent will arrive to collect the package.",
        "",
        "Upon arrival at our atelier, your refund will be disbursed automatically.",
        "With care, OVIA Concierge",
      ].join("\n");

      const html = renderEmailLayout({
        title: subject,
        greeting: `Dear ${customerName},`,
        bodyParagraphs: [
          `Your return request <strong>#${returnId}</strong> for order <strong>#${orderNumber}</strong> has been officially approved.`,
          "A complimentary courier pickup has been scheduled directly from your address. You do not need to print any shipping labels; our courier will arrive with the return AWB.",
        ],
        highlightBox: {
          label: "Return Pickup Schedule",
          content: [
            { label: "Return ID", value: `#${returnId}` },
            { label: "Pickup Partner", value: pickupCourier },
            { label: "Packaging Requirement", value: "Original Dust Bag & Carton" },
            { label: "Pickup Cost", value: "Complimentary (₹0.00)" },
          ],
        },
        footerNote: "Once your returned piece arrives at our atelier and passes our standard intake verification, your refund will be released immediately.",
      });

      return { subject, text, html };
    },
  },

  REFUND_COMPLETED: {
    id: "REFUND_COMPLETED",
    name: "Refund Completed",
    channel: "Email",
    defaultSubject: "Refund Disbursed for OVIA Order #{orderNumber}",
    description: "Sent automatically when Razorpay webhook confirms payment.refunded.",
    sampleData: {
      orderNumber: "OV123456755",
      customerName: "Vikram Malhotra",
      amountFormatted: "₹26,500",
      refundId: "rfnd_99214OviaDisbursed",
      source: "Original Payment Method (Razorpay)",
    },
    render: (data) => {
      const orderNumber = data.orderNumber || "OV123456755";
      const customerName = data.customerName || "Valued Voyager";
      const amountFormatted = data.amountFormatted || "₹26,500";
      const refundId = data.refundId || "rfnd_razorpay_disbursed";
      const source = data.source || "Original Payment Method via Razorpay";

      const subject = `Refund Disbursed for OVIA Order #${orderNumber}`;
      const text = [
        "OVIA · REFUND COMPLETED",
        "",
        `Dear ${customerName},`,
        `Your refund of ${amountFormatted} for order #${orderNumber} has been successfully disbursed.`,
        "",
        `Refund Reference: ${refundId}`,
        `Payment Source: ${source}`,
        "Estimated Credit: 2–5 business days depending on your banking provider.",
        "",
        "With care, OVIA Finance Concierge",
      ].join("\n");

      const html = renderEmailLayout({
        title: subject,
        greeting: `Dear ${customerName},`,
        bodyParagraphs: [
          `Your refund of <strong>${amountFormatted}</strong> for order <strong>#${orderNumber}</strong> has been successfully processed and disbursed.`,
          "The full credit has been dispatched back to your original payment account through Razorpay.",
        ],
        highlightBox: {
          label: "Refund Disbursal Record",
          content: [
            { label: "Refund ID", value: refundId },
            { label: "Amount Credited", value: amountFormatted },
            { label: "Destination", value: source },
            { label: "Bank Timeline", value: "2–5 Business Days" },
          ],
        },
        footerNote: "Depending on your issuing bank, the balance may take a few business days to reflect on your statement. For assistance, quote the refund reference above.",
      });

      return { subject, text, html };
    },
  },

  OTP_AUTHORIZATION: {
    id: "OTP_AUTHORIZATION",
    name: "OTP Authorization",
    channel: "Email & SMS",
    defaultSubject: "Your OVIA Security Verification Code",
    description: "Sent automatically when a customer requests login, signup, or password reset OTP.",
    sampleData: {
      otp: "849201",
      customerName: "Rahul Mehta",
      purpose: "sign-in or password reset",
    },
    render: (data) => {
      const otp = data.otp || "849201";
      const customerName = data.customerName || "Voyager";

      const subject = `Your OVIA Security Verification Code`;
      const text = [
        "OVIA · SECURITY VERIFICATION",
        "",
        `Dear ${customerName},`,
        `Your one-time OVIA security verification code is: ${otp}`,
        "",
        "This code is strictly confidential and expires in 10 minutes.",
        "If you did not request this authorization code, please disregard this notice.",
        "",
        "With care, OVIA Security Systems",
      ].join("\n");

      const html = renderEmailLayout({
        title: subject,
        greeting: `Dear ${customerName},`,
        bodyParagraphs: [
          "Use the one-time security authorization code below to verify your identity and access your OVIA privileges.",
        ],
        highlightBox: {
          label: "One-Time Security Code",
          content: otp,
        },
        footerNote: "This code expires in 10 minutes. For your protection, never share this code or your account credentials with anyone.",
      });

      return { subject, text, html };
    },
  },
};

/**
 * Event-Driven Notification Dispatcher.
 * - Idempotency deduplication check to prevent duplicate emails for repeated webhook events.
 * - Dispatches rich luxury HTML & text email via Resend (`sendAccountEmail`).
 * - Logs delivery status to MongoDB collection `notification_logs`.
 */
export async function dispatchNotification(
  eventType: NotificationEventType,
  payload: Record<string, any>,
  options?: {
    dedupeKey?: string;
    isTest?: boolean;
    recipientEmail?: string;
  },
): Promise<{ success: boolean; logId: string; duplicate?: boolean; error?: string }> {
  const template = NOTIFICATION_TEMPLATES[eventType];
  if (!template) {
    throw new Error(`Unknown notification event type: ${eventType}`);
  }

  const recipient =
    options?.recipientEmail?.trim() ||
    payload.recipientEmail ||
    payload.address?.email ||
    payload.email;

  if (!recipient || !recipient.includes("@")) {
    console.warn(`[notification-service] Skipped ${eventType}: No valid recipient email.`);
    return { success: false, logId: "", error: "Missing recipient email" };
  }

  const entityId = payload.orderId || payload.id || payload.returnId || payload.orderNumber;
  const dedupeKey =
    options?.dedupeKey ||
    `notif_${eventType}_${entityId || recipient}_${payload.qualifier || ""}`;

  // Check deduplication in database
  const isDuplicate = await checkNotificationDeduplication(dedupeKey);
  if (isDuplicate && !options?.isTest) {
    console.log(`[notification-service] Duplicate event detected for ${dedupeKey}. Skipping email dispatch.`);
    return { success: true, logId: dedupeKey, duplicate: true };
  }

  // Render template
  const rendered = template.render(payload);
  const now = new Date().toISOString();

  let deliveryStatus: "Delivered" | "Failed" = "Delivered";
  let errorMessage: string | undefined;

  try {
    // Send email via Resend
    await sendAccountEmail({
      id: dedupeKey,
      to: recipient,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
    console.log(`[notification-service] Successfully dispatched ${eventType} to ${recipient} via Resend.`);
  } catch (err: any) {
    deliveryStatus = "Failed";
    errorMessage = err?.message || String(err);
    console.error(`[notification-service] Delivery failed for ${eventType} to ${recipient}:`, errorMessage);
  }

  // Record delivery status log
  const logDoc: NotificationLog = {
    id: dedupeKey,
    eventType,
    templateName: template.name,
    recipient,
    subject: rendered.subject,
    channel: template.channel,
    status: deliveryStatus,
    entityId: entityId ? String(entityId) : undefined,
    error: errorMessage,
    createdAt: now,
    isTest: !!options?.isTest,
  };

  await recordNotificationLog(logDoc);

  return {
    success: deliveryStatus === "Delivered",
    logId: dedupeKey,
    error: errorMessage,
  };
}

async function checkNotificationDeduplication(dedupeKey: string): Promise<boolean> {
  try {
    if (!isDemo()) {
      const client = await mongo();
      const db = client.db(process.env.MONGODB_DB || "ovia");
      const existing = await db
        .collection("notification_logs")
        .findOne({ id: dedupeKey, status: "Delivered" });
      return !!existing;
    } else {
      return await transaction(async (repo) => {
        const item = await repo.get<NotificationLog>("notification_logs", dedupeKey);
        return item?.status === "Delivered";
      });
    }
  } catch {
    return false;
  }
}

async function recordNotificationLog(doc: NotificationLog): Promise<void> {
  try {
    if (!isDemo()) {
      const client = await mongo();
      const db = client.db(process.env.MONGODB_DB || "ovia");
      await db.collection("notification_logs").updateOne(
        { id: doc.id },
        { $set: doc },
        { upsert: true },
      );
    } else {
      await transaction(async (repo) => {
        await repo.put("notification_logs", doc);
      });
    }
  } catch (err) {
    console.warn("[notification-service] Failed to persist notification log:", err);
  }
}

export async function getNotificationStudioData() {
  const templatesList = Object.values(NOTIFICATION_TEMPLATES);

  let logs: NotificationLog[] = [];
  try {
    if (!isDemo()) {
      const client = await mongo();
      const db = client.db(process.env.MONGODB_DB || "ovia");
      logs = (await db
        .collection("notification_logs")
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()) as unknown as NotificationLog[];
    } else {
      logs = await transaction(async (repo) => {
        const all = await repo.find<NotificationLog>("notification_logs");
        return (all || []).sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
        );
      });
    }
  } catch (err) {
    console.warn("[notification-service] Error fetching logs:", err);
  }

  // Calculate lastSent and status per template
  const enrichedTemplates = templatesList.map((tpl) => {
    const latestLog = logs.find((l) => l.eventType === tpl.id);
    let lastSent = "Never";
    let status = "Active";

    if (latestLog) {
      const diffMs = Date.now() - Date.parse(latestLog.createdAt);
      if (diffMs < 60_000) lastSent = "Just now";
      else if (diffMs < 3600_000) lastSent = `${Math.floor(diffMs / 60_000)} minutes ago`;
      else if (diffMs < 86400_000) lastSent = `${Math.floor(diffMs / 3600_000)} hours ago`;
      else lastSent = `${Math.floor(diffMs / 86400_000)} days ago`;

      status = latestLog.status;
    }

    const preview = tpl.render(tpl.sampleData);

    return {
      id: tpl.id,
      name: tpl.name,
      channel: tpl.channel,
      lastSent,
      status,
      subject: preview.subject,
      previewHtml: preview.html,
      description: tpl.description,
    };
  });

  return {
    templates: enrichedTemplates,
    recentLogs: logs.slice(0, 30),
  };
}

export async function sendTestNotification(
  templateNameOrId: string,
  recipientEmail: string,
) {
  const tpl =
    NOTIFICATION_TEMPLATES[templateNameOrId as NotificationEventType] ||
    Object.values(NOTIFICATION_TEMPLATES).find((t) => t.name === templateNameOrId);

  if (!tpl) {
    throw new Error(`Template not found: ${templateNameOrId}`);
  }

  const testPayload = {
    ...tpl.sampleData,
    recipientEmail,
    email: recipientEmail,
  };

  const testKey = `test_${tpl.id}_${Date.now()}_${randomUUID().slice(0, 6)}`;

  return await dispatchNotification(tpl.id, testPayload, {
    dedupeKey: testKey,
    isTest: true,
    recipientEmail,
  });
}
