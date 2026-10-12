"use client";
import { useLiveAdminRefresh } from "@/components/admin/use-live-admin-refresh";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  ShieldCheck,
  Check,
} from "lucide-react";

interface NotificationTemplate {
  id: string;
  name: string;
  channel: string;
  lastSent: string;
  status: string;
  subject: string;
  previewHtml: string;
  description: string;
}

interface NotificationLog {
  id: string;
  eventType: string;
  templateName: string;
  recipient: string;
  subject: string;
  channel: string;
  status: "Delivered" | "Failed" | "Skipped (Duplicate)";
  entityId?: string;
  error?: string;
  createdAt: string;
  isTest?: boolean;
}

const FALLBACK_TEMPLATES: NotificationTemplate[] = [
  {
    id: "ORDER_CONFIRMATION",
    name: "Order Confirmation",
    channel: "Email (Resend)",
    lastSent: "Not loaded",
    status: "Not loaded",
    subject: "Your OVIA Voyage Order is Confirmed #OV123456789",
    description: "Sent automatically when a customer completes order placement.",
    previewHtml: "",
  },
  {
    id: "PAYMENT_RECEIVED",
    name: "Payment Received",
    channel: "Email & SMS",
    lastSent: "Not loaded",
    status: "Not loaded",
    subject: "Payment Receipt for OVIA Order #OV123456789",
    description: "Sent automatically when Razorpay webhook confirms successful capture.",
    previewHtml: "",
  },
  {
    id: "ORDER_SHIPPED",
    name: "Order Shipped (AWB)",
    channel: "Email & WhatsApp",
    lastSent: "Not loaded",
    status: "Not loaded",
    subject: "Your OVIA Suitcase Has Dispatched with Delhivery",
    description: "Sent automatically when an AWB is assigned and marked dispatched.",
    previewHtml: "",
  },
  {
    id: "OUT_FOR_DELIVERY",
    name: "Out for Delivery",
    channel: "SMS & Email",
    lastSent: "Not loaded",
    status: "Not loaded",
    subject: "Your OVIA delivery agent is arriving today",
    description: "Sent automatically when courier webhook updates shipping milestone to OUT_FOR_DELIVERY.",
    previewHtml: "",
  },
  {
    id: "DELIVERED",
    name: "Delivered",
    channel: "Email & SMS",
    lastSent: "Not loaded",
    status: "Not loaded",
    subject: "Your OVIA Luggage Has Arrived — Welcome to the Voyage",
    description: "Sent automatically when courier webhook updates shipping milestone to DELIVERED.",
    previewHtml: "",
  },
  {
    id: "RETURN_RECEIVED",
    name: "Return Received",
    channel: "Email",
    lastSent: "Not loaded",
    status: "Not loaded",
    subject: "Your OVIA Return Request is Being Reviewed #RET-9041",
    description: "Sent automatically when a customer submits a return or exchange request.",
    previewHtml: "",
  },
  {
    id: "RETURN_APPROVED",
    name: "Return Approved",
    channel: "Email",
    lastSent: "Not loaded",
    status: "Not loaded",
    subject: "Your OVIA Return Request Has Been Approved",
    description: "Sent automatically when an admin approves a return request.",
    previewHtml: "",
  },
  {
    id: "REFUND_COMPLETED",
    name: "Refund Completed",
    channel: "Email",
    lastSent: "Not loaded",
    status: "Not loaded",
    subject: "Refund Disbursed for OVIA Order #OV123456755",
    description: "Sent automatically when Razorpay webhook confirms payment.refunded.",
    previewHtml: "",
  },
  {
    id: "OTP_AUTHORIZATION",
    name: "OTP Authorization",
    channel: "Email & SMS",
    lastSent: "Not loaded",
    status: "Not loaded",
    subject: "Your OVIA Security Verification Code",
    description: "Sent automatically when a customer requests login, signup, or password reset OTP.",
    previewHtml: "",
  },
];

