import type { CheckoutQuote } from "./checkout";
import type { OrderShipping } from "./shipping/types";
export type CartLine = { sku: string; quantity: number };
export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  verifiedAt?: string;
  termsVersion?: string;
  termsAcceptedAt?: string;
  passwordChangedAt?: string;
  role?: "customer" | "CUSTOMER" | "support" | "admin" | "OWNER" | string;
};
export type Session = {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt?: string;
  lastActiveAt?: string;
  userAgent?: string;
  ip?: string;
  device?: string;
  browser?: string;
  os?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  location?: string;
  isCurrent?: boolean;
};
export type Cart = { id: string; lines: CartLine[]; version: number };
export type Address = {
  name: string;
  email: string;
  line1: string;
  line2?: string;
  phone?: string;
  city: string;
  region: string;
  postalCode: string;
  country: "IN";
};
export type OrderLine = {
  sku: string;
  name: string;
  color: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
};
export type LogisticsOperation = {
  id: string;
  action: "approve" | "cancel";
  status: "Processing" | "Failed" | "Confirmed";
  phase: "Shipment" | "Pickup" | "Courier cancellation" | "Refund" | "Complete";
  message?: string;
  ambiguous?: boolean;
  leaseUntil?: number;
  updatedAt: string;
  package?: {
    weightGrams: number;
    length: number;
    width: number;
    height: number;
  };
  pickupDate?: string;
  refundKey?: string;
};
export type Order = {
  fulfillmentStatus?: import("./shipping/types").InternalShippingStatus;
  logisticsOperations?: {
    approve?: LogisticsOperation;
    cancel?: LogisticsOperation;
  };
  refunds?: OrderRefund[];
  paymentInfo?: {
    verifiedAt?: string;
    method?: string;
    capturedAt?: string;
    feePaise?: number;
    taxPaise?: number;
  };
  campaignId?: string;
  id: string;
  owner: string;
  userId?: string;
  idempotencyKey: string;
  lines: OrderLine[];
  total: number;
  address: Address;
  status:
    | "demo"
    | "pending"
    | "paid"
    | "expired"
    | "refund_required"
    | "cancelled"
    | "payment_failed"
    | "payment_pending";
  provider: "demo" | "stripe" | "razorpay" | "paypal";
  providerId?: string;
  providerCreating?: boolean;
  orderNumber?: string;
  checkoutQuote?: CheckoutQuote;
  captureId?: string;
  paidAt?: string;
  approvalUrl?: string;
  captureLockUntil?: number;
  cancellationDeadline?: string;
  returnDeadline?: string;
  inventoryReleased?: boolean;
  shipping?: OrderShipping;
  createdAt: string;
  expiresAt: string;
};

export type OrderRefund = {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  actor: string;
  status: "Processing" | "Refunded" | "Failed";
  remoteId?: string;
  message?: string;
  retryable?: boolean;
  requestedAt: string;
  updatedAt: string;
};

export type ContentBlockType =
  "paragraph" | "heading" | "quote" | "image" | "callout";

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  text?: string;
  image?: string;
  caption?: string;
  author?: string;
};

export type Story = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  heroImage: string;
  thumbnail: string;
  content?: string;
  contentBlocks: ContentBlock[];
  gallery: string[];
  relatedProducts: string[];
  publishedAt: string;
  status: "published" | "draft" | "scheduled" | "archived";
  featured: boolean;
  readingTime?: string;
  author?: string;
  tags?: string[];
  scheduledFor?: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  indexing?: string;
  followLinks?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewAspects = {
  quality?: number;
  design?: number;
  valueForMoney?: number;
};

export type ProductReview = {
  id: string;
  userId: string;
  userName: string;
  orderId?: string;
  orderNumber?: string;
  productSku: string;
  productSlug: string;
  productName: string;
  productColor?: string;
  productImage?: string;
  rating: number;
  title: string;
  comment: string;
  authorEmail?: string;
  isAnonymous?: boolean;
  aspects?: ReviewAspects;
  photos?: string[];
  verified: boolean;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type ToReviewItem = {
  orderId: string;
  orderNumber: string;
  deliveredAtFormatted?: string;
  sku: string;
  name: string;
  color?: string;
  image?: string;
  slug: string;
};

