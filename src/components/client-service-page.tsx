import "@/components/page-styles/client-services.css";
import Link from "next/link";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { clientServicesConfig as contact } from "@/lib/client-services-config";
import { helpTopics } from "@/lib/help-faqs";
import { StoreBanner } from "./discovery-sections";
import styles from "./client-service-page.module.css";

export function ClientServicePage() {
  const popular = [
    ["shopping-and-products", "How do I know whether a product is available?"],
    ["tracking", "How do I track my order?"],
    ["warranty", "What does the warranty cover?"],
    ["product-care", "How do I care for my luggage?"],
  ].map(([id, title]) => {
    const topic = helpTopics.find((item) => item.id === id)!;
    const answer =
      topic.questions.find((item) => item.question === title) ??
      topic.questions[0];
    return { title: answer.question, href: `/services/faq#${answer.id}` };
  });
  return (
    <div className={styles.page}>
      <section className={styles.intro}>
        <h1>Client Service</h1>
        <p>For inquiries or assistance do not hesitate to contact us.</p>
      </section>
      <div className={styles.layout}>
        <div className={styles.channels}>
          <section className={styles.channel}>
            <h2>
              <Phone size={20} aria-hidden="true" />
              CALL US
            </h2>
            <p>Our Client Advisors are available by phone.</p>
            <a className={styles.button} href={`tel:${contact.supportPhone}`}>
              {contact.supportPhoneDisplay}
            </a>
          </section>
          <section className={styles.channel}>
            <h2>
              <Mail size={20} aria-hidden="true" />
              SEND US A MESSAGE
            </h2>
            <p>
              Our Client Advisors are ready to assist you with any questions or
              requests. Send a message about your product, order or account.
            </p>
            <p>
              <a href={`mailto:${contact.supportEmail}`}>
                {contact.supportEmail}
              </a>
            </p>
            <Link className={styles.button} href="/contact">
              SEND US A MESSAGE
            </Link>
          </section>
          <section className={styles.channel}>
            <h2>
              <MessageCircle size={20} aria-hidden="true" />
              CONTACT US ON WHATSAPP
            </h2>
            <p>
              Connect with us via instant messaging for assistance from our
              Client Advisors.
            </p>
            <a
              className={styles.button}
              href={contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              WHATSAPP
            </a>
          </section>
          <section className={styles.channel}>
            <h2>
              <Mail size={20} aria-hidden="true" />
              SIGN UP FOR OUR NEWSLETTER
            </h2>
            <p>
              Discover new collections, special events and the world of OVIA.
            </p>
            <a className={styles.button} href="#ovia-newsletter">
              SIGN UP
            </a>
          </section>
        </div>
        <aside className={styles.questions} aria-labelledby="popular-questions">
          <h2 id="popular-questions">MOST POPULAR QUESTIONS</h2>
          <ul>
            {popular.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.title}</Link>
              </li>
            ))}
          </ul>
          <Link className={styles.faq} href="/services/faq">
            GO TO FAQ
          </Link>
        </aside>
      </div>
      <StoreBanner />
    </div>
  );
}