export default function AdminNotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(FALLBACK_TEMPLATES);
  const [selectedTemplateName, setSelectedTemplateName] = useState("Order Confirmation");
  const [testEmail, setTestEmail] = useState("no-reply@ovias.shop");
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchStudioData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/admin/notifications", {cache:"no-store"});
      if (res.ok) {
        const data = await res.json();
        if (data.templates && data.templates.length) {
          setTemplates(data.templates);
        }
        if (data.recentLogs) {
          setLogs(data.recentLogs);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch notification studio data:", err);
    } finally {
      setLoading(false);
    }
  };

  useLiveAdminRefresh(() => fetchStudioData(true));

  useEffect(() => {
    fetchStudioData();
  }, []);

  const activeTemplate =
    templates.find((t) => t.name === selectedTemplateName) || templates[0];

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      setNotificationBanner({
        type: "error",
        message: "Please enter a valid recipient email address.",
      });
      return;
    }

    try {
      setSendingTest(true);
      setNotificationBanner(null);

      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: activeTemplate.name,
          recipient: testEmail.trim(),
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setNotificationBanner({
          type: "success",
          message: `Test email for '${activeTemplate.name}' sent to ${testEmail}! (Log ID: ${result.logId})`,
        });
        fetchStudioData();
      } else {
        setNotificationBanner({
          type: "error",
          message: result.error || "Failed to dispatch test email via Resend.",
        });
      }
    } catch (err: any) {
      setNotificationBanner({
        type: "error",
        message: err.message || "Failed to reach notification service.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111111", margin: "0 0 4px" }}>
            Email & Notifications Studio
          </h1>
          <p style={{ fontSize: 13, color: "#6B6B6B", margin: 0 }}>
            Inspect automated transactional triggers, customer communications, Resend SMTP logs, and test delivery.
          </p>
        </div>
        <button
          onClick={() => void fetchStudioData()}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E5E5",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            color: "#374151",
          }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh Status
        </button>
      </div>

      {notificationBanner && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 6,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: notificationBanner.type === "success" ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${notificationBanner.type === "success" ? "#BBF7D0" : "#FECACA"}`,
            color: notificationBanner.type === "success" ? "#166534" : "#991B1B",
          }}
        >
          {notificationBanner.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{notificationBanner.message}</span>
          <button
            onClick={() => setNotificationBanner(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Studio Grid: Templates List & Live Preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Templates List */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E5E5",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #E5E5E5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: "#111111" }}>
              System Communication Templates ({templates.length})
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                backgroundColor: "#F3F4F6",
                borderRadius: 12,
                color: "#4B5563",
                fontWeight: 500,
              }}
            >
              Event-Driven Triggers
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {templates.map((t) => {
              const active = selectedTemplateName === t.name;
              return (
                <div
                  key={t.name}
                  onClick={() => setSelectedTemplateName(t.name)}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #F0F0F0",
                    cursor: "pointer",
                    backgroundColor: active ? "#F7F7F5" : "#FFFFFF",
                    borderLeft: active ? "3px solid #8E693E" : "3px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111111" }}>
                      {t.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: t.status === "Failed" ? "#DC2626" : "#16A34A",
                        fontWeight: 600,
                        backgroundColor: t.status === "Failed" ? "#FEE2E2" : "#DCFCE7",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {t.status || "Delivered"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6B6B6B",
                      marginBottom: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.subject}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", display: "flex", gap: 12 }}>
                    <span>Channel: {t.channel}</span>
                    <span>•</span>
                    <span>Last Sent: {t.lastSent}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Template Preview & Test Send */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E5E5",
            borderRadius: 8,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #F0F0F0",
              paddingBottom: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111111" }}>
                Template Preview: {activeTemplate.name}
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                {activeTemplate.description}
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "#8E693E",
                fontWeight: 600,
                backgroundColor: "#FDF8F3",
                padding: "3px 8px",
                borderRadius: 4,
                border: "1px solid #F3E8DC",
              }}
            >
              HTML / Responsive
            </span>
          </div>

          {/* Render Preview Container */}
          <div
            style={{
              borderRadius: 6,
              border: "1px solid #E5E5E5",
              overflow: "hidden",
              backgroundColor: "#FAFAF9",
              maxHeight: 520,
              overflowY: "auto",
            }}
          >
            {activeTemplate.previewHtml ? (
              <iframe
                title="Email Preview"
                srcDoc={activeTemplate.previewHtml}
                style={{
                  width: "100%",
                  minHeight: 480,
                  border: "none",
                  display: "block",
                  backgroundColor: "#F4F4F2",
                }}
              />
            ) : (
              <div style={{ padding: "24px", fontFamily: "var(--sans)" }}>
                <div
                  style={{
                    textAlign: "center",
                    borderBottom: "1px solid #E5E5E5",
                    paddingBottom: 16,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 22, letterSpacing: "0.1em" }}>
                    OVIA
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      color: "#8E693E",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    LUXURY TRAVEL ESSENTIALS
                  </div>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>
                  Dear Valued Voyager,
                </h3>
                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: "0 0 14px" }}>
                  {activeTemplate.subject}
                </p>

                <div
                  style={{
                    padding: 14,
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E5E5",
                    borderRadius: 4,
                    fontSize: 12,
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <strong>Trigger Event:</strong> {activeTemplate.name}
                  </div>
                  <div>
                    <strong>Default Channel:</strong> {activeTemplate.channel}
                  </div>
                  <div>
                    <strong>Delivery Engine:</strong> Resend API (idempotent / deduplicated)
                  </div>
                </div>

                <p style={{ fontSize: 12, color: "#6B6B6B", margin: 0 }}>
                  Automated transactional message triggered via server-side events.
                </p>
              </div>
            )}
          </div>

          {/* Test Send Section */}
          <div style={{ borderTop: "1px solid #F0F0F0", paddingTop: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Send Live Test Email (Admin Testing)
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter recipient email..."
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  border: "1px solid #E5E5E5",
                  borderRadius: 4,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={handleSendTest}
                disabled={sendingTest}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#111111",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: sendingTest ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: sendingTest ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {sendingTest ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Dispatching...
                  </>
                ) : (
                  <>
                    <Send size={13} /> Send Test
                  </>
                )}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 0" }}>
              Sends a real preview of <strong>{activeTemplate.name}</strong> to your inbox via Resend.
            </p>
          </div>
        </div>
      </div>

      {/* Live Transactional Logs */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #E5E5E5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#111111" }}>
              Live Resend Transactional Delivery Logs
            </span>
            <p style={{ fontSize: 12, color: "#6B6B6B", margin: "2px 0 0" }}>
              MongoDB audit record of all triggered transactional notifications with deduplication tracking.
            </p>
          </div>
          <span style={{ fontSize: 11, color: "#8E693E", fontWeight: 600 }}>
            {logs.length} logged events
          </span>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "#6B7280", fontSize: 13 }}>
            <Mail size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
            <div>No notification delivery logs recorded yet.</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
              Dispatch an admin test or complete a checkout event to see live logs appear here.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E5E5", textAlign: "left" }}>
                  <th style={{ padding: "10px 16px", color: "#4B5563", fontWeight: 600 }}>Event / Template</th>
                  <th style={{ padding: "10px 16px", color: "#4B5563", fontWeight: 600 }}>Recipient</th>
                  <th style={{ padding: "10px 16px", color: "#4B5563", fontWeight: 600 }}>Subject</th>
                  <th style={{ padding: "10px 16px", color: "#4B5563", fontWeight: 600 }}>Channel</th>
                  <th style={{ padding: "10px 16px", color: "#4B5563", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "10px 16px", color: "#4B5563", fontWeight: 600 }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #F0F0F0" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111111" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {log.templateName || log.eventType}
                        {log.isTest && (
                          <span
                            style={{
                              fontSize: 9,
                              backgroundColor: "#FEF3C7",
                              color: "#92400E",
                              padding: "1px 5px",
                              borderRadius: 4,
                              fontWeight: 600,
                            }}
                          >
                            TEST
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#374151", fontFamily: "monospace", fontSize: 11 }}>
                      {log.recipient}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#4B5563",
                        maxWidth: 260,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {log.subject}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6B7280" }}>{log.channel}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 4,
                          backgroundColor:
                            log.status === "Delivered"
                              ? "#DCFCE7"
                              : log.status === "Failed"
                                ? "#FEE2E2"
                                : "#F3F4F6",
                          color:
                            log.status === "Delivered"
                              ? "#166534"
                              : log.status === "Failed"
                                ? "#991B1B"
                                : "#4B5563",
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#9CA3AF", fontSize: 11 }}>
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
