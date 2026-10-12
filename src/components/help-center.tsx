"use client";
import "@/components/page-styles/client-services.css";


import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Search,
  X,
  ShoppingBag,
  Luggage,
  ShoppingCart,
  CreditCard,
  Truck,
  Package,
  ShieldCheck,
  UserRound,
  Mail,
  FileText,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { helpTopics } from "@/lib/help-faqs";
import styles from "./help-center.module.css";

const cards = [
  {
    title: "Shopping & Products",
    topic: "shopping-and-products",
    icon: ShoppingBag,
    image: "/media/account/wishlist-signature-tote.png",
  },
  {
    title: "Luggage",
    topic: "luggage",
    icon: Luggage,
    image: "/media/megamenu/mega-luggage-original.webp",
  },
  {
    title: "Bags",
    topic: "bags",
    icon: ShoppingBag,
    image: "/media/bags/never-still-canvas-flap-backpack-large.png",
  },
  { title: "Orders & Checkout", topic: "placing-an-order", icon: ShoppingCart },
  { title: "Payments & Coupons", topic: "payments", icon: CreditCard },
  { title: "Shipping & Tracking", topic: "shipping-and-delivery", icon: Truck },
  { title: "Returns & Refunds", topic: "returns", icon: Package },
  { title: "Warranty & Product Care", topic: "warranty", icon: ShieldCheck },
  { title: "Account & Login", topic: "account-and-login", icon: UserRound },
  { title: "OTP & Security", topic: "otp-and-verification", icon: Mail },
  { title: "Invoice & Billing", topic: "invoice-and-billing", icon: FileText },
  {
    title: "Contact & Support",
    topic: "contact-and-support",
    icon: MessageSquare,
  },
];

export function HelpCenter() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(helpTopics[0].id);
  const [open, setOpen] = useState<string | null>(
    helpTopics[0].questions[0].id,
  );
  useEffect(() => {
    const followHash = () => {
      const id = window.location.hash.slice(1);
      const topic = helpTopics.find(
        (item) =>
          item.id === id ||
          item.questions.some((question) => question.id === id),
      );
      if (!topic) return;
      setSelected(topic.id);
      setQuery("");
      setOpen(
        topic.questions.find((question) => question.id === id)?.id ??
          topic.questions[0].id,
      );
      requestAnimationFrame(() =>
        document
          .getElementById("faq-answers")
          ?.scrollIntoView({ block: "start" }),
      );
    };
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, []);
  const topic =
    helpTopics.find((item) => item.id === selected) ?? helpTopics[0];
  const term = query.trim().toLowerCase();
  const results = term
    ? helpTopics.flatMap((item) =>
        item.questions
          .filter((question) =>
            `${item.title} ${question.question} ${question.answer}`
              .toLowerCase()
              .includes(term),
          )
          .map((question) => ({ ...question, topic: item.title })),
      )
    : topic.questions.map((question) => ({ ...question, topic: topic.title }));
  function choose(id: string, scroll = false) {
    const next = helpTopics.find((item) => item.id === id);
    if (!next) return;
    setSelected(id);
    setQuery("");
    setOpen(next.questions[0].id);
    if (scroll)
      document
        .getElementById("faq-answers")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="faq-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>HELP & SUPPORT</p>
          <h1 id="faq-title">
            Frequently Asked
            <br />
            Questions
          </h1>
          <p>
            Find answers about shopping, bags, luggage, orders, payments,
            shipping, returns and more.
          </p>
          <div className={styles.search}>
            <Search size={21} aria-hidden="true" />
            <input
              aria-label="Search FAQs"
              type="search"
              placeholder="Search FAQs…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(null);
              }}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear FAQ search"
                onClick={() => {
                  setQuery("");
                  setOpen(topic.questions[0].id);
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        <div className={styles.heroProducts} aria-hidden="true">
          <div className={styles.heroIllustrationCard}>
            <Image
              src="/media/faq-illustration.png"
              alt="Frequently Asked Questions"
              width={480}
              height={316}
              className={styles.heroIllustrationImg}
              priority
            />
          </div>
        </div>
      </section>
      <div className={styles.content}>
        <section aria-labelledby="browse-title">
          <h2 id="browse-title">Browse by Topic</h2>
          <div className={styles.cards}>
            {cards.map(({ title, topic: id, icon: Icon, image }) => (
              <button
                type="button"
                key={title}
                onClick={() => choose(id, true)}
                className={styles.card}
              >
                {image ? (
                  <></>
                ) : (
                  <Icon size={36} strokeWidth={1.6} aria-hidden="true" />
                )}
                <span>
                  <strong>{title}</strong>
                  <small>
                    View FAQs <ArrowRight size={14} aria-hidden="true" />
                  </small>
                </span>
              </button>
            ))}
          </div>
        </section>
        <div className={styles.answersLayout} id="faq-answers">
          <nav className={styles.sidebar} aria-label="FAQ topics">
            {helpTopics.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={!term && selected === item.id}
                onClick={() => choose(item.id)}
              >
                {item.title}
              </button>
            ))}
          </nav>
          <div className={styles.mobileTopics}>
            <label htmlFor="faq-topic">Browse a topic</label>
            <select
              id="faq-topic"
              value={selected}
              onChange={(event) => choose(event.target.value)}
            >
              {helpTopics.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
          <section className={styles.answers} aria-labelledby="answers-title">
            <h2 id="answers-title">{term ? "Search results" : topic.title}</h2>
            <p className={styles.description}>
              {term
                ? `Answers matching “${query.trim()}” across all topics.`
                : `Find answers to your questions about ${topic.title.toLowerCase()}.`}
            </p>
            <p className={styles.count} role="status">
              {results.length} {results.length === 1 ? "answer" : "answers"}
            </p>
            {results.map((question) => (
              <div
                className={styles.question}
                key={question.id}
                id={question.id}
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={open === question.id}
                    aria-controls={`${question.id}-answer`}
                    onClick={() =>
                      setOpen(open === question.id ? null : question.id)
                    }
                  >
                    {question.question}
                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className={
                        open === question.id ? styles.rotated : undefined
                      }
                    />
                  </button>
                </h3>
                <div
                  id={`${question.id}-answer`}
                  hidden={open !== question.id}
                  className={styles.answer}
                >
                  {term && <small>{question.topic}</small>}
                  <p>{question.answer}</p>
                  <Link href={`/services/faq#${question.id}`}>
                    Link to this answer
                  </Link>
                </div>
              </div>
            ))}
            {!results.length && (
              <div className={styles.empty}>
                <h3>No matching answers</h3>
                <p>
                  Try a product name or a shorter phrase, such as “refund” or
                  “password”.
                </p>
                <button type="button" onClick={() => setQuery("")}>
                  Clear search
                </button>
              </div>
            )}
          </section>
        </div>
        <section className={styles.contact}>
          <div>
            <h2>Still need help?</h2>
            <p>
              Our OVIA advisors can help with your order, product or account.
            </p>
          </div>
          <Link href="/contact-us">
            Contact Us <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
