"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, type ChangeEvent } from "react";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  User,
  CreditCard,
  Star,
  Headphones,
  LogOut,
  CheckCircle2,
  Camera,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { request, useStore } from "./store-provider";
import type { ProductReview, ToReviewItem, ReviewAspects } from "@/lib/types";
import styles from "./account-reviews.module.css";

function formatDate(isoString?: string): string {
  if (!isoString) return "Recently";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function AccountReviews() {
  const router = useRouter();
  const { user, refresh } = useStore();
  const [activeTab, setActiveTab] = useState<"toReview" | "myReviews">("toReview");
  const [toReview, setToReview] = useState<ToReviewItem[]>([]);
  const [myReviews, setMyReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [targetItem, setTargetItem] = useState<ToReviewItem | null>(null);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [aspects, setAspects] = useState<ReviewAspects>({
    quality: 5,
    design: 5,
    valueForMoney: 5,
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch reviews & items to review
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await request<{
        success: boolean;
        toReview: ToReviewItem[];
        myReviews: ProductReview[];
      }>("reviews?mine=true");
      if (res && res.success) {
        setToReview(res.toReview || []);
        setMyReviews(res.myReviews || []);
      }
    } catch (err: any) {
      console.warn("Could not load reviews data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await request("auth/logout", "POST", {});
      await refresh();
      router.push("/account/sign-in");
    } catch {
      setSigningOut(false);
    }
  }

  // Open modal to write new review
  function handleOpenWriteReview(item: ToReviewItem) {
    setTargetItem(item);
    setEditingReview(null);
    setRating(5);
    setTitle("");
    setComment("");
    setAspects({ quality: 5, design: 5, valueForMoney: 5 });
    setPhotos([]);
    setFormError(null);
    setIsSuccessModal(false);
    setIsModalOpen(true);
  }

  // Open modal to edit existing review
  function handleOpenEditReview(review: ProductReview) {
    setEditingReview(review);
    setTargetItem({
      orderId: review.orderId || "",
      orderNumber: review.orderNumber || "",
      sku: review.productSku,
      name: review.productName,
      color: review.productColor,
      image: review.productImage,
      slug: review.productSlug,
      deliveredAtFormatted: formatDate(review.createdAt),
    });
    setRating(review.rating || 5);
    setTitle(review.title || "");
    setComment(review.comment || "");
    setAspects({
      quality: review.aspects?.quality || 5,
      design: review.aspects?.design || 5,
      valueForMoney: review.aspects?.valueForMoney || 5,
    });
    setPhotos(review.photos || []);
    setFormError(null);
    setIsSuccessModal(false);
    setIsModalOpen(true);
  }

  // Delete review
  async function handleDeleteReview(reviewId: string) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await request(`reviews?id=${reviewId}`, "DELETE");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete review.");
    }
  }

  // Handle local photo upload
  function handleAddPhoto(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (photos.length >= 5) {
      alert("Maximum 5 photos allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotos((prev) => [...prev.slice(0, 4), result]);
      }
    };
    reader.readAsDataURL(files[0]);
  }

  // Quick luxury photo gallery attachments
  function handleAddPresetPhoto(imgUrl: string) {
    if (photos.length >= 5) return;
    setPhotos((prev) => [...prev, imgUrl]);
  }

  function handleRemovePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  // Submit review form
  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!targetItem) return;
    if (!title.trim()) {
      setFormError("Please enter a review title.");
      return;
    }
    if (!comment.trim()) {
      setFormError("Please write your review comment.");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        id: editingReview?.id,
        productSku: targetItem.sku,
        productSlug: targetItem.slug,
        productName: targetItem.name,
        productColor: targetItem.color,
        productImage: targetItem.image,
        orderId: targetItem.orderId,
        orderNumber: targetItem.orderNumber,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        aspects,
        photos,
      };

      if (editingReview) {
        await request("reviews", "PUT", payload);
      } else {
        await request("reviews", "POST", payload);
      }

      await loadData();
      setIsSuccessModal(true);
    } catch (err: any) {
      setFormError(err.message || "Failed to submit review.");
    } finally {
      setFormSubmitting(false);
    }
  }

  return (
    <div className={styles.portalWrapper}>
      <div className={styles.portalContainer}>
        {/* Left Sidebar matching Image 3 */}
        <aside className={styles.sidebar} aria-label="Account Navigation">
          <h2 className={styles.sidebarTitle}>My Account</h2>
          <ul className={styles.navGroup}>
            <li>
              <Link href="/account" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <LayoutDashboard size={18} />
                </span>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <Package size={18} />
                </span>
                My Orders
              </Link>
            </li>
            <li>
              <Link href="/account/addresses" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <MapPin size={18} />
                </span>
                Addresses
              </Link>
            </li>
            <li>
              <Link href="/account/wishlist" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <Heart size={18} />
                </span>
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/account/details" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <User size={18} />
                </span>
                Account Details
              </Link>
            </li>
            <li>
              <Link href="/account/payments" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <CreditCard size={18} />
                </span>
                Payment Methods
              </Link>
            </li>
            <li>
              <Link
                href="/account/reviews"
                className={`${styles.navItem} ${styles.navItemActive}`}
              >
                <span className={styles.navIcon}>
                  <Star size={18} />
                </span>
                Reviews
              </Link>
            </li>
            <li>
              <Link href="/account/support" className={styles.navItem}>
                <span className={styles.navIcon}>
                  <Headphones size={18} />
                </span>
                Support
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className={styles.navItem}
                style={{ marginTop: "12px", borderTop: "1px solid #f3f4f6", paddingTop: "14px" }}
              >
                <span className={styles.navIcon}>
                  <LogOut size={18} />
                </span>
                {signingOut ? "Signing Out…" : "Logout"}
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content Area */}
        <main className={styles.mainContent}>
          <header className={styles.headerSection}>
            <h1 className={styles.pageTitle}>Reviews</h1>
            <p className={styles.pageSubtitle}>
              Share your experience and help other customers.
            </p>
          </header>

          {/* Navigation Tabs: To Review (X) | My Reviews (Y) */}
          <div className={styles.tabsContainer}>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "toReview" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("toReview")}
            >
              To Review ({toReview.length})
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "myReviews" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("myReviews")}
            >
              My Reviews ({myReviews.length})
            </button>
          </div>

          {/* Tab 1: To Review Screen (Screen 1) */}
          {activeTab === "toReview" && (
            <div>
              {loading ? (
                <div className={styles.emptyBox}>
                  <Clock size={32} className={styles.emptyIcon} />
                  <p>Loading your eligible products for review…</p>
                </div>
              ) : toReview.length === 0 ? (
                <div className={styles.emptyBox}>
                  <CheckCircle2 size={36} color="#16a34a" style={{ marginBottom: "16px" }} />
                  <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 6px 0" }}>
                    All caught up!
                  </h3>
                  <p style={{ fontSize: "13.5px", color: "#6b7280", margin: "0 0 20px 0" }}>
                    You have reviewed all your delivered purchases. Thank you for sharing your experience!
                  </p>
                  <Link href="/new" className={styles.primaryActionBtn}>
                    Explore Collection
                  </Link>
                </div>
              ) : (
                <div className={styles.reviewList}>
                  {toReview.map((item) => (
                    <article key={`${item.orderNumber}-${item.sku}`} className={styles.reviewItemCard}>
                      <div className={styles.reviewItemLeft}>
                        <div className={styles.productThumb}>
                          <></>
                        </div>
                        <div className={styles.productInfo}>
                          <h3 className={styles.productName}>{item.name}</h3>
                          {item.color && (
                            <p className={styles.productVariant}>{item.color}</p>
                          )}
                          <p className={styles.orderMeta}>
                            Order #{item.orderNumber}
                            {item.deliveredAtFormatted && ` · ${item.deliveredAtFormatted}`}
                          </p>
                        </div>
                      </div>

                      <div className={styles.reviewItemActions}>
                        <button
                          type="button"
                          className={styles.primaryActionBtn}
                          onClick={() => handleOpenWriteReview(item)}
                        >
                          Write a Review
                        </button>
                        <Link
                          href={`/products/${item.slug}`}
                          className={styles.secondaryActionBtn}
                        >
                          View Product
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: My Reviews (Screen 4) */}
          {activeTab === "myReviews" && (
            <div>
              {loading ? (
                <div className={styles.emptyBox}>
                  <Clock size={32} className={styles.emptyIcon} />
                  <p>Loading your reviews…</p>
                </div>
              ) : myReviews.length === 0 ? (
                <div className={styles.emptyBox}>
                  <Star size={36} className={styles.emptyIcon} />
                  <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 6px 0" }}>
                    No reviews submitted yet
                  </h3>
                  <p style={{ fontSize: "13.5px", color: "#6b7280", margin: "0 0 20px 0" }}>
                    Share your feedback on your purchased OVIA luggage and accessories.
                  </p>
                  {toReview.length > 0 && (
                    <button
                      type="button"
                      className={styles.primaryActionBtn}
                      onClick={() => setActiveTab("toReview")}
                    >
                      Write your first review ({toReview.length} waiting)
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.reviewList}>
                  {myReviews.map((rev) => (
                    <article key={rev.id} className={styles.submittedCard}>
                      <div className={styles.submittedHeader}>
                        <div className={styles.submittedProduct}>
                          <div className={styles.productThumb}>
                            <></>
                          </div>
                          <div>
                            <h3 className={styles.productName}>{rev.productName}</h3>
                            {rev.productColor && (
                              <p className={styles.productVariant}>{rev.productColor}</p>
                            )}
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
                              {rev.verified && (
                                <span className={styles.verifiedBadge}>
                                  ✓ Verified Purchase
                                </span>
                              )}
                              {rev.orderNumber && (
                                <span className={styles.orderMeta}>
                                  Order #{rev.orderNumber}
                                </span>
                              )}
                              <span className={styles.reviewDate}>
                                Reviewed on {formatDate(rev.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.submittedActions}>
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => handleOpenEditReview(rev)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteReview(rev.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Stars & Content */}
                      <div>
                        <div className={styles.starRatingRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={16}
                              className={s <= rev.rating ? styles.starIconFilled : styles.starIconEmpty}
                            />
                          ))}
                        </div>
                        <h4 className={styles.reviewTitleText}>{rev.title}</h4>
                        <p className={styles.reviewCommentText}>{rev.comment}</p>

                        {/* Aspect Ratings */}
                        {rev.aspects && (
                          <div className={styles.reviewAspectsPills}>
                            {rev.aspects.quality && (
                              <span className={styles.aspectPill}>
                                Quality: <strong>{rev.aspects.quality}★</strong>
                              </span>
                            )}
                            {rev.aspects.design && (
                              <span className={styles.aspectPill}>
                                Design: <strong>{rev.aspects.design}★</strong>
                              </span>
                            )}
                            {rev.aspects.valueForMoney && (
                              <span className={styles.aspectPill}>
                                Value for Money: <strong>{rev.aspects.valueForMoney}★</strong>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Photos Grid */}
                        {rev.photos && rev.photos.length > 0 && (
                          <div className={styles.reviewPhotosGrid}>
                            {rev.photos.map((p, idx) => (
                              <div key={idx} className={styles.reviewPhotoThumb}>
                                <Image
                                  src={p}
                                  alt="Review attachment"
                                  fill
                                  sizes="64px"
                                  style={{ objectFit: "cover" }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ===================================================================
          MODAL: Screen 2 (Write a Review Form) or Screen 3 (Review Submitted)
          =================================================================== */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => !formSubmitting && setIsModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            {!isSuccessModal ? (
              /* Screen 2: Write a Review Form */
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 4px 0" }}>
                      {editingReview ? "Edit Your Review" : "Write a Review"}
                    </h2>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                      Share your experience with this product.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.modalCloseBtn}
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmitReview} className={styles.modalBody}>
                  {formError && (
                    <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "6px", fontSize: "13px" }}>
                      {formError}
                    </div>
                  )}

                  {/* Target Product Summary */}
                  {targetItem && (
                    <div className={styles.formProductSummary}>
                      <div className={styles.productThumb}>
                        <></>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 2px 0" }}>
                          {targetItem.name}
                        </h4>
                        {targetItem.color && (
                          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>
                            {targetItem.color}
                          </p>
                        )}
                        <span className={styles.verifiedBadge}>
                          ✓ Verified Purchase
                        </span>
                        {targetItem.orderNumber && (
                          <p style={{ fontSize: "11.5px", color: "#9ca3af", margin: "4px 0 0 0" }}>
                            Order #{targetItem.orderNumber}
                            {targetItem.deliveredAtFormatted && ` · ${targetItem.deliveredAtFormatted}`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Overall Star Rating */}
                  <div className={styles.formGroup}>
                    <div className={styles.formLabel}>
                      <span>Overall Rating *</span>
                      <span style={{ fontSize: "13px", color: "#eab308", fontWeight: 700 }}>
                        {hoverRating || rating}/5
                      </span>
                    </div>
                    <div className={styles.interactiveStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={styles.starBtn}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(star)}
                          aria-label={`Rate ${star} star`}
                        >
                          <Star
                            size={26}
                            className={
                              star <= (hoverRating || rating)
                                ? styles.starIconFilled
                                : styles.starIconEmpty
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Title */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="review-title">
                      Review Title *
                    </label>
                    <input
                      id="review-title"
                      type="text"
                      className={styles.inputField}
                      placeholder="e.g. Elegant and timeless"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={120}
                      required
                    />
                  </div>

                  {/* Review Comment */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="review-comment">
                      Your Review *
                    </label>
                    <textarea
                      id="review-comment"
                      className={styles.textareaField}
                      placeholder="Share details of your experience with build quality, handling, materials, and aesthetics..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={500}
                      required
                    />
                    <div className={styles.charCount}>{comment.length}/500</div>
                  </div>

                  {/* Rate Specific Aspects (Optional) */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Rate Specific Aspects (Optional)
                    </label>
                    <div className={styles.aspectsGrid}>
                      {/* Quality */}
                      <div className={styles.aspectRow}>
                        <span className={styles.aspectLabel}>Quality</span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              className={styles.starBtn}
                              onClick={() => setAspects((prev) => ({ ...prev, quality: s }))}
                            >
                              <Star
                                size={18}
                                className={s <= (aspects.quality || 5) ? styles.starIconFilled : styles.starIconEmpty}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Design */}
                      <div className={styles.aspectRow}>
                        <span className={styles.aspectLabel}>Design</span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              className={styles.starBtn}
                              onClick={() => setAspects((prev) => ({ ...prev, design: s }))}
                            >
                              <Star
                                size={18}
                                className={s <= (aspects.design || 5) ? styles.starIconFilled : styles.starIconEmpty}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Value for Money */}
                      <div className={styles.aspectRow}>
                        <span className={styles.aspectLabel}>Value for Money</span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              className={styles.starBtn}
                              onClick={() => setAspects((prev) => ({ ...prev, valueForMoney: s }))}
                            >
                              <Star
                                size={18}
                                className={s <= (aspects.valueForMoney || 5) ? styles.starIconFilled : styles.starIconEmpty}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add Photos / Videos (Optional) */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Add Photos / Videos (Optional)
                    </label>
                    <div className={styles.photoUploadBox}>
                      {photos.map((p, idx) => (
                        <div key={idx} className={styles.previewPhotoItem}>
                          <Image src={p} alt="Upload preview" fill sizes="72px" style={{ objectFit: "cover" }} />
                          <button
                            type="button"
                            className={styles.removePhotoBtn}
                            onClick={() => handleRemovePhoto(idx)}
                            aria-label="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {photos.length < 5 && (
                        <label className={styles.photoUploadButton}>
                          <Camera size={20} />
                          <span>Upload</span>
                          <span style={{ fontSize: "9px" }}>Max 5 files</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAddPhoto}
                            style={{ display: "none" }}
                          />
                        </label>
                      )}

                      {/* Sample product detail gallery quick attachments if user has none */}
                      {photos.length === 0 && targetItem?.image && (
                        <button
                          type="button"
                          className={styles.photoUploadButton}
                          onClick={() => handleAddPresetPhoto(targetItem.image!)}
                          title="Attach product photo"
                          style={{ borderStyle: "solid" }}
                        >
                          <Sparkles size={16} />
                          <span>Attach Photo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.modalFooter}>
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={formSubmitting}
                    >
                      {formSubmitting ? "Submitting Review…" : "Submit Review"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Screen 3: Review Submitted Thank You */
              <div className={styles.successModal}>
                <div className={styles.successCircle}>
                  <CheckCircle2 size={36} strokeWidth={2.2} />
                </div>
                <h2 className={styles.successTitle}>Thank you for your review!</h2>
                <p className={styles.successMessage}>
                  Your review has been submitted and will be visible on the product page soon.
                </p>
                <div className={styles.successBtnGroup}>
                  <button
                    type="button"
                    className={styles.primaryActionBtn}
                    style={{ width: "100%", padding: "12px" }}
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsSuccessModal(false);
                      setActiveTab("myReviews");
                    }}
                  >
                    View My Reviews
                  </button>
                  <Link
                    href="/new"
                    className={styles.secondaryActionBtn}
                    style={{ width: "100%", padding: "12px" }}
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsSuccessModal(false);
                    }}
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
