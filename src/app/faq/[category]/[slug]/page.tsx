import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FAQ_ITEMS,
  getFaqBySlug,
  getCategoryMeta,
  getRelatedFaqs,
} from "@/lib/faq-data";
import { FaqFeedback } from "@/components/faq-feedback";
import { FaqContentRenderer } from "@/components/faq-content-renderer";
import { ContactDrawerButton } from "@/components/contact-drawer-button";
import { ArrowRight, ChevronRight } from "lucide-react";

interface FaqDetailPageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateStaticParams() {
  const params: { category: string; slug: string }[] = [];
  for (const item of FAQ_ITEMS) {
    params.push({ category: item.category, slug: item.slug });
    if (item.aliases) {
      for (const alias of item.aliases) {
        params.push({ category: item.category, slug: alias });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: FaqDetailPageProps) {
  const { category, slug } = await params;
  const item = getFaqBySlug(category, slug);
  if (!item) return { title: "Question Not Found | OVIA" };

  return {
    title: `${item.question} — OVIA Client Services`,
    description: item.answer.slice(0, 160),
  };
}

export default async function FaqDetailPage({ params }: FaqDetailPageProps) {
  const { category, slug } = await params;
  const item = getFaqBySlug(category, slug);
  const categoryMeta = getCategoryMeta(category);

  if (!item || !categoryMeta) {
    notFound();
  }

  const related = getRelatedFaqs(item, 4);

  return (
    <div className="faq-page-container">
      {/* BREADCRUMBS */}
      <nav className="faq-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <Link href="/faq">Client Services</Link>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <Link href={`/faq/${categoryMeta.slug}`}>{categoryMeta.name}</Link>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <span aria-current="page" className="breadcrumb-current-truncate">
          {item.question}
        </span>
      </nav>

      {/* ARTICLE WRAPPER */}
      <div className="faq-article-container">
        <div className="faq-article-header">
          <Link
            href={`/faq/${categoryMeta.slug}`}
            className="faq-article-category-tag"
          >
            {categoryMeta.name}
          </Link>
          <h1 className="faq-article-title">{item.question}</h1>
        </div>

        <div className="faq-divider" />

        <div className="faq-article-body">
          <FaqContentRenderer content={item.answer} />
          {item.subtext && (
            <p className="faq-article-subtext">{item.subtext}</p>
          )}
        </div>

        {/* FEEDBACK MODULE */}
        <div className="faq-article-feedback-wrapper">
          <FaqFeedback />
        </div>

        <div className="faq-divider" />

        {/* NEED MORE HELP SECTION */}
        <div className="faq-article-assistance">
          <p className="eyebrow">CLIENT SERVICES</p>
          <h3>NEED MORE HELP?</h3>
          <p>Our Client Advisors are available to assist you.</p>
          <div className="faq-assistance-actions">
            <ContactDrawerButton variant="primary">
              CONTACT US
            </ContactDrawerButton>
          </div>
        </div>

        {/* RELATED QUESTIONS */}
        {related.length > 0 && (
          <div className="faq-related-section">
            <div className="faq-related-header">
              <p className="eyebrow">CONTINUE EXPLORING</p>
              <h3>RELATED QUESTIONS</h3>
            </div>
            <div className="faq-questions-list">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/faq/${rel.category}/${rel.slug}`}
                  className="faq-question-row"
                >
                  <span className="faq-question-text">{rel.question}</span>
                  <ArrowRight size={18} strokeWidth={1.5} className="faq-arrow-icon" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
