"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import QRCode from "qrcode";
import styles from "./whatsapp-widget.module.css";
import { clientServicesConfig } from "@/lib/client-services-config";

// Minimal crisp WhatsApp icon matching the user's reference screenshots
export function WhatsAppIcon({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path
        d="M9.8 8.6c.2-.5.5-.5.8-.5h.6c.2 0 .4.1.5.4.3.7.8 1.9.9 2 .1.2.1.3 0 .5-.1.2-.2.3-.4.5l-.3.3c-.1.1-.2.2-.1.4.3.7.8 1.4 1.5 2 .7.6 1.4 1 2.2 1.2.2.1.3 0 .4-.1l.5-.6c.2-.2.3-.3.5-.2.2.1 1.4.7 1.6.8.2.1.3.2.3.4 0 .3-.2 1.3-.8 1.6-.5.3-1.2.4-2 .2-.7-.2-1.7-.7-2.8-1.7-1.3-1.1-2.2-2.3-2.6-3.1-.4-.8-.4-1.6-.2-2.1.1-.5.5-.8.7-.9z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function WhatsAppFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const phoneRaw = "917410724158";
  const whatsappMobileUrl = `https://wa.me/${phoneRaw}`;
  const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${phoneRaw}`;

  useEffect(() => {
    // Generate high-resolution scannable QR code with high error tolerance for center emblem
    QRCode.toDataURL(whatsappMobileUrl, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("Failed to generate WhatsApp QR code:", err));
  }, [whatsappMobileUrl]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Listen for global open requests (from contact pages, header drawers, etc.)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-whatsapp-modal", handleOpen);
    return () => window.removeEventListener("open-whatsapp-modal", handleOpen);
  }, []);

  // Close on Escape key and trap scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeModal]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        ref={triggerRef}
        type="button"
        className={styles.floatingButton}
        onClick={() => setIsOpen(true)}
        aria-label="Connect with OVIA Client Service on WhatsApp (7410724158)"
        title="Connect on WhatsApp"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <WhatsAppIcon size={28} />
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          role="presentation"
        >
          <div
            ref={modalRef}
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Connect via WhatsApp"
          >
            {/* Close Button */}
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeModal}
              aria-label="Close WhatsApp modal"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            <div className={styles.grid}>
              {/* Left Column: Text & WhatsApp Web Action */}
              <div className={styles.textContent}>
                <h2 className={styles.heading}>
                  Scan the QR code to connect to our client service via your mobile.
                </h2>
                <p className={styles.subheading}>
                  Or click below to access WhatsApp Web.
                </p>
                <a
                  href={whatsappWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.webLink}
                >
                  WHATSAPP WEB
                </a>

                {/* Mobile direct button */}
                <a
                  href={whatsappMobileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mobileDirectButton}
                >
                  <WhatsAppIcon size={18} />
                  <span>Open WhatsApp</span>
                </a>
              </div>

              {/* Right Column: Scannable QR Code */}
              <div className={styles.qrContainer}>
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="WhatsApp QR Code for +91 74107 24158"
                    className={styles.qrImage}
                    width={190}
                    height={190}
                  />
                ) : (
                  <div style={{ width: 190, height: 190 }} />
                )}

                {/* WhatsApp Logo badge in the center of QR code */}
                <div className={styles.qrBadge} aria-hidden="true">
                  <WhatsAppIcon size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
