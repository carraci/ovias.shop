import "@/components/page-styles/editorial.css";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { stores, getStoreBySlug, getDirectionsUrl } from "@/lib/stores";

interface StoreDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return stores.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: StoreDetailPageProps) {
  const { slug } = await params;
  const store = getStoreBySlug(slug);
  if (!store) return { title: "Store Not Found — OVIA" };
  return {
    title: `${store.name} — OVIA Luxury Stores India`,
    description: `Discover ${store.name} in ${store.city}, ${store.state}. Visit for luxury travel collections, bespoke personalisation, and client advisor services.`,
  };
}

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const { slug } = await params;
  const store = getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const daysSchedule = [
    { day: "Monday", hours: store.openingHours.monday },
    { day: "Tuesday", hours: store.openingHours.tuesday },
    { day: "Wednesday", hours: store.openingHours.wednesday },
    { day: "Thursday", hours: store.openingHours.thursday },
    { day: "Friday", hours: store.openingHours.friday },
    { day: "Saturday", hours: store.openingHours.saturday },
    { day: "Sunday", hours: store.openingHours.sunday },
  ];

  return (
    <div className="ovia-store-detail-page">
      {/* Navigation Breadcrumb */}
      <div className="ovia-store-detail-nav">
        <Link href="/stores" className="ovia-back-link">
          <ArrowLeft size={16} />
          <span>ALL STORES IN INDIA</span>
        </Link>
        <span className="ovia-detail-demo-pill">DEMO SHOWROOM</span>
      </div>

      <div className="ovia-store-detail-container">
        {/* Header Block */}
        <header className="ovia-store-detail-header">
          <p className="eyebrow">OVIA BOUTIQUE</p>
          <h1 className="ovia-store-detail-title">
            {store.city.toUpperCase()} — {store.area.toUpperCase()}
          </h1>
          <p className="ovia-store-detail-subtitle">{store.name}</p>
        </header>

        {/* Hero Editorial Image */}
        <div className="ovia-store-detail-hero">
          <div className="ovia-store-hero-img-wrap">
            <Image
              src={store.image}
              alt={`${store.name} showroom interior`}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="ovia-store-hero-img"
            />
            <div className="ovia-store-hero-overlay" />
            <span className="ovia-store-hero-tag">
              OVIA ARCHITECTURAL STUDY · {store.city.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content Two-Column Grid */}
        <div className="ovia-store-detail-grid">
          {/* Left Column: Address, Actions, Contact */}
          <div className="ovia-store-detail-main">
            <section className="ovia-detail-card address-card">
              <h2 className="ovia-detail-section-title">
                <MapPin size={18} /> ADDRESS & ACCESS
              </h2>
              <address className="ovia-detail-address">
                <p className="store-full-name">{store.name}</p>
                <p>{store.address}</p>
                <p>India</p>
              </address>

              <div className="ovia-detail-action-buttons">
                <a
                  href={getDirectionsUrl(store)}
                  target="_blank"
                  rel="noreferrer"
                  className="button light ovia-action-primary"
                >
                  GET DIRECTIONS <ArrowUpRight size={17} />
                </a>

                <Link href="/stores" className="button secondary ovia-action-secondary">
                  VIEW ON MAP
                </Link>
              </div>
            </section>

            {/* Services Available */}
            <section className="ovia-detail-card services-card">
              <h2 className="ovia-detail-section-title">
                <ShieldCheck size={18} /> IN-STORE SERVICES
              </h2>
              <p className="ovia-services-desc">
                Experience bespoke OVIA hospitality, complimentary hot stamping personalisation, and personalized styling appointments.
              </p>
              <div className="ovia-detail-services-grid">
                {store.services.map((srv) => (
                  <div key={srv} className="ovia-service-badge-item">
                    <CheckCircle2 size={16} className="ovia-service-icon" />
                    <span>{srv}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Client Advisor Contact */}
            <section className="ovia-detail-card contact-card">
              <h2 className="ovia-detail-section-title">CLIENT SERVICES</h2>
              <p className="ovia-contact-desc">
                Contact our client advisors before your visit to arrange a private collection viewing or reserve items in advance.
              </p>
              <div className="ovia-contact-links">
                <div className="ovia-contact-row">
                  <Phone size={16} />
                  <span>{store.phone}</span>
                </div>
                <div className="ovia-contact-row">
                  <Mail size={16} />
                  <span>{store.email}</span>
                </div>
              </div>
              <div className="ovia-contact-cta">
                <Link href="/contact-us" className="button secondary">
                  CONTACT US <ArrowUpRight size={16} />
                </Link>
              </div>
            </section>
          </div>

          {/* Right Column: Opening Hours & Notice */}
          <div className="ovia-store-detail-side">
            <section className="ovia-detail-card hours-card">
              <h2 className="ovia-detail-section-title">
                <Clock size={18} /> OPENING HOURS
              </h2>
              <table className="ovia-hours-table">
                <tbody>
                  {daysSchedule.map((item) => (
                    <tr key={item.day} className="ovia-hours-row">
                      <td className="ovia-day-name">{item.day}</td>
                      <td className="ovia-day-hours">{item.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="ovia-hours-note">
                <span>Personal styling consultations available by reservation during all opening hours.</span>
              </div>
            </section>

            {/* Fictional Academic Project Notice */}
            <div className="ovia-detail-disclaimer-box">
              <p className="disclaimer-title">DEMO STORE RECORD</p>
              <p className="disclaimer-text">
                This store location is created for demonstration and academic showcase purposes for the OVIA luxury experience. No real commercial transactions or physical store operations exist at this address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
