export type FaqCategorySlug =
  | "delivery"
  | "exchange-returns"
  | "gifting"
  | "orders"
  | "products"
  | "services";

export interface FaqCategory {
  slug: FaqCategorySlug;
  name: string;
  shortDescription: string;
  heroDescription: string;
}

export interface FaqItem {
  id: string;
  category: FaqCategorySlug;
  slug: string;
  question: string;
  answer: string;
  subtext?: string;
  keywords: string[];
  relatedSlugs: string[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    slug: "delivery",
    name: "DELIVERY",
    shortDescription: "Shipping, delivery times, tracking and destinations.",
    heroDescription:
      "Everything you need to know about receiving your OVIA order with care and security.",
  },
  {
    slug: "exchange-returns",
    name: "EXCHANGE & RETURNS",
    shortDescription: "Returns, exchanges, refunds and damaged orders.",
    heroDescription:
      "Guidelines on complimentary returns, exchanges, and ensuring your satisfaction.",
  },
  {
    slug: "gifting",
    name: "GIFTING",
    shortDescription: "Gift packaging, messages and gift assistance.",
    heroDescription:
      "Bespoke packaging, personalized sentiments, and considered gifting services.",
  },
  {
    slug: "orders",
    name: "ORDERS",
    shortDescription: "Placing, changing, cancelling and tracking orders.",
    heroDescription:
      "Managing your acquisitions, payment options, and order confirmations.",
  },
  {
    slug: "products",
    name: "PRODUCTS",
    shortDescription: "Materials, care, availability and personalisation.",
    heroDescription:
      "Craftsmanship, materials provenance, sizing, and bespoke personalisation.",
  },
  {
    slug: "services",
    name: "SERVICES",
    shortDescription:
      "Repairs, Client Advisors, appointments and contact options.",
    heroDescription:
      "Dedicated Client Advisor appointments, repairs, product registration, and atelier care.",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  // ==========================================
  // 1. DELIVERY
  // ==========================================
  {
    id: "del-01",
    category: "delivery",
    slug: "where-does-ovia-deliver",
    question: "Where does OVIA deliver?",
    answer:
      "OVIA offers complimentary white-glove courier delivery across India to all major metropolitan centers and regional pin codes serviced by our dedicated secure logistics partners. We also facilitate international shipments to select destinations upon request through our Client Services concierge.",
    subtext:
      "For specific island or remote pin codes, our team will proactively coordinate bespoke transit arrangements at checkout.",
    keywords: ["delivery", "destination", "shipping", "country", "india", "pin code", "locations"],
    relatedSlugs: [
      "how-long-does-delivery-take",
      "how-much-does-delivery-cost",
      "can-i-change-my-delivery-address",
      "can-someone-else-receive-my-order",
    ],
  },
  {
    id: "del-02",
    category: "delivery",
    slug: "how-long-does-delivery-take",
    question: "How long does delivery take?",
    answer:
      "Standard domestic delivery typically concludes within 3 to 5 business days for metropolitan areas and 5 to 7 business days for regional destinations. Each piece is inspected and hand-packaged prior to dispatch. Personalised or monogrammed items undergo bespoke atelier preparation and require an additional 3 business days.",
    subtext:
      "You will receive an encrypted tracking dispatch notice as soon as your shipment departs our atelier facility.",
    keywords: ["transit", "time", "duration", "days", "dispatch", "delivery time"],
    relatedSlugs: [
      "where-does-ovia-deliver",
      "how-can-i-track-my-order",
      "does-ovia-offer-express-delivery",
    ],
  },
  {
    id: "del-03",
    category: "delivery",
    slug: "how-much-does-delivery-cost",
    question: "How much does delivery cost?",
    answer:
      "OVIA provides complimentary secured standard delivery for all orders placed through our digital boutique and with our Client Advisors. For bespoke same-day concierge delivery within select tier-one cities, nominal courier rates may apply during peak holiday schedules.",
    subtext:
      "All duties, handling, and luxury insurance coverage are fully included with standard delivery.",
    keywords: ["cost", "free shipping", "price", "fee", "complimentary", "rates"],
    relatedSlugs: [
      "where-does-ovia-deliver",
      "does-ovia-offer-express-delivery",
      "how-long-does-delivery-take",
    ],
  },
  {
    id: "del-04",
    category: "delivery",
    slug: "how-can-i-track-my-order",
    question: "How can I track my order?",
    answer:
      "Once your parcel is handed to our secure logistics courier, you will receive an SMS and email notification containing your private tracking URL and consignment identifier. You may also track real-time transit directly within the 'Track Order' portal on our website by entering your order number and contact email.",
    keywords: ["tracking", "order status", "consignment", "awb", "where is my order"],
    relatedSlugs: [
      "how-long-does-delivery-take",
      "can-i-change-my-delivery-address",
      "what-happens-if-i-miss-my-delivery",
    ],
  },
  {
    id: "del-05",
    category: "delivery",
    slug: "can-i-change-my-delivery-address",
    question: "Can I change my delivery address?",
    answer:
      "If your order has not yet been processed for dispatch, our Client Advisors can update your delivery destination immediately. For your security, destination changes once a high-value parcel is in transit require identity verification and may cause a 24-hour rerouting delay.",
    subtext:
      "Please connect with Client Services promptly via phone or WhatsApp with your order reference.",
    keywords: ["address", "change destination", "reroute", "modify address", "shipping address"],
    relatedSlugs: [
      "can-i-modify-my-order",
      "how-can-i-track-my-order",
      "can-someone-else-receive-my-order",
    ],
  },
  {
    id: "del-06",
    category: "delivery",
    slug: "what-happens-if-i-miss-my-delivery",
    question: "What happens if I miss my delivery?",
    answer:
      "Because all OVIA consignments require an adult physical signature upon delivery, our courier partner will attempt contact prior to arrival. If you are unavailable, up to three consecutive delivery attempts will be scheduled before the parcel is securely held at a local hub.",
    subtext:
      "You can also instruct our Client Advisor to hold delivery until a convenient date.",
    keywords: ["missed delivery", "reattempt", "courier attempt", "failed delivery", "signature"],
    relatedSlugs: [
      "can-someone-else-receive-my-order",
      "how-can-i-track-my-order",
      "can-i-collect-my-order",
    ],
  },
  {
    id: "del-07",
    category: "delivery",
    slug: "does-ovia-offer-express-delivery",
    question: "Does OVIA offer express delivery?",
    answer:
      "Yes. In select metropolitan areas (including Mumbai, Delhi NCR, and Bengaluru), OVIA offers Next-Day White Glove Concierge Delivery for non-personalised pieces when orders are confirmed before 1:00 PM IST.",
    keywords: ["express", "next day", "urgent", "fast shipping", "concierge delivery", "speed"],
    relatedSlugs: [
      "how-long-does-delivery-take",
      "how-much-does-delivery-cost",
      "can-i-collect-my-order",
    ],
  },
  {
    id: "del-08",
    category: "delivery",
    slug: "can-i-collect-my-order",
    question: "Can I collect my order?",
    answer:
      "OVIA offers complimentary Click & Collect from our Maison locations in Mumbai, New Delhi, and Bengaluru. You will receive an invitation when your piece is prepared, packaged, and waiting in our private lounge for inspection.",
    subtext:
      "Please present a government-issued photo ID along with your collection QR code or order confirmation.",
    keywords: ["collect", "pickup", "click and collect", "in-store pickup", "store collection"],
    relatedSlugs: [
      "where-does-ovia-deliver",
      "how-long-does-delivery-take",
      "can-someone-else-receive-my-order",
    ],
  },
  {
    id: "del-09",
    category: "delivery",
    slug: "can-someone-else-receive-my-order",
    question: "Can someone else receive my order?",
    answer:
      "Yes, an authorized representative at your delivery address may sign for and receive your shipment. To protect high-value pieces, the recipient will be asked to verify the recipient name and provide a valid one-time security PIN sent to your registered phone number.",
    keywords: ["representative", "someone else", "third party", "sign for order", "proxy"],
    relatedSlugs: [
      "can-i-change-my-delivery-address",
      "what-happens-if-i-miss-my-delivery",
      "can-i-collect-my-order",
    ],
  },
  {
    id: "del-10",
    category: "delivery",
    slug: "what-should-i-do-if-my-parcel-arrives-damaged",
    question: "What should I do if my parcel arrives damaged?",
    answer:
      "If the external transit box exhibits visible tampering or structural damage upon delivery, please document the carton before opening and notify the courier immediately. Contact OVIA Client Services within 24 hours of receipt with photographic evidence so we may initiate immediate exchange or replacement protocols.",
    keywords: ["damaged", "broken", "crushed", "transit damage", "tampered", "box"],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "how-do-i-return-an-online-order",
      "how-can-i-contact-ovia-client-services",
    ],
  },

