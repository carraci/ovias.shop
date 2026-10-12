import type { OrderLine } from "./types";
export type ShippingMethod = "standard" | "express";
export type CheckoutQuote = {
  id: string;
  cartVersion: number;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  taxIncluded: boolean;
  total: number;
  shippingMethod: ShippingMethod;
  shippingLabel: string;
  estimate: string;
  promoCode?: string;
  expiresAt: string;
  currency: "INR";
  payment?: { currency: string; amount: number; rate: string };
  paypalReady: boolean;
  shippingOptions: {
    id: ShippingMethod;
    label: string;
    estimate: string;
    cost: number;
  }[];
};
export type PaymentSession = {
  id: string;
  orderNumber: string;
  status: string;
  provider: string;
  approvalUrl?: string;
  total: number;
  payment?: CheckoutQuote["payment"];
  quote?: CheckoutQuote;
  address?: import("./types").Address;
};
