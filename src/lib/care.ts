export const supportCategories = [
  "Order issue",
  "Delivery issue",
  "Return",
  "Refund",
  "Payment",
  "Product question",
  "Damaged product",
  "Wrong product received",
  "Missing item",
  "Account problem",
  "Technical problem",
  "Privacy request",
  "Other",
] as const;
export type CareMessage = {
  id: string;
  author: "customer" | "support";
  text: string;
  createdAt: string;
};
export type CareTicket = {
  id: string;
  userId: string;
  name: string;
  email: string;
  orderId?: string;
  category: string;
  subject: string;
  status: "Open" | "In Review" | "Waiting for Customer" | "Resolved" | "Closed";
  messages: CareMessage[];
  createdAt: string;
  updatedAt: string;
};
export type PrivacyRequest = {
  id: string;
  userId: string;
  requestType: string;
  message: string;
  status: "Submitted" | "In Review" | "Completed" | "Rejected";
  createdAt: string;
  updatedAt: string;
};
export const privacyTypes = [
  "Access my data",
  "Correct my data",
  "Delete my account/data",
  "Export my data",
  "Privacy question",
  "Other",
] as const;
export const faqs = [
  {
    slug: "place-order",
    category: "Orders",
    question: "Can I place a real order?",
    answer:
      "OVIA is currently a concept store. Demo checkout creates a sample order without charging you or shipping goods.",
  },
  {
    slug: "track-order",
    category: "Shipping",
    question: "Where can I find my order?",
    answer:
      "Sign in and open Track order or Your account to see your own order records. Carrier tracking is not connected; no live shipment events are generated.",
  },
  {
    slug: "shipping-cost",
    category: "Shipping",
    question: "Where do you ship and what does delivery cost?",
    answer:
      "Commercial shipping destinations, charges and delivery estimates are awaiting configuration. Only India is available for demo checkout. International browsing does not enable international delivery.",
  },
  {
    slug: "return-item",
    category: "Returns",
    question: "How do I request a return or refund?",
    answer:
      "Open a support request with the Return or Refund category and select your order. Demo orders require no physical return. Commercial eligibility, return windows and refund processing are not enabled until the business policy is approved.",
  },
  {
    slug: "payment-details",
    category: "Payments",
    question: "Which payment currency is used?",
    answer:
      "Checkout and order records use INR. Other currency values, when available, are approximate display estimates using dated reference rates. Sandbox payment integrations use test credentials only.",
  },
  {
    slug: "reset-password",
    category: "Account",
    question: "How do I reset my password?",
    answer:
      "Use Forgot password on the sign-in page. Reset links expire after 30 minutes and can be used once. Completing a reset revokes existing account sessions. Email delivery needs a configured service.",
  },
  {
    slug: "verify-email",
    category: "Account",
    question: "How can I verify my email?",
    answer:
      "Use your email verification link, or request another from Account security. Verification links expire after 24 hours. Delivery is available only when the email provider is configured.",
  },
  {
    slug: "secure-support",
    category: "Security",
    question: "What should I leave out of a support message?",
    answer:
      "Never include passwords, verification codes, full card numbers or CVV. Support does not need them. Use the Privacy request category for privacy concerns.",
  },
  {
    slug: "export-data",
    category: "Privacy",
    question: "Can I download or request changes to my data?",
    answer:
      "Sign in and open Privacy controls. You can download your own account data after confirming your password, or submit a correction or deletion request for review.",
  },
  {
    slug: "warranty",
    category: "Products",
    question: "Do the concept products have a warranty?",
    answer:
      "No commercial warranty is offered for fictional design studies. Product compatibility, warranties and care instructions need approval before physical goods are sold.",
  },
  {
    slug: "size",
    category: "Products",
    question: "How do I choose a cabin size?",
    answer:
      "Compare the illustrative dimensions in the size guide. Cabin limits vary; check directly with your airline before purchasing a physical product.",
  },
];
