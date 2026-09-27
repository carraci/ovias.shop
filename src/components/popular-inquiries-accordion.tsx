"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

export interface PopularInquiryData {
  id: string;
  question: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaHref: string;
}

export const POPULAR_INQUIRIES_DATA: PopularInquiryData[] = [
  {
    id: "where-does-ovia-deliver",
    question: "Where does OVIA deliver?",
    paragraphs: [
      "OVIA delivers across India to locations covered by our delivery partners. Delivery availability is determined by the PIN code entered at checkout, where you can also view the applicable estimated delivery timeframe.",
      "This section provides further information on delivery coverage, order processing, shipping timelines, address requirements, delivery attempts, and circumstances that may affect the arrival of an order.",
      "For international delivery enquiries, please contact OVIA Customer Care before placing an order so that destination availability and applicable shipping arrangements can be confirmed.",
    ],
    ctaLabel: "View delivery information",
    ctaHref: "/faq/delivery/where-does-ovia-deliver",
  },
  {
    id: "how-can-i-track-my-order",
    question: "How can I track my order?",
    paragraphs: [
      "Once your order has been dispatched, OVIA will send a shipping confirmation containing the available tracking details. Orders can also be monitored through your OVIA account under My Orders.",
      "Your order status provides updates as your purchase moves through processing, dispatch, transit, and delivery. Courier tracking may take some time to update following dispatch.",
      "If an order appears to be delayed, the tracking information has not updated, or you require assistance with a shipment, please refer to the order information provided or contact Customer Care with your order number.",
    ],
    ctaLabel: "Track your order",
    ctaHref: "/faq/delivery/how-can-i-track-my-order",
  },
  {
    id: "what-is-ovias-return-policy",
    question: "What is OVIA's return policy?",
    paragraphs: [
      "Our return policy sets out the conditions applicable to returning an OVIA purchase.",
      "Information includes the applicable return period, product condition requirements, return eligibility, exchanges, refunds, and products that may be excluded from return. Items must meet the stated conditions when received by OVIA for a return to be accepted.",
      "Certain products, including selected personalised or customised pieces, may be subject to specific return conditions. We recommend reviewing the complete policy before initiating a return.",
    ],
    ctaLabel: "Read the return policy",
    ctaHref: "/faq/exchange-returns/what-is-ovias-return-policy",
  },
  {
    id: "how-should-i-care-for-my-ovia-bag",
    question: "How should I care for my OVIA bag?",
    paragraphs: [
      "The longevity and appearance of a bag depend on how it is handled, stored, and maintained. Our product care guidance provides recommendations for preserving the material, construction, finish, and hardware of your OVIA piece.",
      "Guidance includes appropriate storage, protection from moisture and heat, everyday handling, cleaning considerations, and substances or conditions that should be avoided. Care requirements may differ according to the material and construction of each product.",
      "For material-specific concerns or marks that cannot be safely treated at home, we recommend contacting Customer Care before attempting any treatment.",
    ],
    ctaLabel: "View product care guide",
    ctaHref: "/faq/products/how-should-i-care-for-my-ovia-bag",
  },
  {
    id: "can-ovia-products-be-personalised",
    question: "Can OVIA products be personalised?",
    paragraphs: [
      "Personalisation is available on selected OVIA pieces and varies according to the product and collection.",
      "Where offered, available personalisation options are displayed on the relevant product page before purchase. Depending on the type of personalisation selected, additional preparation time may apply.",
      "As personalised pieces are prepared specifically according to the customer's selection, they may be subject to different return and exchange conditions. Customers are therefore advised to carefully review all personalisation details before confirming an order.",
    ],
    ctaLabel: "Explore personalisation",
    ctaHref: "/faq/products/can-ovia-products-be-personalised",
  },
  {
    id: "how-can-i-request-a-repair",
    question: "How can I request a repair?",
    paragraphs: [
      "OVIA provides repair and after-sales assistance for eligible products, subject to the nature of the issue, product condition, availability of components, and applicable service or warranty terms.",
      "To request an assessment, customers may be asked to provide their order details or proof of purchase, product information, a description of the issue, and photographs showing the affected area.",
      "Following an initial review, Customer Care will advise whether the product can be serviced, whether an inspection is required, and whether any repair or service charge applies. Customers will be informed of applicable charges before a chargeable repair proceeds.",
    ],
    ctaLabel: "Repair & after-sales service",
    ctaHref: "/faq/services/how-can-i-request-a-repair",
  },
];

export function PopularInquiriesAccordion() {
  // Allow toggling open items (set of open item IDs)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="faq-accordion-container" role="region" aria-label="Popular Inquiries">
      {POPULAR_INQUIRIES_DATA.map((item) => {
        const isOpen = openIds.has(item.id);

        return (
          <div
            key={item.id}
            className={`faq-accordion-item ${isOpen ? "is-open" : ""}`}
          >
            <button
              type="button"
              className="faq-accordion-trigger"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
            >
              <span className="faq-accordion-title">{item.question}</span>
              <span className="faq-accordion-icon-wrap" aria-hidden="true">
                <ChevronDown
                  size={18}
                  strokeWidth={1.5}
                  className={`faq-accordion-chevron ${isOpen ? "rotate" : ""}`}
                />
              </span>
            </button>

            {isOpen && (
              <div
                id={`accordion-panel-${item.id}`}
                className="faq-accordion-panel"
              >
                <div className="faq-accordion-panel-inner">
                  {item.paragraphs.map((p, idx) => (
                    <p key={idx} className="faq-accordion-p">
                      {p}
                    </p>
                  ))}

                  <div className="faq-accordion-cta-wrapper">
                    <Link
                      href={item.ctaHref}
                      className="faq-accordion-cta-link"
                    >
                      <span>{item.ctaLabel}</span>
                      <ArrowRight size={14} strokeWidth={2} className="cta-arrow" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
