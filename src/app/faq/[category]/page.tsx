import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FAQ_CATEGORIES,
  getCategoryMeta,
  getFaqsByCategory,
  type FaqCategorySlug,
} from "@/lib/faq-data";
import { FaqSearchBar } from "@/components/faq-search-bar";
import { ContactDrawerButton } from "@/components/contact-drawer-button";
import { ArrowRight, ChevronRight } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return FAQ_CATEGORIES.map((cat) => ({
    category: cat.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await params;
  const meta = getCategoryMeta(category);
  if (!meta) return { title: "Category Not Found | OVIA" };

  return {
    title: `${meta.name} — FAQ | OVIA Client Services`,
    description: meta.heroDescription,
  };
}

export default async function FaqCategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const categoryMeta = getCategoryMeta(category);

  if (!categoryMeta) {
    notFound();
  }

  const questions = getFaqsByCategory(category as FaqCategorySlug);

  return (
    <div className="faq-page-container">
      {/* BREADCRUMBS */}
      <nav className="faq-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <Link href="/faq">Client Services</Link>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <span aria-current="page">{categoryMeta.name}</span>
      </nav>

      {/* SEARCH HEADER */}
      <header className="faq-category-hero">
        <p className="faq-brand-eyebrow">OVIA · CLIENT SERVICES</p>
        <h1 className="faq-category-main-title">{categoryMeta.name}</h1>
        <p className="faq-category-main-subtitle">{categoryMeta.heroDescription}</p>

        <div className="faq-category-search-wrapper">
          <FaqSearchBar placeholder={`Search within ${categoryMeta.name.toLowerCase()}...`} />
        </div>
      </header>

      {/* TWO-COLUMN HELP CENTER LAYOUT */}
      <div className="faq-two-column-layout">
        {/* SIDEBAR NAVIGATION */}
        <aside className="faq-sidebar">
          <p className="faq-sidebar-eyebrow">CLIENT SERVICES</p>
          <ul className="faq-sidebar-menu">
            {FAQ_CATEGORIES.map((cat) => {
              const isActive = cat.slug === categoryMeta.slug;
              return (
                <li key={cat.slug}>
                  <Link
                    href={`/faq/${cat.slug}`}
                    className={`faq-sidebar-link ${isActive ? "is-active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span>{cat.name}</span>
                    {isActive && <span className="active-dot" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="faq-sidebar-contact-card">
            <p className="eyebrow">NEED ADVICE?</p>
            <p className="sidebar-contact-text">
              Our Client Advisors are here to answer your questions.
            </p>
            <ContactDrawerButton variant="secondary" className="full">
              CONTACT US
            </ContactDrawerButton>
          </div>
        </aside>

        {/* MAIN QUESTIONS LIST */}
        <main className="faq-category-content">
          <div className="faq-category-content-header">
            <h2>{categoryMeta.name} QUESTIONS</h2>
            <span className="faq-count">{questions.length} questions</span>
          </div>

          <div className="faq-questions-list">
            {questions.map((item) => (
              <Link
                key={item.id}
                href={`/faq/${item.category}/${item.slug}`}
                className="faq-question-row"
              >
                <span className="faq-question-text">{item.question}</span>
                <ArrowRight size={18} strokeWidth={1.5} className="faq-arrow-icon" />
              </Link>
            ))}
          </div>

          {/* NEED MORE HELP BANNER */}
          <div className="faq-assistance-box compact">
            <p className="eyebrow">ASSISTANCE</p>
            <h3>NEED MORE HELP?</h3>
            <p className="faq-assistance-text">
              Speak directly with an OVIA Client Advisor regarding your order, delivery or service inquiry.
            </p>
            <div className="faq-assistance-actions">
              <ContactDrawerButton variant="primary">
                CONTACT A CLIENT ADVISOR
              </ContactDrawerButton>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
