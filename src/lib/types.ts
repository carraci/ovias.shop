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
  role?: "customer" | "support" | "admin";
};
export type Session = { id: string; userId: string; expiresAt: string };
export type Cart = { id: string; lines: CartLine[]; version: number };
export type Address = {
  name: string;
  email: string;
  line1: string;
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
export type Order = {
  id: string;
  owner: string;
  userId?: string;
  idempotencyKey: string;
  lines: OrderLine[];
  total: number;
  address: Address;
  status: "demo" | "pending" | "paid" | "expired" | "refund_required";
  provider: "demo" | "stripe" | "razorpay";
  providerId?: string;
  providerCreating?: boolean;
  createdAt: string;
  expiresAt: string;
};

export type ContentBlockType =
  | "paragraph"
  | "heading"
  | "quote"
  | "image"
  | "callout";

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
  contentBlocks: ContentBlock[];
  gallery: string[];
  relatedProducts: string[];
  publishedAt: string;
  status: "published" | "draft";
  featured: boolean;
  readingTime?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
};
