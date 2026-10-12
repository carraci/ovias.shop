import "@/components/page-styles/editorial.css";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CARE_CATEGORIES,
  getCareCategoryBySlug,
} from "@/lib/care-data";
import { FAQ_ITEMS } from "@/lib/faq-data";
import { ContactDrawerButton } from "@/components/contact-drawer-button";
import {
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Wrench,
} from "lucide-react";

interface CareCategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return CARE_CATEGORIES.map((c) => ({
    category: c.slug,
  }));
}

export async function generateMetadata({ params }: CareCategoryPageProps) {
  const { category } = await params;
  const guide = getCareCategoryBySlug(category);
  if (!guide) return { title: "Care Guide Not Found | OVIA" };

  return {
    title: `${guide.title} — Care Guide | OVIA Care Service`,
    description: guide.description,
  };
}

export default async function CareCategoryPage({ params }: CareCategoryPageProps) {
  const { category } = await params;
  const guide = getCareCategoryBySlug(category);

  if (!guide) {
    notFound();
  }

  // Split sections for luxury editorial rhythm with detail image
  const firstHalf = guide.sections.slice(0, Math.ceil(guide.sections.length / 2));
  const secondHalf = guide.sections.slice(Math.ceil(guide.sections.length / 2));

  const relatedFaqs = FAQ_ITEMS.filter((item) =>
    guide.relatedFaqSlugs.includes(item.slug)
  );

  return (
    <div className="care-guide-container">
      {/* BREADCRUMBS */}
      <nav className="faq-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <Link href="/care-service">Care Service</Link>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <span aria-current="page">{guide.title}</span>
      </nav>

      {/* ARTICLE HERO */}
      <header className="care-guide-header">
        <span className="care-guide-number">{guide.number}</span>
        <h1 className="care-guide-title">{guide.title}</h1>
        <p className="care-guide-subtitle">{guide.subtitle}</p>
        <p className="care-guide-lead">{guide.description}</p>

        {guide.materialsCovered.length > 0 && (
          <div className="care-materials-tags">
            <span className="care-materials-label">Covers:</span>
            {guide.materialsCovered.map((mat) => (
              <span key={mat} className="care-material-badge">
                {mat}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* LARGE PRODUCT IMAGE */}
      <div className="care-guide-primary-image">
        <Image
          src={guide.heroImage}
          alt={`${guide.title} care illustration`}
          width={1200}
          height={750}
          priority
          className="editorial-full-img"
        />
      </div>

      {/* CHECKLIST (IF APPLICABLE, E.G. ROLLING LUGGAGE) */}
      {guide.checklist && guide.checklist.length > 0 && (
        <section className="care-checklist-banner">
          <p className="eyebrow">PRE-DEPARTURE PROTOCOL</p>
          <h2>BEFORE EVERY JOURNEY</h2>
          <div className="care-checklist-grid">
            {guide.checklist.map((item, idx) => (
              <div key={idx} className="care-checklist-item">
                <CheckCircle2 size={18} className="care-check-icon" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FIRST HALF EDITORIAL SECTIONS */}
      <section className="care-sections-block">
        {firstHalf.map((sec) => (
          <div key={sec.number} className="care-editorial-row">
            <div className="care-row-left">
              <span className="care-row-num">{sec.number}</span>
              <h3>{sec.title}</h3>
            </div>
            <div className="care-row-right">
              <p className="care-row-guidance">{sec.guidance}</p>
              {sec.tips && sec.tips.length > 0 && (
                <ul className="care-row-tips">
                  {sec.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* SECONDARY DETAIL IMAGE */}
      <div className="care-guide-secondary-image">
        <Image
          src={guide.detailImage}
          alt={`${guide.title} close-up craftsmanship`}
          width={1200}
          height={650}
          className="editorial-detail-img"
        />
      </div>

      {/* SECOND HALF EDITORIAL SECTIONS */}
      {secondHalf.length > 0 && (
        <section className="care-sections-block">
          {secondHalf.map((sec) => (
            <div key={sec.number} className="care-editorial-row">
              <div className="care-row-left">
                <span className="care-row-num">{sec.number}</span>
                <h3>{sec.title}</h3>
              </div>
              <div className="care-row-right">
                <p className="care-row-guidance">{sec.guidance}</p>
                {sec.tips && sec.tips.length > 0 && (
                  <ul className="care-row-tips">
                    {sec.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* WARNINGS / RESTRICTIONS */}
      {guide.warnings && guide.warnings.length > 0 && (
        <section className="care-warnings-section">
          <div className="care-warnings-box">
            <div className="care-warning-header">
              <AlertTriangle size={20} className="care-warning-icon" />
              <h3>IMPORTANT CONSIDERATIONS</h3>
            </div>
            <ul>
              {guide.warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ATELIER ASSISTANCE & CONTACT ACTIONS */}
      <section className="care-guide-actions-section">
        <div className="care-guide-action-card">
          <Wrench size={24} strokeWidth={1.5} className="care-action-icon" />
          <p className="eyebrow">ATELIER CRAFTSMANSHIP</p>
          <h3>DOES YOUR PRODUCT REQUIRE ASSESSMENT?</h3>
          <p>
            If your OVIA creation has encountered transit strain, hardware damage, or requires restamping, our master artisans are at your service.
          </p>
          <div className="care-action-btns">
            <Link
              href="/care-service/request-assistance"
              className="button dark"
            >
              REQUEST ASSISTANCE <ArrowRight size={16} />
            </Link>
            <ContactDrawerButton variant="secondary">
              SPEAK WITH A CLIENT ADVISOR
            </ContactDrawerButton>
          </div>
        </div>
      </section>

      {/* RELATED CARE FAQS */}
      {relatedFaqs.length > 0 && (
        <section className="care-guide-faqs-section">
          <div className="faq-section-header">
            <p className="eyebrow">KNOWLEDGE BASE</p>
            <h3>RELATED CARE QUESTIONS</h3>
            <div className="faq-divider" />
          </div>

          <div className="faq-questions-list">
            {relatedFaqs.map((faq) => (
              <Link
                key={faq.id}
                href={`/faq/${faq.category}/${faq.slug}`}
                className="faq-question-row"
              >
                <span className="faq-question-text">{faq.question}</span>
                <ArrowRight size={18} strokeWidth={1.5} className="faq-arrow-icon" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
