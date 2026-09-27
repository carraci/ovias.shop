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
  aliases?: string[];
  question: string;
  answer: string;
  subtext?: string;
  keywords: string[];
  relatedSlugs: string[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    slug: "delivery",
    name: "ORDERS & DELIVERY",
    shortDescription: "Where we deliver, tracking, timelines and address changes.",
    heroDescription:
      "Everything you need to know about receiving your OVIA order with care and security.",
  },
  {
    slug: "exchange-returns",
    name: "RETURNS & REFUNDS",
    shortDescription: "Return policy, exchanges, refunds and damaged items.",
    heroDescription:
      "Guidelines on complimentary returns, exchanges, and ensuring your satisfaction.",
  },
  {
    slug: "products",
    name: "PRODUCT CARE & PERSONALISATION",
    shortDescription: "Bag care, storage, home cleaning and custom personalisation.",
    heroDescription:
      "Preserving craftsmanship, care methods, and bespoke personalisation.",
  },
  {
    slug: "services",
    name: "REPAIRS & WARRANTY",
    shortDescription: "Requesting repairs, aftercare, warranty and support.",
    heroDescription:
      "Dedicated client aftercare, atelier repairs, and warranty guidance.",
  },
  {
    slug: "orders",
    name: "ACCOUNT & PAYMENTS",
    shortDescription: "OVIA accounts, password recovery, secure checkout and payment methods.",
    heroDescription:
      "Managing your account, password security, and verified payment infrastructure.",
  },
  {
    slug: "gifting",
    name: "GIFTING SERVICES",
    shortDescription: "Signature gift packaging, personal messages and recipient exchanges.",
    heroDescription:
      "Bespoke packaging, personalized sentiments, and considered gifting services.",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  // ==========================================
  // 1. ORDERS & DELIVERY
  // ==========================================
  {
    id: "del-01",
    category: "delivery",
    slug: "where-does-ovia-deliver",
    question: "Where does OVIA deliver?",
    answer: `OVIA currently delivers across India to eligible serviceable PIN codes.

When placing an order, enter your complete shipping address and PIN code during checkout. Our system will confirm whether delivery is available to your location and provide an estimated delivery timeline where applicable.

We carefully prepare every OVIA order before it leaves our facility. Your piece is inspected, securely packaged, and handed over to our trusted delivery partner.

### Before placing your order

Please make sure your delivery information is accurate, including:

* Full name
* Complete delivery address
* City and state
* PIN code
* Valid mobile number
* Email address

An incorrect or incomplete address may result in delivery delays or an unsuccessful delivery attempt.

### How long does delivery take?

Delivery times depend on your location, product availability, order processing time, and courier service.

The estimated delivery timeline will be displayed during checkout or communicated in your order confirmation.

Certain locations, remote areas, or periods of exceptionally high demand may require additional delivery time.

### Does OVIA offer international delivery?

International delivery availability may vary by destination.

If you are interested in purchasing an OVIA product from outside India, please contact our Customer Care team before placing your order. We can confirm current availability and provide information regarding international shipping requirements.`,
    keywords: [
      "where does ovia deliver",
      "delivery",
      "shipping",
      "india",
      "pin codes",
      "serviceable",
      "international delivery",
      "coverage",
      "timeline",
      "locations",
    ],
    relatedSlugs: [
      "how-can-i-track-my-order",
      "can-i-change-my-delivery-address",
      "what-happens-if-i-am-not-available-when-my-order-arrives",
    ],
  },
  {
    id: "del-02",
    category: "delivery",
    slug: "how-can-i-track-my-order",
    aliases: ["how-can-i-track-my-ovia-order"],
    question: "How can I track my order?",
    answer: `Once your order has been dispatched, you will receive a **shipping confirmation email** containing your tracking information.

You can also check your order status through your OVIA account:

**Sign In → My Account → My Orders → Select Your Order → Track Order**

Your order may move through the following stages:

* **Order Confirmed**: Your order has been successfully received.
* **Processing**: Your OVIA piece is being prepared for dispatch.
* **Packed**: Your order has been carefully packaged.
* **Dispatched**: Your package has been handed to the delivery partner.
* **In Transit**: Your package is travelling to your delivery address.
* **Out for Delivery**: Your package is with the delivery partner and is expected to arrive soon.
* **Delivered**: Your order has been successfully delivered.

### My tracking information has not updated. What should I do?

After an order is dispatched, it may take some time for the courier's tracking system to register the first scan.

If your tracking information has not changed for an extended period, or if your shipment appears to be delayed, please contact OVIA Customer Care with your order number.

Our team will review the shipment status and assist you with the next steps.`,
    keywords: [
      "how can i track my order",
      "how can i track my ovia order",
      "tracking",
      "order status",
      "awb",
      "dispatched",
      "in transit",
      "out for delivery",
      "delivered",
      "shipping confirmation",
    ],
    relatedSlugs: [
      "where-does-ovia-deliver",
      "can-i-change-my-delivery-address",
      "what-happens-if-i-am-not-available-when-my-order-arrives",
    ],
  },
  {
    id: "del-03",
    category: "delivery",
    slug: "can-i-change-my-delivery-address",
    aliases: ["can-i-change-my-delivery-address-after-placing-an-order"],
    question: "Can I change my delivery address after placing an order?",
    answer: `If you need to change your delivery address, please contact OVIA Customer Care as soon as possible.

We will try to accommodate the request if your order has not yet been processed or dispatched. Once an order has entered the shipping process, changes to the delivery address may no longer be possible.

For this reason, we recommend carefully checking your address before completing your purchase.`,
    keywords: [
      "change delivery address",
      "change address",
      "modify address",
      "shipping address",
      "update address",
      "wrong address",
      "reroute",
    ],
    relatedSlugs: [
      "where-does-ovia-deliver",
      "how-can-i-track-my-order",
      "what-happens-if-i-am-not-available-when-my-order-arrives",
    ],
  },
  {
    id: "del-04",
    category: "delivery",
    slug: "what-happens-if-i-am-not-available-when-my-order-arrives",
    aliases: ["what-happens-if-i-miss-my-delivery"],
    question: "What happens if I am not available when my order arrives?",
    answer: `Our delivery partner may attempt delivery according to its standard delivery process.

If you are unavailable, another delivery attempt may be made or the courier may contact you using the phone number provided with your order.

Please ensure that your contact details are correct and that someone is available to receive the package when possible.`,
    keywords: [
      "not available",
      "missed delivery",
      "delivery attempt",
      "courier attempt",
      "reattempt",
      "receive package",
      "signature",
    ],
    relatedSlugs: [
      "where-does-ovia-deliver",
      "how-can-i-track-my-order",
      "can-i-change-my-delivery-address",
    ],
  },

  // ==========================================
  // 2. RETURNS & REFUNDS
  // ==========================================
  {
    id: "ret-01",
    category: "exchange-returns",
    slug: "what-is-ovias-return-policy",
    question: "What is OVIA's return policy?",
    answer: `We want every OVIA purchase to feel considered and confident.

Eligible products may be returned within the applicable return period, subject to the conditions outlined in our **Return & Refund Policy**.

To be eligible for a return, the product should generally be:

* Unused and unworn
* In its original condition
* Free from marks, stains, scratches, or damage
* Returned with original tags
* Returned with its original packaging
* Accompanied by applicable accessories and documentation

Products that show signs of use or damage may not qualify for a return.

Because return eligibility can differ between products and collections, please review the applicable return terms before initiating your return.`,
    keywords: [
      "what is ovias return policy",
      "return policy",
      "returns",
      "refunds",
      "conditions",
      "eligibility",
      "original condition",
      "tags",
      "packaging",
    ],
    relatedSlugs: [
      "how-do-i-request-a-return",
      "can-i-exchange-my-ovia-bag",
      "when-will-i-receive-my-refund",
      "are-personalised-ovia-products-eligible-for-return",
    ],
  },
  {
    id: "ret-02",
    category: "exchange-returns",
    slug: "how-do-i-request-a-return",
    aliases: ["how-do-i-return-an-online-order"],
    question: "How do I request a return?",
    answer: `If your purchase is eligible for return, contact OVIA Customer Care or use the return option available through your account, where applicable.

Please provide your order number and the reason for the return.

Our team may request photographs or additional information to verify the condition of the product before approving the return.

Once your return request has been approved, you will receive instructions regarding the return process.

Please package the product carefully. OVIA cannot be responsible for damage caused by inadequate packaging during a customer-arranged return.`,
    keywords: [
      "how do i request a return",
      "how do i return an online order",
      "request return",
      "return instructions",
      "package product",
      "order number",
    ],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "can-i-exchange-my-ovia-bag",
      "when-will-i-receive-my-refund",
      "what-if-my-order-arrives-damaged-or-incorrect",
    ],
  },
  {
    id: "ret-03",
    category: "exchange-returns",
    slug: "can-i-exchange-my-ovia-bag",
    aliases: ["how-do-i-exchange-an-item"],
    question: "Can I exchange my OVIA bag?",
    answer: `Exchange availability depends on the product, reason for exchange, inventory, and applicable return conditions.

If an exchange is available, our Customer Care team will explain the available options and process.

If the requested replacement is unavailable, an alternative resolution may be offered according to the applicable policy.`,
    keywords: [
      "can i exchange my ovia bag",
      "exchange",
      "swap",
      "replacement",
      "different size",
      "different colour",
      "inventory",
    ],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "how-do-i-request-a-return",
      "when-will-i-receive-my-refund",
    ],
  },
  {
    id: "ret-04",
    category: "exchange-returns",
    slug: "when-will-i-receive-my-refund",
    question: "When will I receive my refund?",
    answer: `Once your returned product has been received and inspected, the refund process will begin if the return meets the applicable conditions.

The time required for the refund to appear in your original payment method can vary depending on the payment provider, bank, or financial institution.

You will receive confirmation once the refund has been processed by OVIA.`,
    keywords: [
      "when will i receive my refund",
      "refund timing",
      "refund process",
      "payment provider",
      "bank refund",
      "confirmation",
    ],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "how-do-i-request-a-return",
      "what-payment-methods-does-ovia-accept",
    ],
  },
  {
    id: "ret-05",
    category: "exchange-returns",
    slug: "are-personalised-ovia-products-eligible-for-return",
    aliases: ["can-personalised-products-be-returned"],
    question: "Are personalised OVIA products eligible for return?",
    answer: `Personalised products are created specifically for you and may therefore be **non-returnable and non-exchangeable**.

This may include products customised with names, initials, monograms, or other personalisation selected by the customer.

An exception may apply if the product arrives damaged, defective, or has been personalised incorrectly due to an OVIA processing error.

Please carefully review your personalisation details before completing your purchase.`,
    keywords: [
      "are personalised ovia products eligible for return",
      "can personalised products be returned",
      "monogram return",
      "custom return",
      "non-returnable",
      "non-exchangeable",
      "final sale",
    ],
    relatedSlugs: [
      "can-ovia-products-be-personalised",
      "what-is-ovias-return-policy",
      "what-if-my-order-arrives-damaged-or-incorrect",
    ],
  },
  {
    id: "ret-06",
    category: "exchange-returns",
    slug: "what-if-my-order-arrives-damaged-or-incorrect",
    aliases: [
      "what-should-i-do-if-my-product-arrives-damaged",
      "what-should-i-do-if-my-parcel-arrives-damaged",
    ],
    question: "What if my order arrives damaged or incorrect?",
    answer: `If your OVIA order arrives damaged, defective, or different from what you ordered, please contact Customer Care as soon as possible.

To help us resolve the issue efficiently, please provide:

* Your order number
* A description of the issue
* Photographs of the product
* Photographs of the packaging, where relevant
* Any other information requested by our Customer Care team

Our team will review the information and guide you through the appropriate resolution.`,
    keywords: [
      "what if my order arrives damaged or incorrect",
      "damaged",
      "defective",
      "incorrect order",
      "wrong item",
      "photographs",
      "order issue",
    ],
    relatedSlugs: [
      "what-is-ovias-return-policy",
      "how-do-i-request-a-return",
      "how-can-i-request-a-repair",
    ],
  },

  // ==========================================
  // 3. PRODUCT CARE
  // ==========================================
  {
    id: "prod-01",
    category: "products",
    slug: "how-should-i-care-for-my-ovia-bag",
    question: "How should I care for my OVIA bag?",
    answer: `Your OVIA bag is designed to accompany you through everyday moments and journeys. Thoughtful care can help preserve its material, shape, hardware, colour, and finish over time.

The correct care method depends on the specific material used in your product, so always refer to the care instructions supplied with your bag.

### Protect your bag from moisture

Avoid prolonged exposure to water, rain, humidity, and other sources of moisture.

If your bag becomes wet, gently remove excess moisture and allow it to dry naturally in a well-ventilated area.

Do not use direct heat, hair dryers, radiators, or other high-temperature sources to speed up drying.

### Keep your bag away from cosmetics and chemicals

Perfume, makeup, oils, alcohol-based products, cleaning chemicals, inks, and other substances can stain or alter certain materials.

We recommend allowing perfumes, lotions, and other products to dry completely before carrying your OVIA bag.

### Avoid overfilling

Every bag has been designed with a particular structure and capacity.

Overfilling can place unnecessary pressure on:

* Handles
* Shoulder straps
* Stitching
* Zippers
* Closures
* Internal compartments
* The overall shape of the bag

Carry only what the bag is designed to accommodate.`,
    keywords: [
      "how should i care for my ovia bag",
      "bag care",
      "leather care",
      "maintenance",
      "protect from moisture",
      "water damage",
      "cosmetics",
      "chemicals",
      "overfilling",
      "preserve",
    ],
    relatedSlugs: [
      "how-should-i-store-my-ovia-bag",
      "can-i-clean-my-ovia-bag-at-home",
      "how-can-i-request-a-repair",
    ],
  },
  {
    id: "prod-02",
    category: "products",
    slug: "how-should-i-store-my-ovia-bag",
    aliases: ["how-should-i-store-my-bag"],
    question: "How should I store my OVIA bag?",
    answer: `When your bag is not in use, store it carefully in its original **OVIA dust bag**, where provided.

Keep the bag in a cool, dry, well-ventilated location away from prolonged direct sunlight.

To help maintain the shape of structured bags, you may lightly fill the interior with clean, suitable tissue paper.

Avoid storing heavy items inside the bag for long periods and do not place other heavy objects on top of it.`,
    keywords: [
      "how should i store my ovia bag",
      "how should i store my bag",
      "storage",
      "dust bag",
      "maintain shape",
      "tissue paper",
      "direct sunlight",
      "closet",
    ],
    relatedSlugs: [
      "how-should-i-care-for-my-ovia-bag",
      "can-i-clean-my-ovia-bag-at-home",
      "how-can-i-request-a-repair",
    ],
  },
  {
    id: "prod-03",
    category: "products",
    slug: "can-i-clean-my-ovia-bag-at-home",
    aliases: ["how-do-i-clean-my-product"],
    question: "Can I clean my OVIA bag at home?",
    answer: `Cleaning instructions vary according to the material and construction of each OVIA product.

For minor surface marks, follow the care instructions provided with your product.

Avoid household detergents, bleach, solvents, abrasive materials, and unapproved cleaning products unless specifically recommended for the material.

If you are unsure how to treat a mark or stain, contact OVIA Customer Care before attempting extensive cleaning.

For delicate materials or significant stains, professional care may be recommended.`,
    keywords: [
      "can i clean my ovia bag at home",
      "how do i clean my product",
      "clean bag",
      "cleaning",
      "stains",
      "surface marks",
      "detergents",
      "professional care",
    ],
    relatedSlugs: [
      "how-should-i-care-for-my-ovia-bag",
      "how-should-i-store-my-ovia-bag",
      "how-can-i-request-a-repair",
    ],
  },

  // ==========================================
  // 4. PERSONALISATION
  // ==========================================
  {
    id: "prod-04",
    category: "products",
    slug: "can-ovia-products-be-personalised",
    question: "Can OVIA products be personalised?",
    answer: `Selected OVIA products may be available for personalisation.

Personalisation is designed to give certain pieces a more individual character and can be particularly meaningful when purchasing a bag as a gift or creating a personal signature piece.

Available personalisation options depend on the product and collection.

Where personalisation is available, the available options will be shown on the relevant product page before checkout.`,
    keywords: [
      "can ovia products be personalised",
      "personalisation",
      "monogram",
      "initials",
      "custom initials",
      "custom bag",
      "gift personalisation",
    ],
    relatedSlugs: [
      "how-long-does-personalisation-take",
      "can-i-change-my-personalisation-after-placing-an-order",
      "are-personalised-ovia-products-eligible-for-return",
    ],
  },
  {
    id: "prod-05",
    category: "products",
    slug: "how-long-does-personalisation-take",
    aliases: ["how-does-ovia-personalisation-work"],
    question: "How long does personalisation take?",
    answer: `Personalised orders may require additional preparation time because each piece is processed specifically according to your selected personalisation.

The estimated processing or delivery timeline will be communicated during the purchase process where applicable.`,
    keywords: [
      "how long does personalisation take",
      "personalisation timeline",
      "processing time",
      "lead time",
      "custom delivery time",
    ],
    relatedSlugs: [
      "can-ovia-products-be-personalised",
      "can-i-change-my-personalisation-after-placing-an-order",
      "where-does-ovia-deliver",
    ],
  },
  {
    id: "prod-06",
    category: "products",
    slug: "can-i-change-my-personalisation-after-placing-an-order",
    question: "Can I change my personalisation after placing an order?",
    answer: `If you need to correct or change your personalisation details, contact OVIA Customer Care as quickly as possible.

Changes may only be possible before personalisation has begun.

Once a personalised item has entered production or preparation, changes may no longer be possible.

Please carefully check spelling, initials, characters, and other personalisation details before confirming your order.`,
    keywords: [
      "can i change my personalisation after placing an order",
      "change personalisation",
      "correct monogram",
      "spelling error",
      "modify initials",
    ],
    relatedSlugs: [
      "can-ovia-products-be-personalised",
      "how-long-does-personalisation-take",
      "can-i-change-my-delivery-address",
    ],
  },

  // ==========================================
  // 5. REPAIRS & AFTERCARE
  // ==========================================
  {
    id: "srv-01",
    category: "services",
    slug: "how-can-i-request-a-repair",
    question: "How can I request a repair?",
    answer: `We understand that your favourite OVIA piece may become part of your everyday life.

If your bag requires attention, our Customer Care team can help determine whether a repair or aftercare service is available.

To request a repair, please contact OVIA Customer Care and provide:

* Order number or proof of purchase
* Product name or product information
* Description of the issue
* Clear photographs of the affected area
* Your contact details

Our team will review the request and explain the next steps.`,
    keywords: [
      "how can i request a repair",
      "request repair",
      "repair",
      "aftercare",
      "fix",
      "proof of purchase",
      "photographs",
      "customer care",
    ],
    relatedSlugs: [
      "what-types-of-repairs-does-ovia-offer",
      "can-i-repair-my-ovia-bag-myself",
      "does-ovia-offer-a-warranty",
    ],
  },
  {
    id: "srv-02",
    category: "services",
    slug: "what-types-of-repairs-does-ovia-offer",
    question: "What types of repairs does OVIA offer?",
    answer: `Repair availability depends on the product and the nature of the issue.

Depending on the circumstances, repair assessment may cover areas such as hardware, stitching, straps, closures, or other components.

Not every type of damage can be repaired, and the availability of replacement components may vary.

Some repairs may be covered under an applicable warranty, while others may be chargeable.

We will provide the relevant information before proceeding with a chargeable repair.`,
    keywords: [
      "what types of repairs does ovia offer",
      "repairs offered",
      "hardware",
      "stitching",
      "straps",
      "closures",
      "replacement components",
      "warranty repair",
    ],
    relatedSlugs: [
      "how-can-i-request-a-repair",
      "can-i-repair-my-ovia-bag-myself",
      "does-ovia-offer-a-warranty",
    ],
  },
  {
    id: "srv-03",
    category: "services",
    slug: "can-i-repair-my-ovia-bag-myself",
    question: "Can I repair my OVIA bag myself?",
    answer: `We recommend contacting OVIA Customer Care before attempting a repair yourself.

Using adhesives, dyes, chemicals, household cleaners, or unsuitable replacement parts can permanently affect the material and may make professional repair or restoration more difficult.

For the best result, allow our team to assess the product and recommend the appropriate solution.`,
    keywords: [
      "can i repair my ovia bag myself",
      "diy repair",
      "self repair",
      "adhesives",
      "dyes",
      "restoration",
      "professional repair",
    ],
    relatedSlugs: [
      "how-can-i-request-a-repair",
      "what-types-of-repairs-does-ovia-offer",
      "how-should-i-care-for-my-ovia-bag",
    ],
  },

  // ==========================================
  // 6. WARRANTY & PRODUCT SUPPORT
  // ==========================================
  {
    id: "srv-04",
    category: "services",
    slug: "does-ovia-offer-a-warranty",
    question: "Does OVIA offer a warranty?",
    answer: `Warranty coverage, where applicable, depends on the specific product and the terms provided at the time of purchase.

If you believe your product has a manufacturing defect or requires warranty assistance, contact OVIA Customer Care with your order information and photographs of the issue.

Our team will assess the concern and explain the applicable warranty or service options.

Normal wear and tear, accidental damage, misuse, improper care, or damage caused by unauthorised alterations may not be covered.

Please refer to the applicable **Warranty & Product Support Policy** for complete terms.`,
    keywords: [
      "does ovia offer a warranty",
      "warranty",
      "guarantee",
      "manufacturing defect",
      "product support",
      "terms",
      "wear and tear",
    ],
    relatedSlugs: [
      "how-can-i-request-a-repair",
      "what-types-of-repairs-does-ovia-offer",
      "can-i-repair-my-ovia-bag-myself",
    ],
  },

  // ==========================================
  // 7. ACCOUNT & ORDERS
  // ==========================================
  {
    id: "ord-01",
    category: "orders",
    slug: "do-i-need-an-ovia-account-to-place-an-order",
    question: "Do I need an OVIA account to place an order?",
    answer: `An OVIA account may provide a more convenient shopping experience, allowing you to access features such as order history, saved information, and order tracking.

If guest checkout is available, you may also be able to place an order without creating an account.

Creating an account is recommended if you would like to keep your OVIA purchases organised in one place.`,
    keywords: [
      "do i need an ovia account to place an order",
      "account",
      "guest checkout",
      "create account",
      "order tracking",
      "order history",
    ],
    relatedSlugs: [
      "i-forgot-my-ovia-password-what-should-i-do",
      "how-can-i-track-my-order",
      "is-shopping-on-ovia-secure",
    ],
  },
  {
    id: "ord-02",
    category: "orders",
    slug: "i-forgot-my-ovia-password-what-should-i-do",
    question: "I forgot my OVIA password. What should I do?",
    answer: `Select **Forgot Password** on the OVIA sign-in page and enter the email address associated with your account.

Follow the verification instructions provided to securely create a new password.

For security reasons, never share your password or verification code with another person.

If you are unable to access your account, contact OVIA Customer Care for assistance.`,
    keywords: [
      "i forgot my ovia password what should i do",
      "forgot password",
      "reset password",
      "password help",
      "verification code",
      "account recovery",
    ],
    relatedSlugs: [
      "do-i-need-an-ovia-account-to-place-an-order",
      "is-shopping-on-ovia-secure",
    ],
  },

  // ==========================================
  // 8. PAYMENTS & SECURITY
  // ==========================================
  {
    id: "ord-03",
    category: "orders",
    slug: "is-shopping-on-ovia-secure",
    question: "Is shopping on OVIA secure?",
    answer: `OVIA takes reasonable measures to protect customer account and order information.

Payment transactions are processed through the payment methods and secure payment infrastructure available at checkout.

For your protection, never share your account password, payment details, or one-time verification codes with anyone claiming to represent OVIA.`,
    keywords: [
      "is shopping on ovia secure",
      "security",
      "safe payment",
      "data protection",
      "secure checkout",
      "encryption",
    ],
    relatedSlugs: [
      "what-payment-methods-does-ovia-accept",
      "do-i-need-an-ovia-account-to-place-an-order",
      "i-forgot-my-ovia-password-what-should-i-do",
    ],
  },
  {
    id: "ord-04",
    category: "orders",
    slug: "what-payment-methods-does-ovia-accept",
    question: "What payment methods does OVIA accept?",
    answer: `Available payment methods are displayed during checkout and may vary depending on your location, order, and payment provider.

If a particular payment option is unavailable, another supported payment method may be selected at checkout.`,
    keywords: [
      "what payment methods does ovia accept",
      "payment methods",
      "credit card",
      "debit card",
      "upi",
      "net banking",
      "checkout options",
    ],
    relatedSlugs: [
      "is-shopping-on-ovia-secure",
      "when-will-i-receive-my-refund",
      "what-is-ovias-return-policy",
    ],
  },

  // ==========================================
  // 9. GIFTING
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
      "can-i-include-a-personal-gift-message",
      "will-prices-appear-inside-the-gift-package",
      "can-i-send-a-gift-directly-to-someone",
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
      "can-i-exchange-my-ovia-bag",
      "what-is-ovias-return-policy",
      "will-prices-appear-inside-the-gift-package",
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
    (item) =>
      item.category === categorySlug &&
      (item.slug === questionSlug || item.aliases?.includes(questionSlug))
  );
}

export function getRelatedFaqs(item: FaqItem, limit: number = 4): FaqItem[] {
  const explicit = FAQ_ITEMS.filter((x) =>
    item.relatedSlugs?.includes(x.slug)
  );
  if (explicit.length >= limit) return explicit.slice(0, limit);

  const sameCategory = FAQ_ITEMS.filter(
    (x) =>
      x.category === item.category &&
      x.slug !== item.slug &&
      !item.relatedSlugs?.includes(x.slug)
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
    if (item.aliases?.some((a) => a.includes(clean))) score += 25;

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
