"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import { Star, Upload, CheckCircle2, ChevronLeft, ChevronRight, X, ArrowLeft } from "lucide-react";
import { request, useStore } from "./store-provider";
import type { ProductReview } from "@/lib/types";
import styles from "./product-reviews.module.css";

interface ProductReviewsSectionProps {
  productSlug: string;
  productName: string;
  productSku?: string;
  productImage?: string;
}

export function ProductReviewsSection({
  productSlug,
  productName,
  productSku,
  productImage,
}: ProductReviewsSectionProps) {
  const { user } = useStore();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carousel & Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Multi-step Write Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | "success">(1);

  // Form Fields
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Lightbox State
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Auto-fill user email & name if logged in
  useEffect(() => {
    if (user) {
      if (user.email && !authorEmail) setAuthorEmail(user.email);
      if (user.name && !authorName) setAuthorName(user.name);
    }
  }, [user, authorEmail, authorName]);

  // Fetch real reviews from MongoDB API
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function loadReviews() {
      try {
        const res = await request<{
          success: boolean;
          averageRating: number;
          totalCount: number;
          reviews: ProductReview[];
        }>(`reviews?productSlug=${encodeURIComponent(productSlug)}`);

        if (!cancelled && res && res.success) {
          const list = res.reviews || [];
          setReviews(list);
          const count = res.totalCount ?? list.length;
          setTotalCount(count);
          setAverageRating(
            res.averageRating ??
              (count > 0
                ? Number((list.reduce((acc, r) => acc + (r.rating || 5), 0) / count).toFixed(1))
                : 0)
          );
        } else if (!cancelled) {
          setReviews([]);
          setTotalCount(0);
          setAverageRating(0);
        }
      } catch {
        if (!cancelled) {
          setReviews([]);
          setTotalCount(0);
          setAverageRating(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [productSlug]);

  // Customer Photos Strip (Collect all real uploaded customer photos)
  const allCustomerPhotos = useMemo(() => {
    const fromReviews: string[] = [];
    reviews.forEach((r) => {
      if (r.photos && r.photos.length > 0) {
        fromReviews.push(...r.photos);
      }
    });
    return [...new Set(fromReviews)].slice(0, 12);
  }, [reviews]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(reviews.length / itemsPerPage));
  const visibleReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return reviews.slice(start, start + itemsPerPage);
  }, [reviews, currentPage, itemsPerPage]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  // Slider thumb calculation
  const sliderLeftPercent = totalPages > 1 ? ((currentPage - 1) / (totalPages - 1)) * 75 : 0;

  // Handle Photo Upload via file input
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result && typeof reader.result === "string") {
            setUploadedPhotos((prev) => [...prev, reader.result as string].slice(0, 5));
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemovePhoto = (idx: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Open modal
  const openWriteModal = () => {
    setCurrentStep(1);
    setSubmitError("");
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStep(1);
    setSubmitError("");
  };

  // Submit Review Form
  const handleSubmitReview = async () => {
    setSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        productSku: productSku || `${productSlug}-default`,
        productSlug,
        productName,
        productImage: productImage || "/media/bags/attach-aluminium-briefcase-0.png",
        rating,
        title: title.trim() || productName,
        comment: comment.trim(),
        authorEmail: authorEmail.trim(),
        authorName: isAnonymous ? "Anonymous" : authorName.trim() || "Customer",
        isAnonymous,
        photos: uploadedPhotos,
      };

      const res = await request<{
        success: boolean;
        message?: string;
        review?: ProductReview;
        error?: string;
      }>("reviews", "POST", payload);

      if (res && res.success && res.review) {
        // Prepend new review immediately to list in real-time
        setReviews((prev) => {
          const updated = [res.review!, ...prev.filter((r) => r.id !== res.review!.id)];
          const newTotal = updated.length;
          const newAvg = Number(
            (updated.reduce((acc, r) => acc + (r.rating || 5), 0) / newTotal).toFixed(1)
          );
          setTotalCount(newTotal);
          setAverageRating(newAvg);
          return updated;
        });
        // Reset form
        setComment("");
        setTitle("");
        setUploadedPhotos([]);
        setRating(5);
        setHoverRating(0);

        setCurrentPage(1);
        setCurrentStep("success");
      } else {
        setSubmitError(res.error || "Failed to submit review. Please try again.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeStarRating = hoverRating || rating;

  return (
    <section className={styles.section} aria-label="Customer Reviews">
      {/* 1. Header with Real-time Count & Average Rating */}
      <div className={styles.sectionHeader}>
        <div className={styles.titleArea}>
          <h2 className={styles.sectionTitle}>Customer Reviews</h2>
          <div className={styles.scoreRow}>
            <Star size={18} className={styles.scoreStar} />
            <span className={styles.scoreNumber}>
              {totalCount > 0 ? averageRating.toFixed(1) : "0.0"}
            </span>
            <span className={styles.scoreCount}>
              {totalCount} {totalCount === 1 ? "Review" : "Reviews"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openWriteModal}
          className={styles.writeReviewBtn}
          title="Write a review for this product"
        >
          Write a Review
        </button>
      </div>

      {/* 2. Customer Photos Strip (Shown only when genuine customer photos exist) */}
      {allCustomerPhotos.length > 0 && (
        <div className={styles.photosStripContainer}>
          <div className={styles.photosStrip}>
            {allCustomerPhotos.map((src, idx) => (
              <div
                key={`photo-strip-${idx}`}
                className={styles.stripPhotoItem}
                onClick={() => setLightboxImg(src)}
                title="View customer photo"
              >
                <img
                  src={src}
                  alt={`Customer photo ${idx + 1}`}
                  className={styles.stripPhotoImg}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Real-time Reviews Display */}
      {isLoading ? (
        <div className={styles.loadingGrid} aria-label="Loading reviews">
          <div className={styles.loadingCard} />
          <div className={styles.loadingCard} />
          <div className={styles.loadingCard} />
        </div>
      ) : reviews.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrap}>
            <Star size={24} />
          </div>
          <h3 className={styles.emptyTitle}>No customer reviews yet</h3>
          <p className={styles.emptySubtitle}>
            Be the first to review <strong>{productName}</strong> and share your thoughts with other shoppers!
          </p>
          <button
            type="button"
            onClick={openWriteModal}
            className={styles.writeReviewBtn}
          >
            Write the First Review
          </button>
        </div>
      ) : (
        <>
          <div className={styles.cardsTrackWrapper}>
            <div className={styles.cardsGrid}>
              {visibleReviews.map((rev) => {
                const formattedDate = (() => {
                  try {
                    const d = new Date(rev.createdAt);
                    const day = String(d.getDate()).padStart(2, "0");
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const year = d.getFullYear();
                    return `${day}/${month}/${year}`;
                  } catch {
                    return "Recently";
                  }
                })();

                return (
                  <article key={rev.id} className={styles.reviewCard}>
                    <div className={styles.cardTop}>
                      {/* Stars */}
                      <div className={styles.cardStarsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={15}
                            fill={s <= rev.rating ? "#F59E0B" : "none"}
                            color={s <= rev.rating ? "#F59E0B" : "#D1D5DB"}
                          />
                        ))}
                      </div>

                      {/* Author & Verified Badge */}
                      <div className={styles.authorRow}>
                        <span>— {rev.userName}</span>
                        {rev.verified && (
                          <span className={styles.verifiedBadge}>Verified</span>
                        )}
                      </div>

                      {/* Date */}
                      <p className={styles.cardDate}>{formattedDate}</p>

                      {/* Review Title */}
                      <h3 className={styles.cardTitle}>{rev.title}</h3>

                      {/* Review Comment */}
                      <p className={styles.cardComment}>{rev.comment}</p>

                      {/* Attached photos if any */}
                      {rev.photos && rev.photos.length > 0 && (
                        <div className={styles.cardPhotosRow}>
                          {rev.photos.slice(0, 3).map((pSrc, pIdx) => (
                            <div
                              key={pIdx}
                              className={styles.cardPhotoThumb}
                              onClick={() => setLightboxImg(pSrc)}
                            >
                              <img
                                src={pSrc}
                                alt="Review attachment"
                                className={styles.cardPhotoImg}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom product container */}
                    <Link
                      href={`/products/${rev.productSlug || productSlug}`}
                      className={styles.productRefPill}
                    >
                      <></>
                      <div className={styles.productRefDetails}>
                        <span className={styles.productRefLabel}>Review for</span>
                        <span className={styles.productRefTitle}>{rev.productName}</span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>

          {/* 4. Horizontal Slider Bar (Only if multiple pages exist) */}
          {totalPages > 1 && (
            <div className={styles.sliderControlsRow}>
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={styles.sliderArrowBtn}
                aria-label="Previous reviews slide"
              >
                <ChevronLeft size={18} />
              </button>

              <div
                className={styles.sliderTrack}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = clickX / rect.width;
                  const targetPage = Math.max(1, Math.min(totalPages, Math.ceil(ratio * totalPages)));
                  setCurrentPage(targetPage);
                }}
              >
                <div
                  className={styles.sliderThumb}
                  style={{
                    left: `${sliderLeftPercent}%`,
                    width: `${Math.max(15, 100 / totalPages)}%`,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={styles.sliderArrowBtn}
                aria-label="Next reviews slide"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* 5. Real Pagination Row (Only if multiple pages exist) */}
          {totalPages > 1 && (
            <nav className={styles.paginationRow} aria-label="Reviews pagination">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={styles.pageNumberBtn}
                aria-label="Go to previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {pageNumbers.map((pNum, idx) =>
                typeof pNum === "number" ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(pNum)}
                    className={`${styles.pageNumberBtn} ${
                      currentPage === pNum ? styles.pageNumberActive : ""
                    }`}
                  >
                    {pNum}
                  </button>
                ) : (
                  <span key={idx} style={{ color: "#9CA3AF", padding: "0 4px" }}>
                    {pNum}
                  </span>
                )
              )}

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className={styles.pageNumberBtn}
                aria-label="Go to next page"
              >
                <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </>
      )}

      {/* ==========================================================
          MULTI-STEP "WRITE A REVIEW" MODAL (Images 2, 3, 4, 5)
          ========================================================== */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button */}
            <button
              type="button"
              className={styles.closeModalBtn}
              onClick={closeModal}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* STEP 1: How would you rate this product? (Image 2) */}
            {currentStep === 1 && (
              <div>
                <h3 className={styles.modalTitle}>How would you rate this product?</h3>
                <p className={styles.modalSubtitle}>
                  We would love it if you would share a bit about your experience.
                </p>

                {/* Centered Product Image */}
                <div className={styles.productHeroWrap}>
                  <></>
                </div>

                {/* Product Name */}
                <h4 className={styles.productModalName}>{productName}</h4>

                {/* 5 Large Interactive Teal Stars */}
                <div className={styles.starsInteractiveRow}>
                  {[1, 2, 3, 4, 5].map((s) => {
                    const isFilled = s <= activeStarRating;
                    return (
                      <button
                        key={s}
                        type="button"
                        className={styles.tealStarBtn}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => {
                          setRating(s);
                          setCurrentStep(2);
                        }}
                        aria-label={`Rate ${s} out of 5 stars`}
                      >
                        <Star
                          size={44}
                          strokeWidth={1.5}
                          fill={isFilled ? "#0B6B5D" : "none"}
                          color="#0B6B5D"
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Labels: Poor and Great */}
                <div className={styles.starRatingLabelsRow}>
                  <span>Poor</span>
                  <span>Great</span>
                </div>
              </div>
            )}

            {/* STEP 2: Review content & Title (Image 3) */}
            {currentStep === 2 && (
              <div>
                {/* Product Name at top */}
                <h4 className={styles.productModalName} style={{ marginBottom: "14px" }}>
                  {productName}
                </h4>

                {/* Star rating with Poor & Great */}
                <div className={styles.starsInteractiveRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={styles.tealStarBtn}
                      onClick={() => setRating(s)}
                      aria-label={`Change rating to ${s}`}
                    >
                      <Star
                        size={32}
                        strokeWidth={1.5}
                        fill={s <= rating ? "#0B6B5D" : "none"}
                        color="#0B6B5D"
                      />
                    </button>
                  ))}
                </div>
                <div className={styles.starRatingLabelsRow} style={{ marginBottom: "20px" }}>
                  <span>Poor</span>
                  <span>Great</span>
                </div>

                {/* Review content (Required) */}
                <div className={styles.formGroup}>
                  <label htmlFor="reviewContent" className={styles.formLabel}>
                    Review content (Required)
                  </label>
                  <textarea
                    id="reviewContent"
                    className={`${styles.textareaField} ${
                      comment.trim().length > 0 && comment.trim().length < 5 ? styles.inputError : ""
                    }`}
                    placeholder="Start writing here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                  {comment.trim().length > 0 && comment.trim().length < 5 && (
                    <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", fontWeight: 500 }}>
                      Review content must be at least 5 characters long.
                    </p>
                  )}
                </div>

                {/* Review Title */}
                <div className={styles.formGroup}>
                  <label htmlFor="reviewTitle" className={styles.formLabel}>
                    Review Title
                  </label>
                  <input
                    id="reviewTitle"
                    type="text"
                    className={styles.inputField}
                    placeholder="Give your review a title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Legal notice */}
                <p className={styles.legalNotice}>
                  We&apos;ll only contact you about your review if necessary. By submitting your
                  review, you agree to our <a href="/terms">terms and conditions</a> and{" "}
                  <a href="/privacy">privacy policy</a>.
                </p>

                {/* Bottom Navigation */}
                <div className={styles.modalNavRow}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={styles.backBtn}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    disabled={comment.trim().length < 5}
                    onClick={() => setCurrentStep(3)}
                    className={styles.nextBtn}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: About you (Image 4) */}
            {currentStep === 3 && (
              <div>
                <h3 className={styles.modalTitle}>About you</h3>
                <p className={styles.modalSubtitle}>Please tell us more about you.</p>

                {/* Email address (Required) */}
                {(() => {
                  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail.trim());
                  const emailHasError = authorEmail.trim().length > 0 && !isEmailValid;
                  const nameHasError = !isAnonymous && authorEmail.trim().length > 0 && authorName.trim().length === 0;

                  return (
                    <>
                      <div className={styles.formGroup}>
                        <label htmlFor="userEmail" className={styles.formLabel}>
                          Email address (Required)
                        </label>
                        <input
                          id="userEmail"
                          type="email"
                          className={`${styles.inputField} ${emailHasError ? styles.inputError : ""}`}
                          placeholder="Your email address (e.g. name@domain.com)"
                          value={authorEmail}
                          onChange={(e) => setAuthorEmail(e.target.value)}
                        />
                        {emailHasError ? (
                          <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", fontWeight: 500 }}>
                            Please enter a valid email address (e.g., name@example.com).
                          </p>
                        ) : (
                          <p className={styles.helperText}>We respect your privacy.</p>
                        )}
                      </div>

                      {/* Display name (Required) */}
                      <div className={styles.formGroup}>
                        <label htmlFor="displayName" className={styles.formLabel}>
                          Display name (Required)
                        </label>
                        <input
                          id="displayName"
                          type="text"
                          className={`${styles.inputField} ${nameHasError ? styles.inputError : ""}`}
                          placeholder="Display name"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          disabled={isAnonymous}
                        />
                        {nameHasError && (
                          <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", fontWeight: 500 }}>
                            Display name is required if not posting as anonymous.
                          </p>
                        )}
                      </div>

                      {/* Post review as anonymous */}
                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className={styles.checkboxInput}
                        />
                        <span>Post review as anonymous</span>
                      </label>

                      {/* Bottom Navigation */}
                      <div className={styles.modalNavRow}>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className={styles.backBtn}
                        >
                          <ArrowLeft size={16} /> Back
                        </button>
                        <button
                          type="button"
                          disabled={!isEmailValid || (!isAnonymous && !authorName.trim())}
                          onClick={() => setCurrentStep(4)}
                          className={styles.nextBtn}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* STEP 4: Share a picture (Image 5) */}
            {currentStep === 4 && (
              <div>
                <h3 className={styles.modalTitle}>Share a picture</h3>
                <p className={styles.modalSubtitle}>Upload a photo to support your review.</p>

                {/* Dropzone */}
                <label className={styles.dropzone}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />
                  <Upload size={38} className={styles.uploadIcon} />
                  <p className={styles.dropzoneText}>
                    <span className={styles.dropzoneBold}>Click to upload</span> or drag and drop
                  </p>
                  <p className={styles.dropzoneHint}>PNG, JPG or WebP (Max 5 photos)</p>
                </label>

                {/* Previews of uploaded images */}
                {uploadedPhotos.length > 0 && (
                  <div className={styles.previewGrid}>
                    {uploadedPhotos.map((src, idx) => (
                      <div key={idx} className={styles.previewThumbWrap}>
                        <img
                          src={src}
                          alt={`Uploaded photo ${idx + 1}`}
                          className={styles.previewThumbImg}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className={styles.removeThumbBtn}
                          aria-label="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {submitError && (
                  <p style={{ color: "#DC2626", fontSize: "13px", marginTop: "12px" }}>
                    {submitError}
                  </p>
                )}

                {/* Bottom Navigation */}
                <div className={styles.modalNavRow}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className={styles.backBtn}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmitReview}
                    className={styles.nextBtn}
                  >
                    {submitting ? "Submitting..." : "Next"}
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS CONFIRMATION */}
            {currentStep === "success" && (
              <div className={styles.successWrap}>
                <div className={styles.successCheckIcon}>
                  <CheckCircle2 size={36} color="#0B6B5D" />
                </div>
                <h3 className={styles.modalTitle} style={{ marginBottom: "10px" }}>
                  Thank you for your review!
                </h3>
                <p className={styles.modalSubtitle} style={{ marginBottom: "28px" }}>
                  Your review has been submitted and is now visible to all shoppers.
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className={styles.nextBtn}
                  style={{ width: "100%", margin: 0 }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox for Customer Photos */}
      {lightboxImg && (
        <div className={styles.lightboxBackdrop} onClick={() => setLightboxImg(null)}>
          <div className={styles.lightboxImgWrap} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={() => setLightboxImg(null)}
              aria-label="Close preview"
            >
              ✕
            </button>
            <img src={lightboxImg} alt="Customer photo enlarged" className={styles.lightboxImg} />
          </div>
        </div>
      )}
    </section>
  );
}
