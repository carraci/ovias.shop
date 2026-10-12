export type HelpQuestion = { id: string; question: string; answer: string };
export type HelpTopic = {
  id: string;
  title: string;
  questions: HelpQuestion[];
};

// Customer-provided FAQ copy, checked against the current account and checkout flows.
export const helpTopics: HelpTopic[] = [
  {
    id: "shopping-and-products",
    title: "Shopping & Products",
    questions: [
      {
        question: "How do I find a product?",
        answer:
          "Use the search bar at the top of the OVIA website to search by product name, category or relevant keyword. You can also browse directly through Bags, Luggage and All Products.",
        id: "shopping-and-products-how-do-i-find-a-product",
      },
      {
        question: "How do I browse Bags?",
        answer:
          "Select Bags from the main navigation. You can browse available bag collections and narrow the products using the available categories and filters.",
        id: "shopping-and-products-how-do-i-browse-bags",
      },
      {
        question: "How do I browse Luggage?",
        answer:
          "Select Luggage from the main navigation. OVIA luggage is organized into categories such as Cabin, Check-In and Trunks to make it easier to find the right size for your trip.",
        id: "shopping-and-products-how-do-i-browse-luggage",
      },
      {
        question: "How do I search for a specific product?",
        answer:
          "Enter the product name or relevant keywords into the search bar. Matching products will appear in the search results.",
        id: "shopping-and-products-how-do-i-search-for-a-specific-product",
      },
      {
        question: "How can I filter products?",
        answer:
          "Use the filters available on product listing pages, including category, sub-category, colour, material and collection. Available filters vary by collection.",
        id: "shopping-and-products-how-can-i-filter-products",
      },
      {
        question: "How can I sort products?",
        answer:
          "Use the Sort by control on a product listing page and choose one of the options shown there.",
        id: "shopping-and-products-how-can-i-sort-products",
      },
      {
        question: "How do I know whether a product is available?",
        answer:
          "The product page displays its current availability.\n\nIn Stock means the product is currently available to order.\n\nLow Stock means only a limited quantity remains.\n\nOut of Stock means the product is currently unavailable for purchase.",
        id: "shopping-and-products-how-do-i-know-whether-a-product-is-available",
      },
      {
        question:
          "Can different colours of the same product have different stock?",
        answer:
          "Yes. Product variants are managed separately, so one colour or size may be available while another is out of stock.",
        id: "shopping-and-products-can-different-colours-of-the-same-product-have-different-stock",
      },
      {
        question: "Does adding an item to my bag reserve it?",
        answer:
          "No. Adding an item to your shopping bag does not permanently reserve stock. Availability is confirmed when your order is successfully placed.",
        id: "shopping-and-products-does-adding-an-item-to-my-bag-reserve-it",
      },
    ],
  },
  {
    id: "bags",
    title: "Bags",
    questions: [
      {
        question: "What types of bags does OVIA offer?",
        answer:
          "OVIA offers bags designed for travel, business and everyday mobility. Available collections and styles can be explored from the Bags section.",
        id: "bags-what-types-of-bags-does-ovia-offer",
      },
      {
        question: "How do I choose the right bag?",
        answer:
          "Check the product's dimensions, capacity, material, compartments and features on its product page. Consider what you intend to carry and how you plan to use the bag.",
        id: "bags-how-do-i-choose-the-right-bag",
      },
      {
        question: "Where can I find the dimensions of a bag?",
        answer:
          "Dimensions are displayed in the product information or specifications section of the individual product page.",
        id: "bags-where-can-i-find-the-dimensions-of-a-bag",
      },
      {
        question: "Where can I find the material information?",
        answer:
          "The materials used for each bag are listed on its product page.",
        id: "bags-where-can-i-find-the-material-information",
      },
      {
        question: "Are the colours exactly the same as shown online?",
        answer:
          "We aim to represent product colours accurately. However, colours may appear slightly different depending on your screen, lighting and display settings.",
        id: "bags-are-the-colours-exactly-the-same-as-shown-online",
      },
      {
        question: "What comes with my bag?",
        answer:
          "Any included accessories or additional items will be mentioned on the individual product page.",
        id: "bags-what-comes-with-my-bag",
      },
    ],
  },
  {
    id: "luggage",
    title: "Luggage",
    questions: [
      {
        question: "What types of luggage does OVIA offer?",
        answer:
          "OVIA's luggage collection includes categories such as Cabin, Check-In and Trunks.",
        id: "luggage-what-types-of-luggage-does-ovia-offer",
      },
      {
        question: "What is Cabin luggage?",
        answer:
          "Cabin luggage is designed for travellers who want a compact suitcase that may be suitable for carrying into an aircraft cabin, subject to the airline's baggage rules.",
        id: "luggage-what-is-cabin-luggage",
      },
      {
        question: "What is Check-In luggage?",
        answer:
          "Check-In luggage is larger luggage intended primarily for checked baggage and is suitable for trips requiring more packing capacity.",
        id: "luggage-what-is-check-in-luggage",
      },
      {
        question: "What is Trunk luggage?",
        answer:
          "Trunk luggage provides a larger and often deeper packing format designed for travellers who need additional storage capacity.",
        id: "luggage-what-is-trunk-luggage",
      },
      {
        question: "How do I choose the correct luggage size?",
        answer:
          "Consider your trip length, what you plan to pack and your airline's baggage restrictions. Check the dimensions, weight and capacity shown on each OVIA product page before purchasing.",
        id: "luggage-how-do-i-choose-the-correct-luggage-size",
      },
      {
        question: "Is OVIA Cabin luggage accepted by every airline?",
        answer:
          "Not necessarily. Cabin baggage limits vary between airlines, routes, cabin classes and tickets.\n\nAlways check your airline's latest baggage dimensions and weight restrictions before travelling.",
        id: "luggage-is-ovia-cabin-luggage-accepted-by-every-airline",
      },
      {
        question: "Where can I find luggage dimensions?",
        answer:
          "The dimensions, weight and other specifications are displayed on the individual luggage product page.",
        id: "luggage-where-can-i-find-luggage-dimensions",
      },
      {
        question: "How do I use the luggage lock?",
        answer:
          "Follow the lock instructions supplied with your particular product. Lock designs can vary between luggage models.",
        id: "luggage-how-do-i-use-the-luggage-lock",
      },
      {
        question: "What if I forget my luggage lock combination?",
        answer:
          "Contact OVIA Support with your product and order information. For security reasons, assistance may depend on the specific lock mechanism and proof of purchase.",
        id: "luggage-what-if-i-forget-my-luggage-lock-combination",
      },
      {
        question: "Is OVIA luggage waterproof?",
        answer:
          "Check the specifications for your particular product. A product should only be considered waterproof if its product description specifically states this. Water-resistant products may withstand limited exposure but should not be treated as completely waterproof.",
        id: "luggage-is-ovia-luggage-waterproof",
      },
    ],
  },
  {
    id: "placing-an-order",
    title: "Placing an Order",
    questions: [
      {
        question: "How do I place an order?",
        answer:
          "1. Select the product you want.\n2. Choose the available colour, size or other options.\n3. Select Add to Bag.\n4. Open your Shopping Bag.\n5. Review the products and quantities.\n6. Select Proceed to Checkout.\n7. Enter or select your delivery address.\n8. Review your shipping information.\n9. Select a payment method.\n10. Review your final order.\n11. Complete payment and place your order.\n\nAfter successful order placement, you will see an order confirmation.",
        id: "placing-an-order-how-do-i-place-an-order",
      },
      {
        question: "Do I need an OVIA account to order?",
        answer:
          "The checkout page will show the available checkout options. Having an account gives you access to features such as order history, tracking, saved addresses and support.",
        id: "placing-an-order-do-i-need-an-ovia-account-to-order",
      },
      {
        question: "Why can't I place my order?",
        answer:
          "Common reasons include:\n\n- Product no longer available\n- Insufficient stock\n- Invalid delivery address\n- Delivery unavailable to the selected PIN code\n- Payment failure\n- Payment authorization problem\n- Invalid coupon\n- Quantity restriction\n- Temporary technical or network problem\n\nCheck the message displayed during checkout and try again.",
        id: "placing-an-order-why-cant-i-place-my-order",
      },
      {
        question: "How do I change the quantity in my shopping bag?",
        answer:
          "Open your Shopping Bag and use the quantity controls next to the product. Your order total will update automatically.",
        id: "placing-an-order-how-do-i-change-the-quantity-in-my-shopping-bag",
      },
      {
        question: "Can I remove an item from my bag?",
        answer:
          "Yes. Open your Shopping Bag and select the remove option for the product you no longer want.",
        id: "placing-an-order-can-i-remove-an-item-from-my-bag",
      },
      {
        question: "How do I know my order was successful?",
        answer:
          "After successful payment and order creation, OVIA will display an order confirmation containing your Order ID. Your order should also appear under My Account → My Orders.",
        id: "placing-an-order-how-do-i-know-my-order-was-successful",
      },
      {
        question: "Where can I find my Order ID?",
        answer:
          "Go to:\n\nMy Account → My Orders → Order Details\n\nYour Order ID is displayed with your order information.",
        id: "placing-an-order-where-can-i-find-my-order-id",
      },
    ],
  },
  {
    id: "checkout",
    title: "Checkout",
    questions: [
      {
        question: "What should I check before placing my order?",
        answer:
          "Review:\n\n- Product\n- Colour\n- Size\n- Quantity\n- Product price\n- Discounts\n- Coupon\n- Delivery address\n- Shipping information\n- Payment method\n- Final amount\n\nMake sure the information is correct before confirming the order.",
        id: "checkout-what-should-i-check-before-placing-my-order",
      },
      {
        question: "Can I change my order after placing it?",
        answer:
          "Contact OVIA support with your Order ID to request a change. Updating your bag or saved address does not update a placed order. Available changes depend on the order's payment and shipping stage.",
        id: "checkout-can-i-change-my-order-after-placing-it",
      },
      {
        question: "Can I add another product after placing my order?",
        answer:
          "A confirmed order generally cannot have new products added to it. Place a separate order for additional products.",
        id: "checkout-can-i-add-another-product-after-placing-my-order",
      },
    ],
  },
  {
    id: "prices-and-coupons",
    title: "Prices & Coupons",
    questions: [
      {
        question: "Are product prices displayed on the website?",
        answer:
          "Yes. The current selling price is displayed on the product page and again during checkout.",
        id: "prices-and-coupons-are-product-prices-displayed-on-the-website",
      },
      {
        question: "Why did the price change after I viewed a product?",
        answer:
          "Prices, promotions and discounts can change. The price shown when you complete your order is the price applicable to that transaction, subject to any successfully applied promotion.",
        id: "prices-and-coupons-why-did-the-price-change-after-i-viewed-a-product",
      },
      {
        question: "How do I use a coupon?",
        answer:
          "Enter your code in the promo code section at checkout and apply it. If it is valid and your order meets its conditions, the server-calculated discount appears in the order summary.",
        id: "prices-and-coupons-how-do-i-use-a-coupon",
      },
      {
        question: "Why isn't my coupon working?",
        answer:
          "A coupon may fail because:\n\n- It has expired.\n- The minimum purchase requirement hasn't been met.\n- The product isn't eligible.\n- The maximum number of redemptions has been reached.\n- The coupon has already been used where single use applies.\n- The coupon has another eligibility restriction.\n\nReview the conditions associated with the coupon.",
        id: "prices-and-coupons-why-isnt-my-coupon-working",
      },
      {
        question: "Can I use multiple coupons?",
        answer:
          "Checkout currently accepts one promo code per order. Only the successfully applied code is included in the final total.",
        id: "prices-and-coupons-can-i-use-multiple-coupons",
      },
      {
        question: "What happens to my discount if I return a product?",
        answer:
          "Refund calculations are based on the amount actually paid and the applicable promotion and return conditions. A promotional discount itself is not necessarily refundable as cash.",
        id: "prices-and-coupons-what-happens-to-my-discount-if-i-return-a-product",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    questions: [
      {
        question: "What payment methods does OVIA accept?",
        answer:
          "The currently supported payment methods are displayed during checkout. These may include options such as UPI, supported cards and other payment methods provided through OVIA's payment gateway.",
        id: "payments-what-payment-methods-does-ovia-accept",
      },
      {
        question: "Can I pay using UPI?",
        answer:
          "Yes, when UPI is shown as an available payment method during checkout.",
        id: "payments-can-i-pay-using-upi",
      },
      {
        question: "Can I pay with Google Pay?",
        answer:
          "If your supported UPI payment flow allows Google Pay, you can select or complete the transaction through the available UPI option.",
        id: "payments-can-i-pay-with-google-pay",
      },
      {
        question: "Can I pay using a debit or credit card?",
        answer:
          "Yes, when supported card payment options are displayed during checkout.",
        id: "payments-can-i-pay-using-a-debit-or-credit-card",
      },
      {
        question: "Is my payment secure?",
        answer:
          "Payments are processed through the payment gateway used by OVIA. Sensitive payment authentication is handled through the payment process rather than being exposed through ordinary website pages.",
        id: "payments-is-my-payment-secure",
      },
      {
        question: "Why did my payment fail?",
        answer:
          "Payments may fail because of:\n\n- Incorrect payment information\n- Bank rejection\n- Insufficient balance\n- UPI request expiration\n- Authentication failure\n- Network problems\n- Payment gateway issues\n\nYou can retry using an available payment method after confirming that the previous transaction did not successfully create the order.",
        id: "payments-why-did-my-payment-fail",
      },
      {
        question: "Money was deducted but my order failed. What should I do?",
        answer:
          "First check My Orders to see whether an order was created.\n\nIf the payment was deducted but no confirmed order exists, do not repeatedly make the same payment while the transaction is still being verified. Check the transaction status and contact OVIA Support if the issue remains unresolved.",
        id: "payments-money-was-deducted-but-my-order-failed-what-should-i-do",
      },
      {
        question: "Can I change my payment method after payment succeeds?",
        answer:
          "No. Once a payment has been successfully completed for an order, the payment method for that completed transaction cannot simply be replaced.",
        id: "payments-can-i-change-my-payment-method-after-payment-succeeds",
      },
    ],
  },
  {
    id: "order-management",
    title: "Order Management",
    questions: [
      {
        question: "Where can I see my orders?",
        answer:
          "Go to:\n\nMy Account → My Orders\n\nYou can see your current and previous orders there.",
        id: "order-management-where-can-i-see-my-orders",
      },
      {
        question: "How do I view complete order information?",
        answer:
          "Open My Account → My Orders and select View order. Your order confirmation shows the purchased products, quantities, total and delivery information. Select Manage order to open Orders & Returns.",
        id: "order-management-how-do-i-view-complete-order-information",
      },
      {
        question: "Can I change the quantity after placing an order?",
        answer:
          "Confirmed order quantities cannot be edited directly. Contact OVIA support about an eligible cancellation request and place a separate order when needed.",
        id: "order-management-can-i-change-the-quantity-after-placing-an-order",
      },
      {
        question: "Can I change the colour after ordering?",
        answer:
          "A confirmed colour cannot be edited directly. Contact OVIA support to discuss your order before dispatch. Exchanges are assessed by support and depend on eligibility and availability.",
        id: "order-management-can-i-change-the-colour-after-ordering",
      },
      {
        question: "Can I change my delivery address?",
        answer:
          "Saved addresses can be edited in Address Book, but this does not change an existing order. Contact OVIA support with your Order ID as soon as possible to ask about an address change. Changes after dispatch may not be possible.",
        id: "order-management-can-i-change-my-delivery-address",
      },
    ],
  },
  {
    id: "order-cancellation",
    title: "Order Cancellation",
    questions: [
      {
        question: "How do I cancel my order?",
        answer:
          "Open My Account → Orders & Returns. Choose Request cancellation on an eligible order, enter your reason and select Submit request. This creates a support review request; the order is not automatically cancelled.",
        id: "order-cancellation-how-do-i-cancel-my-order",
      },
      {
        question: "When can I cancel an order?",
        answer:
          "The request button is available for eligible paid orders before courier dispatch. OVIA support reviews eligibility before any cancellation or refund is processed.",
        id: "order-cancellation-when-can-i-cancel-an-order",
      },
      {
        question: "Why can't I see the Cancel Order button?",
        answer:
          "The page uses Request cancellation. It may be unavailable after dispatch, for an ineligible payment state, or while another request for the same order is under review. Contact OVIA support if you need help.",
        id: "order-cancellation-why-cant-i-see-the-cancel-order-button",
      },
      {
        question: "Can I cancel only one item?",
        answer:
          "The current cancellation request applies to the entire order. Contact OVIA support to discuss a partial cancellation; do not assume it is available.",
        id: "order-cancellation-can-i-cancel-only-one-item",
      },
      {
        question: "What happens after cancellation?",
        answer:
          "A submitted cancellation request is first marked Open and reviewed by OVIA support. Request statuses include Open, In Review, Waiting for Customer, Resolved and Closed. These are support statuses, not proof that an order was cancelled or money was refunded. Support confirms the outcome.",
        id: "order-cancellation-what-happens-after-cancellation",
      },
      {
        question: "Can I restore a cancelled order?",
        answer:
          "No. If you still want the product after cancellation, place a new order subject to current availability and price.",
        id: "order-cancellation-can-i-restore-a-cancelled-order",
      },
    ],
  },
  {
    id: "shipping-and-delivery",
    title: "Shipping & Delivery",
    questions: [
      {
        question: "How do I know whether OVIA delivers to my location?",
        answer:
          "Enter your delivery PIN code or address where the website provides an availability check. Delivery availability depends on the shipping service available for that location.",
        id: "shipping-and-delivery-how-do-i-know-whether-ovia-delivers-to-my-location",
      },
      {
        question: "How much does shipping cost?",
        answer:
          "Any applicable shipping charge is displayed before you complete your order.",
        id: "shipping-and-delivery-how-much-does-shipping-cost",
      },
      {
        question: "When will my order arrive?",
        answer:
          "An estimated delivery date is shown based on product availability, destination and shipping service. It is an estimate and can change if the courier experiences delays.",
        id: "shipping-and-delivery-when-will-my-order-arrive",
      },
      {
        question: "Which courier will deliver my order?",
        answer:
          "Once your shipment is created, available courier information can be shown in your order tracking details.",
        id: "shipping-and-delivery-which-courier-will-deliver-my-order",
      },
      {
        question: "Can I choose the courier?",
        answer:
          "Unless the checkout page specifically provides this option, courier assignment is handled through the fulfilment process.",
        id: "shipping-and-delivery-can-i-choose-the-courier",
      },
      {
        question: "What happens if I'm unavailable during delivery?",
        answer:
          "The courier may make another attempt or update the shipment with further instructions depending on the delivery service being used.",
        id: "shipping-and-delivery-what-happens-if-im-unavailable-during-delivery",
      },
      {
        question: "Will the delivery agent call me?",
        answer:
          "A courier may contact the phone number associated with the shipment when necessary, but a call cannot always be guaranteed.",
        id: "shipping-and-delivery-will-the-delivery-agent-call-me",
      },
    ],
  },
  {
    id: "tracking",
    title: "Tracking",
    questions: [
      {
        question: "How do I track my order?",
        answer: "Go to:\n\nMy Account → My Orders → Select Order → Track Order",
        id: "tracking-how-do-i-track-my-order",
      },
      {
        question: "What tracking stages will I see?",
        answer:
          "Your shipment may move through stages such as:\n\nOrder Placed → Payment Confirmed → Processing → Packed → Ready to Ship → Shipped → In Transit → Out for Delivery → Delivered",
        id: "tracking-what-tracking-stages-will-i-see",
      },
      {
        question: "What is an AWB number?",
        answer:
          "An AWB, or Air Waybill number, is a tracking identifier assigned to a shipment by the courier or logistics provider.",
        id: "tracking-what-is-an-awb-number",
      },
      {
        question: "Where can I find my AWB number?",
        answer:
          "Once a shipment has been created and tracking information is available, the AWB/tracking number can appear in the tracking section of your order.",
        id: "tracking-where-can-i-find-my-awb-number",
      },
      {
        question: "Why isn't my tracking number working?",
        answer:
          "The courier may need some time after shipment creation to activate or update tracking information.",
        id: "tracking-why-isnt-my-tracking-number-working",
      },
      {
        question: "Why hasn't tracking updated?",
        answer:
          "Tracking updates depend on courier scans. A parcel may continue moving even when a new scan hasn't appeared yet.",
        id: "tracking-why-hasnt-tracking-updated",
      },
      {
        question: "What does “In Transit” mean?",
        answer:
          "It means your shipment is moving through the courier's delivery network toward its destination.",
        id: "tracking-what-does-in-transit-mean",
      },
      {
        question: "What does “Out for Delivery” mean?",
        answer:
          "It means the parcel has generally reached the final delivery stage and has been assigned for a delivery attempt.",
        id: "tracking-what-does-out-for-delivery-mean",
      },
      {
        question:
          "Tracking says Delivered but I haven't received the package. What should I do?",
        answer:
          "Check with household members or anyone authorised to receive the parcel. If you still cannot locate it, open Contact & tickets, choose Delivery issue and select the related order.",
        id: "tracking-tracking-says-delivered-but-i-havent-received-the-package-what-should-i-do",
      },
    ],
  },
  {
    id: "delivery-problems",
    title: "Delivery Problems",
    questions: [
      {
        question: "My order is delayed. What should I do?",
        answer:
          "Check the latest tracking information first. If the estimated delivery date has passed or tracking indicates a problem, contact OVIA Support from the relevant order.",
        id: "delivery-problems-my-order-is-delayed-what-should-i-do",
      },
      {
        question: "My package arrived damaged. What should I do?",
        answer:
          "Keep the package and product, and take clear photos for your records. Open Contact & tickets, choose Damaged product and select the related order. Describe the damage; support will explain how to provide any evidence needed.",
        id: "delivery-problems-my-package-arrived-damaged-what-should-i-do",
      },
      {
        question: "I received the wrong product.",
        answer:
          "Open the relevant order and report Wrong Product Received. Keep the original product, accessories, labels and packaging while your request is reviewed.",
        id: "delivery-problems-i-received-the-wrong-product",
      },
      {
        question: "An item is missing from my package.",
        answer:
          "Check your order details to determine whether products were sent separately. If the shipment should contain the missing item, report it through order support.",
        id: "delivery-problems-an-item-is-missing-from-my-package",
      },
    ],
  },
  {
    id: "returns",
    title: "Returns",
    questions: [
      {
        question: "How do I return a product?",
        answer:
          "Open My Account → Orders & Returns, select Request return on an eligible order, choose All products or a purchased product and quantity, add your reason and select Submit request. OVIA support reviews the request and confirms the next steps.",
        id: "returns-how-do-i-return-a-product",
      },
      {
        question: "How long do I have to return an item?",
        answer:
          "The applicable return window should be shown in OVIA's Return Policy and, where appropriate, with your order. Use that stated window rather than assuming every product has the same return period.",
        id: "returns-how-long-do-i-have-to-return-an-item",
      },
      {
        question: "What condition should a returned product be in?",
        answer:
          "Unless the return reason involves a defect or damage, products should generally be returned in the condition required by OVIA's Return Policy, together with applicable accessories, labels and packaging.",
        id: "returns-what-condition-should-a-returned-product-be-in",
      },
      {
        question: "Can I return a used product?",
        answer:
          "Eligibility depends on the return reason, product condition and OVIA's Return Policy.",
        id: "returns-can-i-return-a-used-product",
      },
      {
        question: "How do I track my return?",
        answer:
          "Open My Account → Orders & Returns → Returns & refunds and select View request. Follow the support status and messages there. A support request does not automatically create a return pickup or courier label.",
        id: "returns-how-do-i-track-my-return",
      },
      {
        question: "Why was my return rejected?",
        answer:
          "A return may be rejected if it doesn't satisfy the applicable return conditions. The return status should provide the reason or direct you to support for further information.",
        id: "returns-why-was-my-return-rejected",
      },
    ],
  },
  {
    id: "exchanges-and-replacements",
    title: "Exchanges & Replacements",
    questions: [
      {
        question: "Can I exchange my product?",
        answer:
          "Contact OVIA support with your Order ID and the product you want to exchange. Exchanges are reviewed according to the applicable policy and stock availability; there is no automatic exchange booking.",
        id: "exchanges-and-replacements-can-i-exchange-my-product",
      },
      {
        question: "Can I exchange for another colour?",
        answer:
          "If the product and requested colour are eligible and available, an exchange may be possible. Otherwise, you may need to return the original product and place a new order.",
        id: "exchanges-and-replacements-can-i-exchange-for-another-colour",
      },
      {
        question: "Can I exchange luggage for another size?",
        answer:
          "This depends on product eligibility and inventory availability.",
        id: "exchanges-and-replacements-can-i-exchange-luggage-for-another-size",
      },
      {
        question: "Can I replace a damaged or defective product?",
        answer:
          "If your product arrives damaged or defective, report the problem through the relevant order. OVIA can determine the applicable resolution based on the issue and policy.",
        id: "exchanges-and-replacements-can-i-replace-a-damaged-or-defective-product",
      },
      {
        question: "What if the replacement is out of stock?",
        answer:
          "If a replacement cannot be provided, another applicable resolution, such as a refund, may be offered according to OVIA's policy.",
        id: "exchanges-and-replacements-what-if-the-replacement-is-out-of-stock",
      },
    ],
  },
  {
    id: "refunds",
    title: "Refunds",
    questions: [
      {
        question: "When will I receive my refund?",
        answer:
          "Once a refund is approved and initiated, processing time depends on your original payment method, payment provider and financial institution.",
        id: "refunds-when-will-i-receive-my-refund",
      },
      {
        question: "Where will my refund be sent?",
        answer:
          "Refunds are generally processed to the applicable original payment method unless another method is specifically provided under the relevant policy.",
        id: "refunds-where-will-my-refund-be-sent",
      },
      {
        question: "How do I track my refund?",
        answer:
          "Open My Account → Orders & Returns → Returns & refunds and select View request. OVIA support can confirm whether a refund has been approved and processed. A Resolved support ticket alone is not proof that money has reached your account.",
        id: "refunds-how-do-i-track-my-refund",
      },
      {
        question: "What does Refund Initiated mean?",
        answer:
          "If OVIA support confirms that a refund has been initiated, it means processing has started with the payment provider. The support request status itself does not confirm a payment reversal.",
        id: "refunds-what-does-refund-initiated-mean",
      },
      {
        question: "What does Refund Completed mean?",
        answer:
          "If OVIA support confirms that a refund has been completed, the payment provider has processed it. Your bank may still need time to show the credit. A Closed or Resolved request is not a refund receipt.",
        id: "refunds-what-does-refund-completed-mean",
      },
      {
        question: "Why haven't I received my refund?",
        answer:
          "Check the refund status and allow for the processing time associated with your payment method. If the expected processing period has passed, contact OVIA Support with your Order ID.",
        id: "refunds-why-havent-i-received-my-refund",
      },
    ],
  },
  {
    id: "damaged-or-defective-products",
    title: "Damaged or Defective Products",
    questions: [
      {
        question: "My bag arrived damaged. What should I do?",
        answer:
          "Open Contact & tickets, choose Damaged product and select your order. Describe the damage and keep the packaging and photographs. OVIA support will confirm the next steps.",
        id: "damaged-or-defective-products-my-bag-arrived-damaged-what-should-i-do",
      },
      {
        question: "My luggage wheel is damaged.",
        answer:
          "If the damage was present when the product arrived, report it as a damaged/defective product. If the issue developed later, check your warranty coverage.",
        id: "damaged-or-defective-products-my-luggage-wheel-is-damaged",
      },
      {
        question: "My luggage handle isn't working.",
        answer:
          "Report the issue through product support or warranty support depending on when and how the problem occurred.",
        id: "damaged-or-defective-products-my-luggage-handle-isnt-working",
      },
      {
        question: "My zipper or lock isn't working.",
        answer:
          "Open Contact & tickets or Product Care & Registration and describe the issue with your Order ID and product details. Support will explain any evidence needed.",
        id: "damaged-or-defective-products-my-zipper-or-lock-isnt-working",
      },
    ],
  },
  {
    id: "warranty",
    title: "Warranty",
    questions: [
      {
        question: "Does OVIA provide a warranty?",
        answer:
          "Warranty availability and coverage should be displayed with the relevant product or in OVIA's Warranty Policy.",
        id: "warranty-does-ovia-provide-a-warranty",
      },
      {
        question: "When does my warranty start?",
        answer:
          "Where a warranty applies, its start date and duration are governed by the warranty terms provided with the product/order.",
        id: "warranty-when-does-my-warranty-start",
      },
      {
        question: "What does the warranty cover?",
        answer:
          "Coverage depends on the warranty associated with the specific product. Check the applicable warranty terms for covered manufacturing or component issues.",
        id: "warranty-what-does-the-warranty-cover",
      },
      {
        question: "Is accidental damage covered?",
        answer:
          "Do not assume accidental damage is covered. Check the warranty terms for the product.",
        id: "warranty-is-accidental-damage-covered",
      },
      {
        question: "Is normal wear and tear covered?",
        answer:
          "Normal wear and tear is generally different from a manufacturing defect. The applicable warranty terms determine coverage.",
        id: "warranty-is-normal-wear-and-tear-covered",
      },
      {
        question: "How do I submit a warranty claim?",
        answer:
          "Contact OVIA support or open Product Care & Registration. Provide your Order ID, product details and a description of the issue. Keep your proof of purchase; support will confirm the applicable warranty terms and any evidence needed.",
        id: "warranty-how-do-i-submit-a-warranty-claim",
      },
    ],
  },
  {
    id: "product-care",
    title: "Product Care",
    questions: [
      {
        question: "How should I clean my OVIA bag?",
        answer:
          "Follow the care instructions provided for your specific product and material. Avoid using harsh cleaning products unless they are explicitly suitable for that material.",
        id: "product-care-how-should-i-clean-my-ovia-bag",
      },
      {
        question: "How should I clean my luggage?",
        answer:
          "Use the care instructions for your particular luggage material. Remove surface dirt carefully and avoid chemicals that may damage the finish.",
        id: "product-care-how-should-i-clean-my-luggage",
      },
      {
        question: "How should I care for luggage wheels?",
        answer:
          "Keep wheels free from stones, dirt, threads and other debris. Avoid forcing the luggage over surfaces that may damage the wheel assembly.",
        id: "product-care-how-should-i-care-for-luggage-wheels",
      },
      {
        question: "How should I store my bag or luggage?",
        answer:
          "Store the product in a clean, dry environment away from excessive moisture, heat and direct sunlight.",
        id: "product-care-how-should-i-store-my-bag-or-luggage",
      },
    ],
  },
  {
    id: "wishlist",
    title: "Wishlist",
    questions: [
      {
        question: "How do I add a product to my wishlist?",
        answer:
          "Select the wishlist or heart option displayed with the product.",
        id: "wishlist-how-do-i-add-a-product-to-my-wishlist",
      },
      {
        question: "Where can I see my wishlist?",
        answer: "Go to your account and open the Wishlist section.",
        id: "wishlist-where-can-i-see-my-wishlist",
      },
      {
        question: "Does adding a product to my wishlist reserve it?",
        answer:
          "No. Wishlist products are not reserved and may become unavailable.",
        id: "wishlist-does-adding-a-product-to-my-wishlist-reserve-it",
      },
      {
        question: "Can I move a wishlist product to my shopping bag?",
        answer: "Yes, when the product is currently available for purchase.",
        id: "wishlist-can-i-move-a-wishlist-product-to-my-shopping-bag",
      },
    ],
  },
  {
    id: "reviews-and-ratings",
    title: "Reviews & Ratings",
    questions: [
      {
        question: "How do I review a product?",
        answer:
          "When review functionality is available for an eligible purchase, open the product/order and select the option to leave a review.",
        id: "reviews-and-ratings-how-do-i-review-a-product",
      },
      {
        question: "Can I upload photos with my review?",
        answer:
          "Use only the review options available on the product page. Photo uploads are not currently offered in the review form.",
        id: "reviews-and-ratings-can-i-upload-photos-with-my-review",
      },
      {
        question: "Why isn't my review visible?",
        answer:
          "Reviews may require processing or moderation before appearing publicly.",
        id: "reviews-and-ratings-why-isnt-my-review-visible",
      },
      {
        question: "How are ratings calculated?",
        answer:
          "The product page displays ratings based on the review and rating information collected for that product according to OVIA's review system.",
        id: "reviews-and-ratings-how-are-ratings-calculated",
      },
    ],
  },
  {
    id: "account-and-login",
    title: "Account & Login",
    questions: [
      {
        question: "How do I create an OVIA account?",
        answer:
          "Select Sign Up, enter the required information and complete the email verification process.",
        id: "account-and-login-how-do-i-create-an-ovia-account",
      },
      {
        question: "How do I sign in?",
        answer:
          "Select Login, enter your registered email address and complete the required authentication process.",
        id: "account-and-login-how-do-i-sign-in",
      },
      {
        question: "Can I sign in with Google?",
        answer: "Yes, if Continue with Google is available on the login page.",
        id: "account-and-login-can-i-sign-in-with-google",
      },
      {
        question: "I forgot my password. What should I do?",
        answer:
          "Select Forgot Password, enter your registered email address and follow the verification process to create a new password.",
        id: "account-and-login-i-forgot-my-password-what-should-i-do",
      },
      {
        question: "Where can I manage my account?",
        answer:
          "Go to My Account to access your profile, orders, addresses, wishlist and security settings.",
        id: "account-and-login-where-can-i-manage-my-account",
      },
    ],
  },
  {
    id: "otp-and-verification",
    title: "OTP & Verification",
    questions: [
      {
        question: "Why does OVIA send a verification code?",
        answer:
          "Verification codes help confirm access to your email address during actions such as account registration, login or password recovery.",
        id: "otp-and-verification-why-does-ovia-send-a-verification-code",
      },
      {
        question: "I didn't receive my OTP. What should I do?",
        answer:
          "Check your inbox and spam/junk folder and make sure you entered the correct email address. If the resend option becomes available, request a new code.",
        id: "otp-and-verification-i-didnt-receive-my-otp-what-should-i-do",
      },
      {
        question: "How long is an OTP valid?",
        answer:
          "The current email verification and password-recovery codes expire after 10 minutes. Follow the expiry guidance shown in your account flow and request another code if needed.",
        id: "otp-and-verification-how-long-is-an-otp-valid",
      },
      {
        question: "Why does my OTP say invalid?",
        answer:
          "The code may be incorrect, already used, replaced by a newer code or otherwise invalid.",
        id: "otp-and-verification-why-does-my-otp-say-invalid",
      },
      {
        question: "Why does my OTP say expired?",
        answer:
          "Verification codes expire after their validity period. Request a new code and use the latest one.",
        id: "otp-and-verification-why-does-my-otp-say-expired",
      },
      {
        question: "Can I request another OTP immediately?",
        answer:
          "A resend waiting period applies. Wait for the resend control on the verification page to become available; repeated requests can be limited for security.",
        id: "otp-and-verification-can-i-request-another-otp-immediately",
      },
      {
        question: "What happens if I enter the wrong OTP repeatedly?",
        answer:
          "For security, verification attempts are limited. OVIA currently allows up to 5 verification attempts for a code before further verification is required.",
        id: "otp-and-verification-what-happens-if-i-enter-the-wrong-otp-repeatedly",
      },
      {
        question: "Should I share my OTP with OVIA support?",
        answer:
          "No.\n\nNever share your password or verification code with anyone.",
        id: "otp-and-verification-should-i-share-my-otp-with-ovia-support",
      },
    ],
  },
  {
    id: "password-and-security",
    title: "Password & Security",
    questions: [
      {
        question: "How do I change my password?",
        answer:
          "Open your account security settings and use the available password-change option.",
        id: "password-and-security-how-do-i-change-my-password",
      },
      {
        question: "How do I create a strong password?",
        answer:
          "Use a unique password with at least 8 characters, no spaces, at least one uppercase letter, one digit and one special character from !@#$%^&*?+-/,. Avoid reusing passwords from other websites.",
        id: "password-and-security-how-do-i-create-a-strong-password",
      },
      {
        question: "I think someone accessed my account. What should I do?",
        answer:
          "Change your password immediately and contact OVIA Support if you notice activity you don't recognize.",
        id: "password-and-security-i-think-someone-accessed-my-account-what-should-i-do",
      },
      {
        question: "Will OVIA ask me for my password or OTP?",
        answer:
          "You should never send your password or OTP to someone claiming to provide support.",
        id: "password-and-security-will-ovia-ask-me-for-my-password-or-otp",
      },
    ],
  },
  {
    id: "addresses",
    title: "Addresses",
    questions: [
      {
        question: "How do I add a new delivery address?",
        answer: "Go to your account's address section and select Add Address.",
        id: "addresses-how-do-i-add-a-new-delivery-address",
      },
      {
        question: "Can I save multiple addresses?",
        answer:
          "Yes, where multiple saved addresses are supported by your account.",
        id: "addresses-can-i-save-multiple-addresses",
      },
      {
        question: "How do I edit an address?",
        answer:
          "Open your saved addresses, select the relevant address and choose Edit.",
        id: "addresses-how-do-i-edit-an-address",
      },
      {
        question: "How do I delete an address?",
        answer:
          "Select the relevant saved address and choose the available delete/remove option.",
        id: "addresses-how-do-i-delete-an-address",
      },
      {
        question: "Why isn't delivery available to my PIN code?",
        answer:
          "Your location may currently be outside the supported service area for the product or courier network.",
        id: "addresses-why-isnt-delivery-available-to-my-pin-code",
      },
    ],
  },
  {
    id: "invoice-and-billing",
    title: "Invoice & Billing",
    questions: [
      {
        question: "Where can I find my invoice?",
        answer:
          "Open My Account → My Orders → View order for your order confirmation and payment total. If you need a tax invoice, contact OVIA support with your Order ID; an invoice download is not currently offered in the account page.",
        id: "invoice-and-billing-where-can-i-find-my-invoice",
      },
      {
        question: "What information is included in my invoice?",
        answer:
          "An invoice may contain relevant order, product, pricing, tax, billing and transaction information as applicable.",
        id: "invoice-and-billing-what-information-is-included-in-my-invoice",
      },
      {
        question: "Can I download my invoice again?",
        answer:
          "You can revisit your order confirmation through My Orders. For an invoice or invoice copy, contact OVIA support with your Order ID.",
        id: "invoice-and-billing-can-i-download-my-invoice-again",
      },
    ],
  },
  {
    id: "privacy-and-payment-security",
    title: "Privacy & Payment Security",
    questions: [
      {
        question: "How does OVIA protect my information?",
        answer:
          "OVIA uses security measures designed to protect account and transaction information. Authentication, secure sessions and protected payment processing should be used throughout sensitive customer flows.",
        id: "privacy-and-payment-security-how-does-ovia-protect-my-information",
      },
      {
        question: "Does OVIA store my full card details?",
        answer:
          "Razorpay's hosted payment flow handles card details and payment authentication. OVIA stores order and payment references; do not send card numbers, CVV or verification codes to support.",
        id: "privacy-and-payment-security-does-ovia-store-my-full-card-details",
      },
      {
        question: "How can I learn more about how my information is used?",
        answer:
          "Read OVIA's Privacy Policy for information about data collection, processing, storage and your applicable rights.",
        id: "privacy-and-payment-security-how-can-i-learn-more-about-how-my-information-is-used",
      },
    ],
  },
  {
    id: "contact-and-support",
    title: "Contact & Support",
    questions: [
      {
        question: "How do I contact OVIA about an order?",
        answer:
          "Open Contact & tickets, sign in, select a category and your related order, then describe the issue. You can also use Contact Us to find available contact options.",
        id: "contact-and-support-how-do-i-contact-ovia-about-an-order",
      },
      {
        question: "What types of problems can I report?",
        answer:
          "You can use support for issues involving:\n\n- Orders\n- Payments\n- Shipping\n- Tracking\n- Returns\n- Exchanges\n- Refunds\n- Damaged products\n- Warranty\n- Account access\n- Product questions",
        id: "contact-and-support-what-types-of-problems-can-i-report",
      },
      {
        question: "Can I upload a photo of my problem?",
        answer:
          "The current Contact & tickets form accepts text rather than file attachments. Describe the issue and keep any photographs; OVIA support will explain how to provide evidence if needed.",
        id: "contact-and-support-can-i-upload-a-photo-of-my-problem",
      },
      {
        question: "What information should I provide?",
        answer:
          "Select the relevant category and order, include your Order ID when needed, and explain the issue clearly. Keep supporting photos if relevant. Never include passwords, verification codes, full card numbers or CVV.",
        id: "contact-and-support-what-information-should-i-provide",
      },
      {
        question: "What happens after I submit a support request?",
        answer:
          "Your request should be recorded and assigned a support reference or ticket identifier so its progress can be tracked.",
        id: "contact-and-support-what-happens-after-i-submit-a-support-request",
      },
    ],
  },
];
