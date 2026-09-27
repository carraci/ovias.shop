"use client";

import { useState } from "react";
import Link from "next/link";
import { ContactDrawerButton } from "@/components/contact-drawer-button";
import {
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Upload,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";

interface FormData {
  category: string;
  productName: string;
  orderNumber: string;
  purchaseDate: string;
  registrationNumber: string;
  problemAreas: string[];
  description: string;
  uploadedImages: { [key: string]: string };
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export default function RequestAssistancePage() {
  const [step, setStep] = useState<number>(1);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [referenceCode, setReferenceCode] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    category: "",
    productName: "",
    orderNumber: "",
    purchaseDate: "",
    registrationNumber: "",
    problemAreas: [],
    description: "",
    uploadedImages: {},
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const categories = [
    { id: "bag", label: "Bag / Handbag", desc: "Leather or canvas everyday & weekend bags" },
    { id: "luggage", label: "Rolling Luggage", desc: "Aluminium or polycarbonate suitcases" },
    { id: "slg", label: "Small Leather Good", desc: "Wallets, card holders & passport covers" },
    { id: "accessory", label: "Accessory / Other", desc: "Luggage tags, straps, charms & cases" },
  ];

  const problemOptions = [
    "Handle",
    "Strap",
    "Zipper",
    "Wheels",
    "Lock",
    "Hardware",
    "Lining",
    "Exterior",
    "Personalisation",
    "Other",
  ];

  const toggleProblemArea = (item: string) => {
    setFormData((prev) => {
      const exists = prev.problemAreas.includes(item);
      return {
        ...prev,
        problemAreas: exists
          ? prev.problemAreas.filter((x) => x !== item)
          : [...prev.problemAreas, item],
      };
    });
  };

  const handleImageUploadSim = (slot: string) => {
    // Simulate attaching a photo slot
    setFormData((prev) => ({
      ...prev,
      uploadedImages: {
        ...prev.uploadedImages,
        [slot]: `attached-file-${slot}.jpg`,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `OVIA-CARE-${randomSuffix}`;
    setReferenceCode(code);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SUCCESS CONFIRMATION STATE
  if (submitted) {
    return (
      <div className="assistance-container">
        <div className="assistance-confirmed-card">
          <div className="confirmed-icon-circle">
            <CheckCircle2 size={40} strokeWidth={1.5} className="confirmed-icon" />
          </div>
          <p className="eyebrow">CONFIRMATION</p>
          <h1>REQUEST RECEIVED</h1>
          <p className="confirmed-lead">Thank you.</p>
          <p className="confirmed-text">
            An OVIA Client Advisor will review the information provided and contact you regarding the available service options.
          </p>

          <div className="confirmed-reference-box">
            <span className="reference-label">Reference Number</span>
            <span className="reference-value">{referenceCode}</span>
            <span className="reference-hint">Please retain this reference for all communications.</span>
          </div>

          <div className="confirmed-reminders">
            <p>
              <strong>Please Note:</strong> OVIA assessments are conducted individually. We do not generate automatic estimates or promises until our atelier master artisans have inspected the piece.
            </p>
          </div>

          <div className="confirmed-actions">
            <Link href="/" className="button dark">
              RETURN TO HOME
            </Link>
            <ContactDrawerButton variant="secondary">
              SPEAK WITH A CLIENT ADVISOR
            </ContactDrawerButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assistance-container">
      {/* BREADCRUMBS */}
      <nav className="faq-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <Link href="/care-service">Care Service</Link>
        <ChevronRight size={12} className="breadcrumb-separator" />
        <span aria-current="page">Request Assistance</span>
      </nav>

      {/* HEADER */}
      <header className="assistance-header">
        <p className="faq-brand-eyebrow">OVIA ATELIER CARE</p>
        <h1 className="assistance-title">REQUEST PRODUCT ASSISTANCE</h1>
        <p className="assistance-subtitle">
          Submit your piece for master craftsmanship assessment, component inspection, or atelier restoration.
        </p>

        {/* PROGRESS STEP BAR */}
        <div className="assistance-steps-nav">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              className={`step-indicator ${step === s ? "is-current" : step > s ? "is-complete" : ""}`}
            >
              <span className="step-num">{s}</span>
              <span className="step-label">
                {s === 1 && "Category"}
                {s === 2 && "Product"}
                {s === 3 && "Issue"}
                {s === 4 && "Details"}
                {s === 5 && "Images"}
                {s === 6 && "Contact"}
                {s === 7 && "Review"}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* MULTI-STEP FORM WRAPPER */}
      <form onSubmit={handleSubmit} className="assistance-form-card">
        {/* STEP 1: IDENTIFY PRODUCT */}
        {step === 1 && (
          <div className="assistance-step-content">
            <span className="step-counter">STEP 1 OF 7</span>
            <h2>Select Product Category</h2>
            <p className="step-instruction">
              Which silhouette requires professional evaluation?
            </p>

            <div className="category-selection-grid">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setFormData({ ...formData, category: c.id })}
                  className={`category-select-card ${formData.category === c.id ? "selected" : ""}`}
                >
                  <div className="cat-card-check">
                    {formData.category === c.id && <Check size={14} />}
                  </div>
                  <h3>{c.label}</h3>
                  <p>{c.desc}</p>
                </button>
              ))}
            </div>

            <div className="step-nav-buttons">
              <button
                type="button"
                disabled={!formData.category}
                onClick={() => setStep(2)}
                className="button dark"
              >
                CONTINUE TO PRODUCT INFO <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PRODUCT INFORMATION */}
        {step === 2 && (
          <div className="assistance-step-content">
            <span className="step-counter">STEP 2 OF 7</span>
            <h2>Product Information</h2>
            <p className="step-instruction">
              Provide any details you have regarding your creation.
            </p>

            <div className="form-fields-stack">
              <div className="input-group">
                <label htmlFor="productName">Product Name or Silhouette *</label>
                <input
                  id="productName"
                  type="text"
                  required
                  placeholder="e.g. OVIA Classic Cabin Luggage or Horizon Leather Tote"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="luxury-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="orderNumber">Order Number (Optional)</label>
                <input
                  id="orderNumber"
                  type="text"
                  placeholder="e.g. OVIA-10492"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  className="luxury-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="purchaseDate">Approximate Purchase Date</label>
                <input
                  id="purchaseDate"
                  type="text"
                  placeholder="e.g. October 2024 or 2 years ago"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="luxury-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="regNum">Product Registration / Serial Number (Optional)</label>
                <input
                  id="regNum"
                  type="text"
                  placeholder="Laser-engraved serial code on internal frame or badge"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="luxury-input"
                />
              </div>
            </div>

            <div className="step-nav-buttons split">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="button light"
              >
                <ArrowLeft size={16} /> BACK
              </button>
              <button
                type="button"
                disabled={!formData.productName.trim()}
                onClick={() => setStep(3)}
                className="button dark"
              >
                NEXT: SELECT ISSUES <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WHAT NEEDS ATTENTION? */}
        {step === 3 && (
          <div className="assistance-step-content">
            <span className="step-counter">STEP 3 OF 7</span>
            <h2>What Needs Attention?</h2>
            <p className="step-instruction">
              Select all elements of your piece that require assessment:
            </p>

            <div className="problem-checkbox-grid">
              {problemOptions.map((opt) => {
                const isSelected = formData.problemAreas.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleProblemArea(opt)}
                    className={`problem-pill-button ${isSelected ? "selected" : ""}`}
                  >
                    <div className="pill-checkbox">
                      {isSelected && <Check size={12} />}
                    </div>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="step-nav-buttons split">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="button light"
              >
                <ArrowLeft size={16} /> BACK
              </button>
              <button
                type="button"
                disabled={formData.problemAreas.length === 0}
                onClick={() => setStep(4)}
                className="button dark"
              >
                NEXT: DESCRIBE ISSUE <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: DESCRIBE THE ISSUE */}
        {step === 4 && (
          <div className="assistance-step-content">
            <span className="step-counter">STEP 4 OF 7</span>
            <h2>Describe the Issue</h2>
            <p className="step-instruction">
              Detail what occurred (e.g. airline transit impact, zipper snag, loose wheel bearing, or edge sealant wear).
            </p>

            <div className="input-group">
              <textarea
                rows={5}
                required
                placeholder="Please describe how the issue occurred and any functional symptoms you notice..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="luxury-textarea"
              />
            </div>

            <div className="step-nav-buttons split">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="button light"
              >
                <ArrowLeft size={16} /> BACK
              </button>
              <button
                type="button"
                disabled={!formData.description.trim()}
                onClick={() => setStep(5)}
                className="button dark"
              >
                NEXT: UPLOAD IMAGES <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: UPLOAD IMAGES */}
        {step === 5 && (
          <div className="assistance-step-content">
            <span className="step-counter">STEP 5 OF 7</span>
            <h2>Upload Product Images</h2>
            <p className="step-instruction">
              Clear photographs help our master craftspeople assess structural feasibility accurately.
            </p>

            <div className="image-upload-slots-grid">
              {[
                { id: "front", title: "Front View" },
                { id: "back", title: "Back View" },
                { id: "damaged", title: "Damaged Area (Close-up)" },
                { id: "additional", title: "Additional Angle" },
              ].map((slot) => {
                const isAttached = !!formData.uploadedImages[slot.id];
                return (
                  <div key={slot.id} className="upload-slot-card">
                    <span className="upload-slot-title">{slot.title}</span>
                    {isAttached ? (
                      <div className="upload-slot-attached">
                        <CheckCircle2 size={24} className="slot-check-icon" />
                        <span className="slot-filename">{formData.uploadedImages[slot.id]}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = { ...formData.uploadedImages };
                            delete copy[slot.id];
                            setFormData({ ...formData, uploadedImages: copy });
                          }}
                          className="text-link small"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleImageUploadSim(slot.id)}
                        className="upload-dropzone"
                      >
                        <Upload size={20} strokeWidth={1.5} />
                        <span>Select file to attach</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="step-nav-buttons split">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="button light"
              >
                <ArrowLeft size={16} /> BACK
              </button>
              <button
                type="button"
                onClick={() => setStep(6)}
                className="button dark"
              >
                NEXT: CONTACT INFO <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: CONTACT INFORMATION */}
        {step === 6 && (
          <div className="assistance-step-content">
            <span className="step-counter">STEP 6 OF 7</span>
            <h2>Contact Information</h2>
            <p className="step-instruction">
              Where should our Client Advisor contact you with evaluation findings?
            </p>

            <div className="form-fields-stack">
              <div className="input-group">
                <label htmlFor="contactName">Full Name *</label>
                <input
                  id="contactName"
                  type="text"
                  required
                  placeholder="e.g. Adarsh Sharma"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="luxury-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="contactEmail">Email Address *</label>
                <input
                  id="contactEmail"
                  type="email"
                  required
                  placeholder="e.g. adarsh@example.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="luxury-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="contactPhone">Phone / Mobile Number *</label>
                <input
                  id="contactPhone"
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="luxury-input"
                />
              </div>
            </div>

            <div className="step-nav-buttons split">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="button light"
              >
                <ArrowLeft size={16} /> BACK
              </button>
              <button
                type="button"
                disabled={!formData.contactName || !formData.contactEmail || !formData.contactPhone}
                onClick={() => setStep(7)}
                className="button dark"
              >
                REVIEW REQUEST <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW & SUBMIT */}
        {step === 7 && (
          <div className="assistance-step-content">
            <span className="step-counter">STEP 7 OF 7</span>
            <h2>Review Your Request</h2>
            <p className="step-instruction">
              Please verify your request details before transmitting to our atelier.
            </p>

            <div className="review-summary-card">
              <div className="review-row">
                <span className="review-label">Category</span>
                <span className="review-val">{formData.category.toUpperCase()}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Product Name</span>
                <span className="review-val">{formData.productName}</span>
              </div>
              {formData.orderNumber && (
                <div className="review-row">
                  <span className="review-label">Order Number</span>
                  <span className="review-val">{formData.orderNumber}</span>
                </div>
              )}
              {formData.purchaseDate && (
                <div className="review-row">
                  <span className="review-label">Purchase Date</span>
                  <span className="review-val">{formData.purchaseDate}</span>
                </div>
              )}
              <div className="review-row">
                <span className="review-label">Attention Areas</span>
                <span className="review-val">{formData.problemAreas.join(", ")}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Description</span>
                <span className="review-val">{formData.description}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Contact</span>
                <span className="review-val">
                  {formData.contactName} · {formData.contactEmail} · {formData.contactPhone}
                </span>
              </div>
            </div>

            <div className="review-disclaimer">
              <ShieldCheck size={20} className="review-shield-icon" />
              <p>
                By submitting this request, you authorize our Client Concierge to contact you via telephone or email to discuss bespoke service options. Submission does not constitute a guarantee of repairability or quote of fees.
              </p>
            </div>

            <div className="step-nav-buttons split">
              <button
                type="button"
                onClick={() => setStep(6)}
                className="button light"
              >
                <ArrowLeft size={16} /> BACK
              </button>
              <button
                type="submit"
                className="button dark"
              >
                SUBMIT CARE REQUEST <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
