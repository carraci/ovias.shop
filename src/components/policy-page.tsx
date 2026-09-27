import Link from "next/link";
import { policies, policyUpdated } from "@/lib/policies";
export function PolicyPage({ name }: { name: string }) {
  const policy = policies[name];
  return (
    <section className="section policy-page">
      <p className="eyebrow">LEGAL & PRIVACY</p>
      <h1>{policy.title}</h1>
      <p>{policy.intro}</p>
      <p className="small-note">
        Last updated: {policyUpdated} · Preview document; commercial effective
        date pending.
      </p>
      <div className="policy-layout">
        <nav aria-label="On this page">
          {policy.sections.map(([title], i) => (
            <a key={title} href={`#section-${i}`}>
              {String(i + 1).padStart(2, "0")} / {title}
            </a>
          ))}
          <Link href="/legal">Privacy Center ↗</Link>
        </nav>
        <article>
          {policy.sections.map(([title, text], i) => (
            <section id={`section-${i}`} key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
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
export function LegalCenter() {
  return (
    <section className="section content-page">
      <p className="eyebrow">CLEAR INFORMATION. USEFUL CONTROLS.</p>
      <h1>
        Legal <em>& privacy.</em>
      </h1>
      <div className="help-links">
        {[
          ["Privacy Policy", "/privacy"],
          ["Terms & Conditions", "/terms"],
          ["Account security", "/security"],
          ["Accessibility", "/accessibility"],
          ["Cookie information", "/cookies"],
          ["Cookie preferences", "/cookie-preferences"],
          ["Privacy requests & data export", "/privacy/request"],
          ["Shipping", "/shipping"],
          ["Returns", "/returns"],
          ["Contact support", "/contact"],
        ].map(([label, href]) => (
          <Link href={href} key={href}>
            {label}
            <span>↗</span>
          </Link>
        ))}
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