  // ==========================================
  // 2. EXCHANGE & RETURNS
  // ==========================================
  {
    id: "ret-01",
    category: "exchange-returns",
    slug: "what-is-ovias-return-policy",
    question: "What is OVIA's return policy?",
    answer:
      "OVIA accepts returns of eligible, uncarried items in pristine, original condition within 14 calendar days of delivery. All original packaging, dust bags, security tags, authenticity cards, and protective films must remain intact and affixed to the product.",
    subtext:
      "Personalised or bespoke monogrammed creations are crafted specifically to your commission and are considered final sale.",
    keywords: ["return policy", "returns", "refunds", "days", "condition", "terms"],
    relatedSlugs: [
      "how-long-do-i-have-to-return-an-item",
      "how-do-i-return-an-online-order",
      "can-personalised-products-be-returned",
      "are-returns-complimentary",
    ],
  },
  {
    id: "ret-02",
    category: "exchange-returns",
    slug: "how-do-i-return-an-online-order",
    question: "How do I return an online order?",
    answer:
      "Initiate your return either through the 'My Account' portal or by contacting an OVIA Client Advisor. We will generate a prepaid, insured return waybill and schedule a secure white-glove courier pickup at your preferred address and time.",
    keywords: ["return online", "process return", "schedule pickup", "return label", "courier"],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "are-returns-complimentary",
      "when-will-i-receive-my-refund",
    ],
  },
  {
    id: "ret-03",
    category: "exchange-returns",
    slug: "how-do-i-exchange-an-item",
    question: "How do I exchange an item?",
    answer:
      "To exchange an item for a different size, shade, or silhouette, contact Client Services. An Advisor will immediately reserve your desired replacement piece while arranging complimentary retrieval of the original creation.",
    keywords: ["exchange", "swap", "different size", "different colour", "replacement"],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "how-do-i-return-an-online-order",
      "can-a-gift-recipient-exchange-an-item",
    ],
  },
  {
    id: "ret-04",
    category: "exchange-returns",
    slug: "how-long-do-i-have-to-return-an-item",
    question: "How long do I have to return an item?",
    answer:
      "You have 14 days from the documented date of delivery to submit a return request. Returned parcels must be handed over to our collection courier within 5 days of receiving the return authorization label.",
    keywords: ["timeframe", "window", "14 days", "how long", "deadline", "return period"],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "how-do-i-return-an-online-order",
      "when-will-i-receive-my-refund",
    ],
  },
  {
    id: "ret-05",
    category: "exchange-returns",
    slug: "are-returns-complimentary",
    question: "Are returns complimentary?",
    answer:
      "Yes. OVIA provides complimentary insured return pickup for all domestic online orders complying with our return conditions. There are no restocking fees or logistics charges deducted from your refund.",
    keywords: ["free returns", "complimentary", "cost", "restocking fee", "shipping return"],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "how-do-i-return-an-online-order",
      "when-will-i-receive-my-refund",
    ],
  },
  {
    id: "ret-06",
    category: "exchange-returns",
    slug: "when-will-i-receive-my-refund",
    question: "When will I receive my refund?",
    answer:
      "Once your returned piece arrives at our atelier, our quality team completes an authenticity and condition assessment within 2 to 3 business days. Approved refunds are credited directly to your original payment method within 5 to 7 banking days depending on your financial institution.",
    keywords: ["refund timing", "when refund", "credit back", "bank transfer", "money back"],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "what-condition-must-returned-products-be-in",
      "are-returns-complimentary",
    ],
  },
  {
    id: "ret-07",
    category: "exchange-returns",
    slug: "can-personalised-products-be-returned",
    question: "Can personalised products be returned?",
    answer:
      "Because personalised, bespoke monogrammed, or custom-embossed pieces are created uniquely to your specifications, they are ineligible for return or exchange unless a manufacturing defect is verified upon initial inspection.",
    subtext:
      "Our Client Advisors review all monogram previews with you before atelier execution to ensure total satisfaction.",
    keywords: ["personalised", "monogram", "custom", "final sale", "return personalised"],
    relatedSlugs: [
      "can-personalised-products-be-gifted",
      "how-does-ovia-personalisation-work",
      "what-is-ovias-return-policy",
    ],
  },
  {
    id: "ret-08",
    category: "exchange-returns",
    slug: "can-sale-products-be-returned",
    question: "Can sale products be returned?",
    answer:
      "OVIA preserves a timeless design ethos and does not conduct conventional seasonal markdowns. In the rare event of archive pieces or private preview acquisitions, specific terms will be clearly delineated at the point of confirmation.",
    keywords: ["sale", "discount", "markdown", "archive", "promotion", "clearance"],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "can-personalised-products-be-returned",
    ],
  },
  {
    id: "ret-09",
    category: "exchange-returns",
    slug: "what-condition-must-returned-products-be-in",
    question: "What condition must returned products be in?",
    answer:
      "All returns must be unused, uncarried, and in perfect original condition with zero creasing, leather scratches, or hardware scuffs. Products must be enclosed in their signature protective dust bag and presentation box along with all tags, straps, locks, and keys.",
    keywords: ["condition", "tags", "dust bag", "scratches", "pristine", "used"],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "how-do-i-return-an-online-order",
      "when-will-i-receive-my-refund",
    ],
  },
  {
    id: "ret-10",
    category: "exchange-returns",
    slug: "what-should-i-do-if-my-product-arrives-damaged",
    question: "What should I do if my product arrives damaged?",
    answer:
      "In the improbable event that your OVIA piece exhibits a defect or damage upon arrival, please photograph the piece and contact Client Services within 48 hours. We will promptly prioritize an immediate exchange or expedited atelier restoration.",
    keywords: ["damaged product", "defective", "flaw", "broken piece", "report damage"],
    relatedSlugs: [
      "what-should-i-do-if-my-parcel-arrives-damaged",
      "how-can-i-request-a-repair",
      "how-can-i-contact-ovia-client-services",
    ],
  },

  // ==========================================
  // 3. GIFTING
  // ==========================================
  {
    id: "gift-01",
    category: "gifting",
    slug: "does-ovia-offer-gift-packaging",
    question: "Does OVIA offer gift packaging?",
    answer:
      "Yes. Every OVIA order arrives encased in our signature luxury presentation box, tied with grosgrain ribbon and nestled inside a protective travel dust bag. Complimentary gift presentation can be selected during checkout or requested via Client Services.",
    keywords: ["gift packaging", "gift box", "ribbon", "dust bag", "wrapping", "presentation"],
    relatedSlugs: [
      "what-does-ovia-gift-packaging-include",
      "can-i-include-a-personal-gift-message",
      "will-prices-appear-inside-the-gift-package",
    ],
  },
  {
    id: "gift-02",
    category: "gifting",
    slug: "can-i-include-a-personal-gift-message",
    question: "Can I include a personal gift message?",
    answer:
      "Yes. You may compose a personalized message of up to 250 characters during checkout. Your words will be typeset on heavy warm-white parchment cardstock and sealed in an embossed OVIA envelope placed inside the presentation parcel.",
    keywords: ["gift message", "card", "envelope", "note", "personal words", "parchment"],
    relatedSlugs: [
      "does-ovia-offer-gift-packaging",
      "will-prices-appear-inside-the-gift-package",
      "can-i-send-a-gift-directly-to-someone",
    ],
  },
  {
    id: "gift-03",
    category: "gifting",
    slug: "will-prices-appear-inside-the-gift-package",
    question: "Will prices appear inside the gift package?",
    answer:
      "No. When an order is indicated as a gift (or when a recipient address differs from billing), all pricing details, commercial invoices, and payment receipts are excluded from the physical package. Digital receipts are transmitted solely to the purchaser's email.",
    keywords: ["price", "invoice", "cost", "hide price", "gift receipt", "tag"],
    relatedSlugs: [
      "can-i-send-a-gift-directly-to-someone",
      "does-ovia-offer-gift-packaging",
      "can-a-gift-recipient-exchange-an-item",
    ],
  },
  {
    id: "gift-04",
    category: "gifting",
    slug: "can-i-send-a-gift-directly-to-someone",
    question: "Can I send a gift directly to someone?",
    answer:
      "Yes. Simply input the recipient's destination under the shipping address and enter your own information under the billing address. The package will arrive in pristine presentation wrapping accompanied by your personal message card.",
    keywords: ["direct shipping", "recipient", "send to friend", "gift address"],
    relatedSlugs: [
      "will-prices-appear-inside-the-gift-package",
      "can-i-include-a-personal-gift-message",
      "can-someone-else-receive-my-order",
    ],
  },
  {
    id: "gift-05",
    category: "gifting",
    slug: "can-a-gift-recipient-exchange-an-item",
    question: "Can a gift recipient exchange an item?",
    answer:
      "Yes. A gift recipient may contact OVIA Client Services with the gift exchange code or order reference number. Our team will assist with exchanging the piece for another creation or issuing an OVIA Maison credit, without notifying the purchaser unless requested.",
    keywords: ["gift exchange", "exchange gift", "recipient exchange", "store credit"],
    relatedSlugs: [
      "how-do-i-exchange-an-item",
      "what-is-ovias-return-policy",
      "will-prices-appear-inside-the-gift-package",
    ],
  },
  {
    id: "gift-06",
    category: "gifting",
    slug: "can-personalised-products-be-gifted",
    question: "Can personalised products be gifted?",
    answer:
      "Personalised creations make exceptional heirloom gifts. You may select custom initials, blind debossing, or foil stamping prior to checkout. Please note that personalised pieces require 3 additional atelier preparation days and cannot be returned.",
    keywords: ["personalised gift", "monogram gift", "initials", "custom gift"],
    relatedSlugs: [
      "can-personalised-products-be-returned",
      "how-does-ovia-personalisation-work",
      "does-ovia-offer-gift-packaging",
    ],
  },
  {
    id: "gift-07",
    category: "gifting",
    slug: "can-ovia-help-me-choose-a-gift",
    question: "Can OVIA help me choose a gift?",
    answer:
      "Our Client Advisors specialize in tailored recommendations based on travel habits, lifestyle, and aesthetic preferences. We invite you to schedule a digital consultation or connect with us directly via phone, WhatsApp, or in our boutique lounges.",
    keywords: ["gift advice", "choose gift", "recommendation", "client advisor", "consultation"],
    relatedSlugs: [
      "how-do-i-book-an-appointment",
      "how-can-i-contact-ovia-client-services",
      "can-a-client-advisor-help-me-choose-a-product",
    ],
  },
  {
    id: "gift-08",
    category: "gifting",
    slug: "what-does-ovia-gift-packaging-include",
    question: "What does OVIA gift packaging include?",
    answer:
      "OVIA gift packaging includes our structural warm-grey and ivory gift box made from FSC-certified sustainable board, a breathable cotton-linen protective dust bag, tone-on-tone grosgrain ribbon, and a customized letterpress sentiment card.",
    keywords: ["gift packaging include", "box contents", "dust bag", "ribbon", "packaging details"],
    relatedSlugs: [
      "does-ovia-offer-gift-packaging",
      "can-i-include-a-personal-gift-message",
      "will-prices-appear-inside-the-gift-package",
    ],
  },

  // ==========================================
  // 4. ORDERS
  // ==========================================
  {
    id: "ord-01",
    category: "orders",
    slug: "how-do-i-place-an-ovia-order",
    question: "How do I place an OVIA order?",
    answer:
      "Select your chosen piece on our digital boutique, specify any preferred colorway or personalization details, and click 'Add to bag'. Proceed to checkout to specify delivery details and choose your preferred encrypted payment method. Alternatively, you may place your order directly with a Client Advisor via phone or WhatsApp.",
    keywords: ["place order", "how to buy", "checkout", "purchase", "shopping"],
    relatedSlugs: [
      "do-i-need-an-account-to-order",
      "what-happens-after-i-place-an-order",
      "can-i-order-by-contacting-client-services",
    ],
  },
  {
    id: "ord-02",
    category: "orders",
    slug: "do-i-need-an-account-to-order",
    question: "Do I need an account to order?",
    answer:
      "No. You may complete your order seamlessly through Guest Checkout. However, creating an OVIA profile allows you to track historical acquisitions, manage registered product guarantees, store delivery preferences, and access priority bespoke services.",
    keywords: ["account", "guest checkout", "sign in", "register", "profile"],
    relatedSlugs: [
      "how-do-i-place-an-ovia-order",
      "how-can-i-check-my-order-status",
      "how-do-i-register-an-ovia-product",
    ],
  },
  {
    id: "ord-03",
    category: "orders",
    slug: "how-can-i-check-my-order-status",
    question: "How can I check my order status?",
    answer:
      "If you placed your order while signed in, visit 'My Account' > 'Orders' to view real-time production, fulfillment, and transit milestones. For guest orders, enter your order number and email on our dedicated 'Track Order' page.",
    keywords: ["order status", "check order", "progress", "fulfillment", "track order"],
    relatedSlugs: [
      "how-can-i-track-my-order",
      "why-havent-i-received-my-confirmation-email",
      "what-happens-after-i-place-an-order",
    ],
  },
  {
    id: "ord-04",
    category: "orders",
    slug: "can-i-modify-my-order",
    question: "Can I modify my order?",
    answer:
      "Because our atelier begins order allocation promptly, modifications to items or personalization can only be made within 1 hour of placement. Please connect directly with Client Services via phone or live messaging to make immediate adjustments.",
    keywords: ["modify order", "change order", "update item", "edit order"],
    relatedSlugs: [
      "can-i-cancel-my-order",
      "can-i-change-my-delivery-address",
      "can-i-order-by-contacting-client-services",
    ],
  },
  {
    id: "ord-05",
    category: "orders",
    slug: "can-i-cancel-my-order",
    question: "Can I cancel my order?",
    answer:
      "Orders for non-personalised pieces may be cancelled prior to dispatch by reaching out to Client Services. Once a creation has been shipped, it cannot be cancelled in transit but may be returned upon delivery in accordance with our return policy.",
    keywords: ["cancel order", "cancellation", "stop order", "refund"],
    relatedSlugs: [
      "can-i-modify-my-order",
      "why-was-my-order-cancelled",
      "what-is-ovias-return-policy",
    ],
  },
  {
    id: "ord-06",
    category: "orders",
    slug: "why-was-my-order-cancelled",
    question: "Why was my order cancelled?",
    answer:
      "In rare instances, an order may be cancelled if banking authorization fails, if billing details cannot be verified, or if high demand causes an inventory allocation discrepancy. Our Client Concierge will contact you promptly with explanation and priority assistance.",
    keywords: ["order cancelled", "cancellation reason", "payment declined", "security check"],
    relatedSlugs: [
      "can-i-cancel-my-order",
      "how-do-i-place-an-ovia-order",
      "how-can-i-contact-ovia-client-services",
    ],
  },
  {
    id: "ord-07",
    category: "orders",
    slug: "why-havent-i-received-my-confirmation-email",
    question: "Why haven't I received my confirmation email?",
    answer:
      "Order confirmations are dispatched automatically within minutes of successful transaction completion. Please check your junk or promotional folders. If you still do not see it, our Client Advisors can verify your email address and retransmit your confirmation immediately.",
    keywords: ["confirmation email", "missing email", "no email", "receipt email"],
    relatedSlugs: [
      "how-can-i-check-my-order-status",
      "how-do-i-obtain-an-invoice",
      "what-happens-after-i-place-an-order",
    ],
  },
  {
    id: "ord-08",
    category: "orders",
    slug: "how-do-i-obtain-an-invoice",
    question: "How do I obtain an invoice?",
    answer:
      "A formal GST tax invoice is attached as a downloadable PDF in your shipping confirmation email and remains permanently accessible within your online OVIA account profile under 'Order History'.",
    keywords: ["invoice", "tax invoice", "gst", "receipt", "download invoice"],
    relatedSlugs: [
      "why-havent-i-received-my-confirmation-email",
      "how-can-i-check-my-order-status",
    ],
  },
  {
    id: "ord-09",
    category: "orders",
    slug: "can-i-order-by-contacting-client-services",
    question: "Can I order by contacting Client Services?",
    answer:
      "Yes. Our Client Advisors are delighted to process your order via phone or WhatsApp. We will prepare your selection and send a secure, PCI-compliant payment gateway link directly to your SMS or email to complete payment safely.",
    keywords: ["order by phone", "phone order", "whatsapp order", "advisor order", "concierge order"],
    relatedSlugs: [
      "how-do-i-place-an-ovia-order",
      "how-can-i-contact-ovia-client-services",
      "what-happens-after-i-place-an-order",
    ],
  },
  {
    id: "ord-10",
    category: "orders",
    slug: "what-happens-after-i-place-an-order",
    question: "What happens after I place an order?",
    answer:
      "Immediately after confirmation, you receive a transaction receipt. Our master craftspeople review and prepare your selected piece, conducting precision inspection before sealing it in presentation packaging and handing it to our dedicated courier with live tracking.",
    keywords: ["after order", "process", "what next", "fulfillment stages", "timeline"],
    relatedSlugs: [
      "how-can-i-check-my-order-status",
      "how-long-does-delivery-take",
      "how-can-i-track-my-order",
    ],
  },

  // ==========================================
  // 5. PRODUCTS
  // ==========================================
  {
    id: "prod-01",
    category: "products",
    slug: "where-are-ovia-products-designed",
    question: "Where are OVIA products designed?",
    answer:
      "OVIA creations are conceptualized in our European design studio and brought to life in specialized ateliers partnering with generational artisans across Italy, Germany, and India. Every silhouette reflects strict adherence to architectural minimalism, durability, and functional elegance.",
    keywords: ["designed", "manufactured", "provenance", "atelier", "origin", "where made"],
    relatedSlugs: [
      "what-materials-does-ovia-use",
      "how-should-i-care-for-my-ovia-bag",
      "how-can-i-verify-my-registered-ovia-product",
    ],
  },
  {
    id: "prod-02",
    category: "products",
    slug: "what-materials-does-ovia-use",
    question: "What materials does OVIA use?",
    answer:
      "OVIA utilizes aerospace-grade anodized aluminium alloy, high-impact virgin polycarbonate shells, full-grain vegetable-tanned bovine leathers, water-resistant coated technical canvas, and palladium-finish custom hardware engineered to endure decades of motion.",
    keywords: ["materials", "leather", "aluminium", "polycarbonate", "canvas", "hardware"],
    relatedSlugs: [
      "how-should-i-care-for-my-ovia-bag",
      "where-are-ovia-products-designed",
      "how-do-i-clean-my-product",
    ],
  },
  {
    id: "prod-03",
    category: "products",
    slug: "how-should-i-care-for-my-ovia-bag",
    question: "How should I care for my OVIA bag?",
    answer:
      "Shield leather pieces from prolonged direct sun exposure, excessive moisture, and oily substances. When not travelling, store your bag in its breathable OVIA cotton-linen dust bag filled with acid-free tissue paper to maintain silhouette geometry.",
    subtext:
      "For comprehensive care directions customized to your product material, explore our dedicated Care Service section.",
    keywords: ["care", "leather care", "maintenance", "bag care", "preserve"],
    relatedSlugs: [
      "how-should-i-store-my-bag",
      "how-do-i-clean-my-product",
      "what-materials-does-ovia-use",
    ],
  },
  {
    id: "prod-04",
    category: "products",
    slug: "how-should-i-store-my-bag",
    question: "How should I store my bag?",
    answer:
      "Always store bags upright in a cool, ventilated space away from artificial heat sources. Do not hang bags by their handles for prolonged durations. Enclose the creation in its original cotton dust bag and avoid stacking heavier objects on top.",
    keywords: ["store bag", "storage", "closet", "dust bag", "maintain shape"],
    relatedSlugs: [
      "how-should-i-care-for-my-ovia-bag",
      "how-do-i-clean-my-product",
    ],
  },
  {
    id: "prod-05",
    category: "products",
    slug: "how-do-i-clean-my-product",
    question: "How do I clean my product?",
    answer:
      "For leather, gently buff surface dust with a dry, lint-free microfibre cloth. For anodized aluminium or polycarbonate luggage, wipe with a soft cloth lightly dampened with lukewarm water and mild pH-neutral soap. Never use alcohol, chemical solvents, or abrasive pads.",
    keywords: ["clean", "wash", "soap", "leather clean", "luggage clean", "cloth"],
    relatedSlugs: [
      "how-should-i-care-for-my-ovia-bag",
      "how-should-i-store-my-bag",
      "how-can-i-request-a-repair",
    ],
  },
  {
    id: "prod-06",
    category: "products",
    slug: "how-can-i-check-product-availability",
    question: "How can I check product availability?",
    answer:
      "Live availability is indicated on each individual product page. If a desired piece is temporarily marked as 'Unavailable in concept collection', contact our Client Advisors to join the priority private allocation registry.",
    keywords: ["availability", "in stock", "stock level", "inventory", "sold out"],
    relatedSlugs: [
      "will-sold-out-products-return",
      "how-do-i-place-an-ovia-order",
      "can-a-client-advisor-help-me-choose-a-product",
    ],
  },
  {
    id: "prod-07",
    category: "products",
    slug: "will-sold-out-products-return",
    question: "Will sold-out products return?",
    answer:
      "Core travel silhouettes in our permanent collection are restocked on a rolling basis following atelier crafting cycles. Limited seasonal editions or collaborative collections may not be reissued once their numbered edition run concludes.",
    keywords: ["sold out", "restock", "waitlist", "edition", "back in stock"],
    relatedSlugs: [
      "how-can-i-check-product-availability",
      "can-a-client-advisor-help-me-choose-a-product",
    ],
  },
  {
    id: "prod-08",
    category: "products",
    slug: "how-do-i-choose-the-correct-size",
    question: "How do I choose the correct size?",
    answer:
      "Consult our interactive Size & Dimension Guide on each product detail page, which compares cabin overhead allowances for major international airlines with exact volumetric liter capacities and tare weights.",
    keywords: ["size", "dimensions", "cabin size", "carry on", "luggage size", "capacity"],
    relatedSlugs: [
      "what-materials-does-ovia-use",
      "can-a-client-advisor-help-me-choose-a-product",
    ],
  },
  {
    id: "prod-09",
    category: "products",
    slug: "can-ovia-products-be-personalised",
    question: "Can OVIA products be personalised?",
    answer:
      "Yes. Most OVIA luggage pieces, leather bags, and travel accessories accommodate custom initials, blind leather debossing, metallic foil stamping, or bespoke luggage tag engraving.",
    keywords: ["personalised", "custom initials", "monogram", "emboss", "engraving"],
    relatedSlugs: [
      "how-does-ovia-personalisation-work",
      "can-personalised-products-be-returned",
      "how-do-i-request-personalisation",
    ],
  },
  {
    id: "prod-10",
    category: "products",
    slug: "how-does-ovia-personalisation-work",
    question: "How does OVIA personalisation work?",
    answer:
      "When personalising online, preview your chosen initials, typeface, and foil tone in real time. Our artisans then hand-stamp the motif using heated brass typography plates in our atelier, ensuring crisp depth and lasting clarity.",
    keywords: ["personalisation process", "foil stamp", "monogram method", "how personalisation works"],
    relatedSlugs: [
      "can-ovia-products-be-personalised",
      "can-personalised-products-be-returned",
      "how-do-i-request-personalisation",
    ],
  },
  {
    id: "prod-11",
    category: "products",
    slug: "how-can-i-verify-my-registered-ovia-product",
    question: "How can I verify my registered OVIA product?",
    answer:
      "Every genuine OVIA piece features a unique laser-engraved serial code on its internal frame or leather badge. Enter this code under 'Register Product' in your OVIA account to activate your extended craftsmanship guarantee and verify provenance.",
    keywords: ["verify", "serial number", "registration", "authenticity", "guarantee", "code"],
    relatedSlugs: [
      "how-do-i-register-an-ovia-product",
      "where-are-ovia-products-designed",
      "how-can-i-request-a-repair",
    ],
  },

  // ==========================================
  // 6. SERVICES
  // ==========================================
  {
    id: "srv-01",
    category: "services",
    slug: "how-can-i-contact-ovia-client-services",
    question: "How can I contact OVIA Client Services?",
    answer:
      "OVIA Client Advisors are available Monday through Saturday from 10:00 AM to 7:00 PM and Sunday from 10:00 AM to 5:00 PM IST via toll-free phone (+91 1800 103 9988), dedicated WhatsApp concierge, Apple Messages, or email at clientcare@ovia.com.",
    keywords: ["contact", "phone", "hours", "email", "whatsapp", "customer care"],
    relatedSlugs: [
      "how-do-i-book-an-appointment",
      "can-a-client-advisor-help-me-choose-a-product",
      "how-can-i-request-a-repair",
    ],
  },
  {
    id: "srv-02",
    category: "services",
    slug: "how-can-i-request-a-repair",
    question: "How can I request a repair?",
    answer:
      "To request professional assessment for an OVIA piece, visit our online 'Care & Repair' portal or contact Client Services. You can upload photos of the area requiring attention and an Advisor will evaluate service options, replacement components, and transit instructions.",
    subtext:
      "Every piece is evaluated on a case-by-case basis by our master craftsmen.",
    keywords: ["repair", "fix", "wheels", "handle", "zipper", "service", "restoration"],
    relatedSlugs: [
      "does-ovia-provide-product-care-assistance",
      "how-do-i-register-an-ovia-product",
      "how-can-i-contact-ovia-client-services",
    ],
  },
  {
    id: "srv-03",
    category: "services",
    slug: "how-do-i-book-an-appointment",
    question: "How do I book an appointment?",
    answer:
      "You can reserve a private 1-on-1 boutique consultation or virtual appointment through our 'Book an Appointment' portal or by calling Client Services. An Advisor will prepare private lounge selections tailored to your itinerary.",
    keywords: ["appointment", "booking", "consultation", "private viewing", "lounge"],
    relatedSlugs: [
      "how-can-i-find-an-ovia-location",
      "can-a-client-advisor-help-me-choose-a-product",
      "how-can-i-contact-ovia-client-services",
    ],
  },
  {
    id: "srv-04",
    category: "services",
    slug: "how-can-i-find-an-ovia-location",
    question: "How can I find an OVIA location?",
    answer:
      "Locate official OVIA Maisons and authorized partner lounges via our 'Store Locator'. Current flagships are welcoming guests in Mumbai (Jio World Plaza), New Delhi (DLF Emporio), and Bengaluru (UB City).",
    keywords: ["location", "stores", "boutiques", "mumbai", "delhi", "bengaluru", "flagship"],
    relatedSlugs: [
      "how-do-i-book-an-appointment",
      "how-can-i-contact-ovia-client-services",
    ],
  },
  {
    id: "srv-05",
    category: "services",
    slug: "does-ovia-provide-product-care-assistance",
    question: "Does OVIA provide product-care assistance?",
    answer:
      "Yes. OVIA offers dedicated care guidance for all our leather silhouettes, travel luggage, and accessories. You can bring pieces to any Maison for routine wheel inspections, hardware tightening, and leather conditioning advice.",
    keywords: ["care assistance", "cleaning service", "inspection", "conditioning"],
    relatedSlugs: [
      "how-can-i-request-a-repair",
      "how-should-i-care-for-my-ovia-bag",
      "how-do-i-clean-my-product",
    ],
  },
  {
    id: "srv-06",
    category: "services",
    slug: "can-a-client-advisor-help-me-choose-a-product",
    question: "Can a Client Advisor help me choose a product?",
    answer:
      "Certainly. Whether you require guidance on luggage cabin allowances for international routes, styling a leather tote, or curating gifts for corporate milestones, our Advisors offer personalized curations via chat, call, or private appointment.",
    keywords: ["choose product", "product advice", "advisor", "styling", "personal shopper"],
    relatedSlugs: [
      "can-ovia-help-me-choose-a-gift",
      "how-do-i-choose-the-correct-size",
      "how-do-i-book-an-appointment",
    ],
  },
  {
    id: "srv-07",
    category: "services",
    slug: "how-do-i-register-an-ovia-product",
    question: "How do I register an OVIA product?",
    answer:
      "To register your acquisition, log in to your OVIA account and select 'Register My Product'. Enter your piece's serial code and upload your purchase invoice to ensure priority repair service and lifetime craftsmanship documentation.",
    keywords: ["register product", "warranty registration", "product registration", "serial number"],
    relatedSlugs: [
      "how-can-i-verify-my-registered-ovia-product",
      "how-can-i-request-a-repair",
    ],
  },
  {
    id: "srv-08",
    category: "services",
    slug: "how-do-i-request-personalisation",
    question: "How do I request personalisation?",
    answer:
      "Personalisation can be requested during online order placement or arranged post-purchase by bringing your item to any OVIA Maison. Our Advisors will guide you through typography styles, blind embossing, or hand-painted initials.",
    keywords: ["request personalisation", "post purchase monogram", "custom initials", "embossing"],
    relatedSlugs: [
      "can-ovia-products-be-personalised",
      "how-does-ovia-personalisation-work",
      "how-can-i-find-an-ovia-location",
    ],
  },
];

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

