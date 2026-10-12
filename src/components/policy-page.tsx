import React from "react";
import Link from "next/link";
import { policies, policyUpdated } from "@/lib/policies";

function renderInlineFormatting(str: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("[") && token.includes("](")) {
      const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="policy-inline-link"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }
  return parts.length > 0 ? parts : str;
}

function renderPolicyContent(text: string) {
  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let currentParagraph: string[] = [];
  let keyIndex = 0;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={`p-${keyIndex++}`} className="policy-paragraph">
          {renderInlineFormatting(currentParagraph.join(" "))}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${keyIndex++}`} className="policy-bullet-list">
          {currentList.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      elements.push(
        <h3 key={`h3-${keyIndex++}`} className="policy-subheading">
          {line.replace(/^###\s+/, "")}
        </h3>
      );
      continue;
    }

    if (line.startsWith("#### ")) {
      flushParagraph();
      flushList();
      elements.push(
        <h4 key={`h4-${keyIndex++}`} className="policy-subheading-small">
          {line.replace(/^####\s+/, "")}
        </h4>
      );
      continue;
    }

    if (line.startsWith("• ") || line.startsWith("- ")) {
      flushParagraph();
      currentList.push(line.replace(/^[•\-]\s*/, ""));
      continue;
    }

    // Normal text line
    flushList();
    currentParagraph.push(line);
  }

  flushParagraph();
  flushList();

  return elements;
}

export function PolicyPage({ name }: { name: string }) {
  const policy = policies[name];
  return (
    <section className="section policy-page">
      <p className="eyebrow">LEGAL & PRIVACY</p>
      <h1>{policy.title}</h1>
      <p className="policy-intro">{policy.intro}</p>
      <p className="small-note">
        {policy.smallNote ||
          `Last updated: ${policyUpdated} · Preview document; commercial effective date pending.`}
      </p>
      <div className="policy-layout">
        <nav aria-label="On this page">
          {policy.sections.map(([title], i) => {
            const displayTitle = title.replace(/^\d+\.\s*/, "");
            return (
              <a key={title} href={`#section-${i}`}>
                {String(i + 1).padStart(2, "0")} / {displayTitle}
              </a>
            );
          })}
        </nav>
        <article>
          {policy.sections.map(([title, text], i) => (
            <section id={`section-${i}`} key={title}>
              <h2>{title}</h2>
              {renderPolicyContent(text)}
            </section>
          ))}
          <div className="account-tools">
            <Link className="text-link" href="/privacy/request">
              Privacy controls ↗
            </Link>
            <Link className="text-link" href="/cookie-preferences">
              Cookie preferences ↗
            </Link>
            <Link className="text-link" href="/contact">
              Contact support ↗
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

export function ShippingReturns({ returns = false }: { returns?: boolean }) {
  return (
    <section className="section content-page">
      <p className="eyebrow">AT YOUR SERVICE</p>
      <h1>{returns ? "Room to reconsider." : "The journey to your door."}</h1>
      <div className="content-sections">
        {(returns
          ? [
              [
                "Returns & refunds",
                "Demo orders are not shipped and no money changes hands. You do not need to return fictional products.",
              ],
              [
                "A request, with context",
                "Signed-in customers can open a Return or Refund support ticket and attach it to one of their own orders. Support reviews the request; submitting it does not issue a refund or authorize shipment.",
              ],
              [
                "Commercial policy awaiting configuration",
                "Return windows, condition requirements, exclusions, return shipping costs, exchange options, warranty and refund timelines have not been approved. Automated returns and payment refunds remain disabled until those rules and fulfillment integrations exist.",
              ],
              [
                "Damaged or wrong item",
                "For a future fulfilled order, keep the packaging and contact support. Do not post sensitive information. Private evidence uploads are not yet enabled.",
              ],
            ]
          : [
              [
                "Delivery regions",
                "India is the only demo checkout destination. You may browse from other countries, but international shipping and checkout require business configuration.",
              ],
              [
                "Charges and estimates",
                "This preview does not ship goods. Commercial shipping methods, charges, processing times, carrier estimates and taxes are not yet configured. No delivery date is promised.",
              ],
              [
                "Track an order",
                "Your account shows actual stored order status. Carrier integration is not installed; live tracking, split shipments and delivery estimates are not fabricated.",
              ],
              [
                "Address or delivery problems",
                "Create a support ticket linked to your order for an address issue, missing item or delivery question.",
              ],
            ]
        ).map(([title, text]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <div className="account-tools">
        <Link
          className="button dark"
          href={returns ? "/contact" : "/track-order"}
        >
          {returns ? "Start a return enquiry" : "Track order"}
        </Link>
        <Link className="text-link" href="/help">
          Help & FAQs ↗
        </Link>
      </div>
    </section>
  );
}