export function getAllCategories(): FaqCategory[] {
  return FAQ_CATEGORIES;
}

export function getCategoryMeta(categorySlug: string): FaqCategory | undefined {
  return FAQ_CATEGORIES.find((cat) => cat.slug === categorySlug);
}

export function getAllFaqs(): FaqItem[] {
  return FAQ_ITEMS;
}

export function getFaqsByCategory(categorySlug: string): FaqItem[] {
  return FAQ_ITEMS.filter((item) => item.category === categorySlug);
}

export function getFaqBySlug(
  categorySlug: string,
  questionSlug: string
): FaqItem | undefined {
  return FAQ_ITEMS.find(
    (item) => item.category === categorySlug && item.slug === questionSlug
  );
}

export function getRelatedFaqs(item: FaqItem, limit: number = 4): FaqItem[] {
  const explicit = FAQ_ITEMS.filter((x) =>
    item.relatedSlugs.includes(x.slug)
  );
  if (explicit.length >= limit) return explicit.slice(0, limit);

  const sameCategory = FAQ_ITEMS.filter(
    (x) => x.category === item.category && x.slug !== item.slug && !item.relatedSlugs.includes(x.slug)
  );

  return [...explicit, ...sameCategory].slice(0, limit);
}

export function searchFaqs(query: string): FaqItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const tokens = clean.split(/\s+/).filter(Boolean);

  return FAQ_ITEMS.map((item) => {
    let score = 0;
    const qLower = item.question.toLowerCase();
    const aLower = item.answer.toLowerCase();

    // Exact question match has highest score
    if (qLower.includes(clean)) score += 50;
    if (item.slug.includes(clean)) score += 30;

    // Check token matches
    for (const token of tokens) {
      if (qLower.includes(token)) score += 20;
      if (item.keywords.some((k) => k.toLowerCase().includes(token))) score += 15;
      if (aLower.includes(token)) score += 5;
    }

    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
