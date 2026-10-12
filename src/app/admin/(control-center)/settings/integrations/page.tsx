"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./integrations.module.css";
import {
  Mail,
  Phone,
  MessageCircle,
  MessageSquare,
  BookOpen,
  Image,
  CreditCard,
  Truck,
  BarChart3,
  Search,
  MoreHorizontal,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Zap,
  ArrowRight,
  Database,
  Globe,
  Radio,
  X,
} from "lucide-react";

interface IntegrationItem {
  id: string;
  name: string;
  category: "Communication" | "Content & Media" | "Commerce" | "Analytics";
  provider: string;
  description: string;
  type: "external" | "internal";
  icon: string;
  status: "Connected" | "Not Connected" | "Configured (unverified)" | "Error";
  verified: boolean;
  enabled: boolean;
  authMethod: string;
  maskedKey: string;
  webhookUrl?: string | null;
  lastHealthCheck: string;
  pipeline?: {
    diagram: string;
    description: string;
  };
  config: Record<string, any>;
  logs: Array<{
    id: string;
    timestamp: string;
    status: "SUCCESS" | "FAILED" | "INFO";
    message: string;
    latencyMs?: number;
  }>;
}

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal / Drawer state
  const [activeIntegration, setActiveIntegration] = useState<IntegrationItem | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Testing state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<{
    id: string;
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);
  
  // Form editing state in modal
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [showSecretField, setShowSecretField] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Fetch Integrations
  const fetchIntegrations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setIntegrations(data.integrations);
      }
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.message.toLowerCase().includes("abort"))) {
        return;
      }
      console.error("Failed to fetch integrations:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Filtered integrations
  const filteredIntegrations = useMemo(() => {
    return integrations.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.provider.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [integrations, selectedCategory, searchQuery]);

  const connectedCount = useMemo(() => {
    return integrations.filter((i) => i.status === "Connected").length;
  }, [integrations]);

  // Open Configure Modal
  const handleOpenConfig = (item: IntegrationItem) => {
    setActiveIntegration(item);
    setEditFormData({
      enabled: item.enabled,
      ...(item.config || {}),
    });
    setTestFeedback(null);
    setShowSecretField(false);
    setOpenDropdownId(null);
  };

  // Run Test Connection Ping
  const handleTestConnection = async (item: IntegrationItem) => {
    setTestingId(item.id);
    setTestFeedback(null);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await res.json();
      setTestFeedback({
        id: item.id,
        success: data.success,
        message: data.message,
        latencyMs: data.latencyMs,
      });
      // Refresh list to pick up updated logs and status
      await fetchIntegrations(true);
      // Update active integration if modal is open
      if (activeIntegration?.id === item.id) {
        setActiveIntegration((prev) =>
          prev
            ? {
                ...prev,
                status: data.success ? "Connected" : prev.status,
                lastHealthCheck: data.testedAt || new Date().toISOString(),
                logs: [
                  {
                    id: `log-${Date.now()}`,
                    timestamp: data.testedAt || new Date().toISOString(),
                    status: data.success ? "SUCCESS" : "FAILED",
                    message: data.message,
                    latencyMs: data.latencyMs,
                  },
                  ...(prev.logs || []),
                ],
              }
            : null
        );
      }
    } catch {
      setTestFeedback({
        id: item.id,
        success: false,
        message: `Failed to ping remote service for ${item.name}.`,
      });
    } finally {
      setTestingId(null);
    }
  };

  // Save Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntegration) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeIntegration.id,
          config: editFormData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestFeedback({
          id: activeIntegration.id,
          success: true,
          message: "Configuration saved and validated by server.",
        });
        await fetchIntegrations(true);
      } else {
        alert(data.error || "Failed to save configuration.");
      }
    } catch {
      alert("Error saving configuration.");
    } finally {
      setSaving(false);
    }
  };

  // Disconnect Service
  const handleDisconnect = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this service?")) return;
    try {
      const res = await fetch(`/api/admin/integrations?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActiveIntegration(null);
        await fetchIntegrations(true);
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  // Copy Webhook
  const handleCopyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // Render Service Icon
  const renderIcon = (id: string, icon: string) => {
    switch (id) {
      case "email":
        return <Mail size={22} strokeWidth={1.8} />;
      case "whatsapp":
        return <Phone size={22} strokeWidth={1.8} />;
      case "messenger":
        return <MessageCircle size={22} strokeWidth={1.8} />;
      case "livechat":
        return <MessageSquare size={22} strokeWidth={1.8} />;
      case "blog":
        return <BookOpen size={22} strokeWidth={1.8} />;
      case "cloudinary":
        return <Image size={22} strokeWidth={1.8} />;
      case "razorpay":
        return <CreditCard size={22} strokeWidth={1.8} />;
      case "delhivery":
        return <Truck size={22} strokeWidth={1.8} />;
      case "google_analytics":
        return <BarChart3 size={22} strokeWidth={1.8} />;
      case "google_search_console":
        return <Search size={22} strokeWidth={1.8} />;
      default:
        return <Zap size={22} strokeWidth={1.8} />;
    }
  };

  const getIconClass = (id: string) => {
    switch (id) {
      case "email": return styles.iconBoxEmail;
      case "whatsapp": return styles.iconBoxWhatsapp;
      case "messenger": return styles.iconBoxMessenger;
      case "livechat": return styles.iconBoxLivechat;
      case "blog": return styles.iconBoxBlog;
      case "cloudinary": return styles.iconBoxCloudinary;
      case "razorpay": return styles.iconBoxRazorpay;
      case "delhivery": return styles.iconBoxDelhivery;
      case "google_analytics": return styles.iconBoxAnalytics;
      case "google_search_console": return styles.iconBoxSearch;
      default: return "";
    }
  };

  // Calculate Lifecycle Step
  const getLifecycleStep = (item: IntegrationItem) => {
    if (item.status === "Connected") return 5;
    if (item.status === "Configured (unverified)") return 4;
    if (item.maskedKey !== "Not configured") return 3;
    return 1;
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/admin/settings" className={styles.breadcrumbLink}>
          Settings
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>Integrations</span>
      </nav>

      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Integrations</h1>
          <p className={styles.subtitle}>
            Connect and manage the services used by your store.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.summaryBadge}>
            <span className={styles.summaryDot}></span>
            <span>
              {connectedCount} of {integrations.length} Services Connected
            </span>
          </div>

          <button
            onClick={() => fetchIntegrations()}
            className={styles.refreshButton}
            title="Refresh service statuses"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.categoryTabs}>
          {["All", "Communication", "Content & Media", "Commerce", "Analytics"].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.categoryTab} ${
                  selectedCategory === cat ? styles.categoryTabActive : ""
                }`}
              >
                {cat}
                {cat === "All" && ` (${integrations.length})`}
                {cat === "Communication" &&
                  ` (${integrations.filter((i) => i.category === "Communication").length})`}
                {cat === "Content & Media" &&
                  ` (${integrations.filter((i) => i.category === "Content & Media").length})`}
                {cat === "Commerce" &&
                  ` (${integrations.filter((i) => i.category === "Commerce").length})`}
                {cat === "Analytics" &&
                  ` (${integrations.filter((i) => i.category === "Analytics").length})`}
              </button>
            )
          )}
        </div>

        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Services List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#71717A", fontSize: 13 }}>
          <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 10px" }} />
          Loading store integrations...
        </div>
      ) : (
        <div className={styles.cardsList}>
          {filteredIntegrations.map((item) => {
            const isConnected = item.status === "Connected";
            const isDropdownOpen = openDropdownId === item.id;

            return (
              <div key={item.id} className={styles.card}>
                {/* Left Column: Icon & Info */}
                <div className={styles.cardLeft}>
                  <div className={`${styles.iconBox} ${getIconClass(item.id)}`}>
                    {renderIcon(item.id, item.icon)}
                  </div>

                  <div className={styles.cardInfo}>
                    <div className={styles.cardTitleRow}>
                      <h3 className={styles.cardTitle}>{item.name}</h3>
                      {item.type === "internal" && (
                        <span className={styles.internalPill}>Internal Engine</span>
                      )}
                    </div>
                    <p className={styles.cardDesc}>{item.description}</p>
                  </div>
                </div>

                {/* Right Column: Status & Action Buttons */}
                <div className={styles.cardRight}>
                  {/* Status Indicator */}
                  <div
                    className={`${styles.statusIndicator} ${
                      isConnected
                        ? styles.statusConnected
                        : item.status === "Configured (unverified)"
                        ? styles.statusUnverified
                        : item.status === "Error"
                        ? styles.statusError
                        : styles.statusNotConnected
                    }`}
                  >
                    <span className={styles.statusDot}></span>
                    <span>{item.status}</span>
                  </div>

                  {/* Action Button: Configure or Connect */}
                  {isConnected ? (
                    <button
                      onClick={() => handleOpenConfig(item)}
                      className={styles.configureButton}
                    >
                      Configure
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenConfig(item)}
                      className={styles.connectButton}
                    >
                      Connect
                    </button>
                  )}

                  {/* More Options Button */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() =>
                        setOpenDropdownId(isDropdownOpen ? null : item.id)
                      }
                      className={styles.moreButton}
                      title="More options"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className={styles.dropdownMenu}>
                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            handleTestConnection(item);
                          }}
                          className={styles.dropdownItem}
                        >
                          <Radio size={14} />
                          <span>Test Connection</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenDropdownId(null);
                            handleOpenConfig(item);
                          }}
                          className={styles.dropdownItem}
                        >
                          <Shield size={14} />
                          <span>View Logs & Health</span>
                        </button>

                        {item.webhookUrl && (
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              handleCopyWebhook(item.webhookUrl!);
                            }}
                            className={styles.dropdownItem}
                          >
                            <Copy size={14} />
                            <span>Copy Webhook URL</span>
                          </button>
                        )}

                        {isConnected && (
                          <button
                            onClick={() => {
                              setOpenDropdownId(null);
                              handleDisconnect(item.id);
                            }}
                            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                          >
                            <X size={14} />
                            <span>Disconnect</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Configure / Connect Drawer Modal */}
      {activeIntegration && (
        <div className={styles.modalOverlay} onClick={() => setActiveIntegration(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitle}>
                <div
                  className={`${styles.modalIconBox} ${getIconClass(
                    activeIntegration.id
                  )}`}
                >
                  {renderIcon(activeIntegration.id, activeIntegration.icon)}
                </div>
                <div>
                  <h2 className={styles.modalTitle}>{activeIntegration.name}</h2>
                  <p className={styles.modalCategory}>
                    {activeIntegration.category} • {activeIntegration.provider}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveIntegration(null)}
                className={styles.closeButton}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lifecycle Progress Bar */}
            <div className={styles.stepperBar}>
              {[
                { step: 1, label: "Not configured" },
                { step: 2, label: "Credentials" },
                { step: 3, label: "Server validation" },
                { step: 4, label: "Connection test" },
                { step: 5, label: "Active & Monitor" },
              ].map((s, idx) => {
                const currentStep = getLifecycleStep(activeIntegration);
                const isComplete = currentStep > s.step;
                const isActive = currentStep === s.step;

                return (
                  <React.Fragment key={s.step}>
                    <div
                      className={`${styles.stepItem} ${
                        isComplete
                          ? styles.stepItemComplete
                          : isActive
                          ? styles.stepItemActive
                          : ""
                      }`}
                    >
                      <span className={styles.stepNumber}>
                        {isComplete ? "✓" : s.step}
                      </span>
                      <span>{s.label}</span>
                    </div>
                    {idx < 4 && <span className={styles.stepArrow}>➔</span>}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Special Internal Integration Callout for Blog & Journal */}
              {activeIntegration.id === "blog" && (
                <div className={styles.pipelineBox}>
                  <div className={styles.pipelineHeader}>
                    <div className={styles.pipelineTitle}>
                      <Database size={15} color="#D97706" />
                      <span>Internal Architecture Pipeline</span>
                    </div>
                    <span className={styles.internalPill}>Direct DB Connect</span>
                  </div>

                  <div className={styles.pipelineDiagram}>
                    <span className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                      Admin Blog API
                    </span>
                    <span className={styles.pipelineArrow}>➔</span>
                    <span className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                      MongoDB (stories)
                    </span>
                    <span className={styles.pipelineArrow}>➔</span>
                    <span className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                      Public Journal (/journal)
                    </span>
                    <span className={styles.pipelineArrow}>➔</span>
                    <span className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                      Cache Revalidation
                    </span>
                  </div>

                  <p className={styles.pipelineDesc}>
                    This is an internal integration that automatically connects your Admin
                    Blog & Journal editor to your public storefront via MongoDB and Next.js
                    Incremental Static Regeneration (ISR). No third-party API key required.
                  </p>

                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link
                      href="/journal"
                      target="_blank"
                      className={styles.copyButton}
                      style={{ textDecoration: "none" }}
                    >
                      <Globe size={12} />
                      <span>View Public Journal</span>
                      <ExternalLink size={10} />
                    </Link>

                    <button
                      onClick={() => handleTestConnection(activeIntegration)}
                      disabled={testingId === "blog"}
                      className={styles.copyButton}
                    >
                      <RefreshCw size={12} className={testingId === "blog" ? "animate-spin" : ""} />
                      <span>Revalidate Cache & Verify Pipeline</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Real-time Socket.IO Live Chat Pipeline Callout */}
              {activeIntegration.id === "livechat" && (
                <div className={styles.pipelineBox}>
                  <div className={styles.pipelineHeader}>
                    <div className={styles.pipelineTitle}>
                      <Zap size={15} color="#18181B" />
                      <span>Real-time Live Chat Architecture</span>
                    </div>
                    <span className={styles.internalPill}>Persistent Daemon</span>
                  </div>

                  <div className={styles.pipelineDiagram}>
                    <span className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                      Customer Widget
                    </span>
                    <span className={styles.pipelineArrow}>➔</span>
                    <span className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                      Next.js /api/support
                    </span>
                    <span className={styles.pipelineArrow}>➔</span>
                    <span className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                      Socket.IO Port {activeIntegration.config?.port || "3001"}
                    </span>
                    <span className={styles.pipelineArrow}>➔</span>
                    <span className={`${styles.pipelineNode} ${styles.pipelineNodeActive}`}>
                      MongoDB Sessions
                    </span>
                  </div>

                  <p className={styles.pipelineDesc}>
                    Local Socket.IO daemon handles bidirectional messaging, customer
                    presence, and real-time support desk tickets without external subscriptions.
                  </p>
                </div>
              )}

              {/* Test Connection Live Feedback Banner */}
              {testFeedback && (
                <div
                  className={`${styles.feedbackBanner} ${
                    testFeedback.success
                      ? styles.feedbackBannerSuccess
                      : styles.feedbackBannerError
                  }`}
                >
                  {testFeedback.success ? (
                    <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  ) : (
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {testFeedback.success
                        ? "Connection Verified Successfully"
                        : "Connection Test Failed"}
                      {testFeedback.latencyMs !== undefined && (
                        <span style={{ fontWeight: 400, marginLeft: 6 }}>
                          ({testFeedback.latencyMs}ms response time)
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 2 }}>{testFeedback.message}</div>
                  </div>
                </div>
              )}

              {/* Configuration Form */}
              <form id="integration-form" onSubmit={handleSaveConfig} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Integration Enablement Switch */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Integration Status</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 500, fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={editFormData.enabled !== false}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, enabled: e.target.checked })
                        }
                        style={{ accentColor: "#18181B", width: 16, height: 16 }}
                      />
                      <span>Active</span>
                    </label>
                  </label>
                  <p className={styles.formHelper}>
                    Enable or pause this service integration for your store.
                  </p>
                </div>

                {/* Authentication Method & Masked Key (Zero-Trust) */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Authentication Method</span>
                    <span style={{ fontSize: 11, color: "#71717A", fontWeight: 400 }}>
                      Zero-Trust Server Guard
                    </span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={activeIntegration.authMethod}
                    className={styles.formInput}
                    style={{ backgroundColor: "#F4F4F5", color: "#52525B" }}
                  />
                </div>

                {/* Specific Fields by Integration */}
                {activeIntegration.id === "email" && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>From Email Address</label>
                      <input
                        type="email"
                        value={editFormData.fromEmail || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, fromEmail: e.target.value })
                        }
                        placeholder="OVIA <no-reply@ovias.shop>"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Support Inbox Email</label>
                      <input
                        type="email"
                        value={editFormData.supportEmail || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, supportEmail: e.target.value })
                        }
                        placeholder="support@ovias.shop"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span>API Key (Resend / SMTP)</span>
                        <span style={{ fontSize: 11, color: "#71717A" }}>
                          Current: {activeIntegration.maskedKey}
                        </span>
                      </label>
                      <div className={styles.secretInputRow}>
                        <input
                          type={showSecretField ? "text" : "password"}
                          value={editFormData.apiKey || ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, apiKey: e.target.value })
                          }
                          placeholder="Enter new API key to update..."
                          className={styles.formInput}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecretField(!showSecretField)}
                          className={styles.secretToggleBtn}
                        >
                          {showSecretField ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeIntegration.id === "whatsapp" && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Phone Number ID</label>
                      <input
                        type="text"
                        value={editFormData.phoneNumberId || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, phoneNumberId: e.target.value })
                        }
                        placeholder="e.g. 104829104810294"
                        className={styles.formInput}
                      />
                      <p className={styles.formHelper}>
                        Obtained from Meta for Developers WhatsApp API dashboard.
                      </p>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span>System User Access Token</span>
                        <span style={{ fontSize: 11, color: "#71717A" }}>
                          Current: {activeIntegration.maskedKey}
                        </span>
                      </label>
                      <div className={styles.secretInputRow}>
                        <input
                          type={showSecretField ? "text" : "password"}
                          value={editFormData.accessToken || ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, accessToken: e.target.value })
                          }
                          placeholder="Enter permanent system user token..."
                          className={styles.formInput}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecretField(!showSecretField)}
                          className={styles.secretToggleBtn}
                        >
                          {showSecretField ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeIntegration.id === "messenger" && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Facebook Page ID</label>
                      <input
                        type="text"
                        value={editFormData.pageId || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, pageId: e.target.value })
                        }
                        placeholder="e.g. 10928374829102"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span>Page Access Token</span>
                        <span style={{ fontSize: 11, color: "#71717A" }}>
                          Current: {activeIntegration.maskedKey}
                        </span>
                      </label>
                      <div className={styles.secretInputRow}>
                        <input
                          type={showSecretField ? "text" : "password"}
                          value={editFormData.pageAccessToken || ""}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, pageAccessToken: e.target.value })
                          }
                          placeholder="Enter page access token..."
                          className={styles.formInput}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecretField(!showSecretField)}
                          className={styles.secretToggleBtn}
                        >
                          {showSecretField ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeIntegration.id === "livechat" && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Customer Concierge Greeting</label>
                      <input
                        type="text"
                        value={editFormData.autoGreeting || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, autoGreeting: e.target.value })
                        }
                        placeholder="Welcome to OVIA. How may our concierge assist you?"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Realtime Worker Endpoint</label>
                      <input
                        type="text"
                        value={editFormData.realtimeUrl || "http://localhost:3001"}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, realtimeUrl: e.target.value })
                        }
                        className={styles.formInput}
                      />
                    </div>
                  </>
                )}

                {activeIntegration.id === "cloudinary" && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Cloud Name</label>
                      <input
                        type="text"
                        value={editFormData.cloudName || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, cloudName: e.target.value })
                        }
                        placeholder="e.g. ovia-luxury"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>API Key</label>
                      <input
                        type="text"
                        value={editFormData.apiKey || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, apiKey: e.target.value })
                        }
                        placeholder="Enter Cloudinary API key..."
                        className={styles.formInput}
                      />
                    </div>
                  </>
                )}

                {activeIntegration.id === "google_analytics" && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>GA4 Measurement ID</label>
                    <input
                      type="text"
                      value={editFormData.measurementId || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, measurementId: e.target.value })
                      }
                      placeholder="G-XXXXXXXXXX"
                      className={styles.formInput}
                    />
                    <p className={styles.formHelper}>
                      Automatically registers ecommerce purchase and checkout events.
                    </p>
                  </div>
                )}

                {activeIntegration.id === "google_search_console" && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Verification Code</label>
                    <input
                      type="text"
                      value={editFormData.verificationToken || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, verificationToken: e.target.value })
                      }
                      placeholder="google-site-verification token..."
                      className={styles.formInput}
                    />
                    <p className={styles.formHelper}>
                      Sitemap automatically indexed at /sitemap.xml.
                    </p>
                  </div>
                )}

                {/* Webhook Endpoint Box (if service supports incoming webhooks) */}
                {activeIntegration.webhookUrl && (
                  <div className={styles.webhookBox}>
                    <div className={styles.webhookHeader}>
                      <span className={styles.webhookLabel}>
                        Store Webhook Callback URL
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyWebhook(activeIntegration.webhookUrl!)}
                        className={styles.copyButton}
                      >
                        <Copy size={12} />
                        <span>{copiedWebhook ? "Copied!" : "Copy URL"}</span>
                      </button>
                    </div>
                    <div className={styles.webhookUrlRow}>
                      <span className={styles.webhookUrlText}>
                        {activeIntegration.webhookUrl}
                      </span>
                    </div>
                    <p className={styles.formHelper}>
                      Configure this exact URL in your provider dashboard for instant webhook event synchronization.
                    </p>
                  </div>
                )}
              </form>

              {/* Logs & Health Checks Section */}
              <div className={styles.logsSection}>
                <div className={styles.logsTitle}>Recent Health & Connection Logs</div>
                <div className={styles.logsList}>
                  {activeIntegration.logs && activeIntegration.logs.length > 0 ? (
                    activeIntegration.logs.map((log) => (
                      <div key={log.id} className={styles.logItem}>
                        <span className={styles.logTimestamp}>
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: log.status === "SUCCESS" ? "#16A34A" : "#DC2626",
                          }}
                        >
                          [{log.status}]
                        </span>
                        <span className={styles.logMessage}>{log.message}</span>
                        {log.latencyMs !== undefined && (
                          <span className={styles.logLatency}>{log.latencyMs}ms</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: "#71717A" }}>
                      No test pings recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <div className={styles.modalFooterLeft}>
                <button
                  type="button"
                  onClick={() => handleTestConnection(activeIntegration)}
                  disabled={testingId === activeIntegration.id}
                  className={styles.testPingButton}
                >
                  <RefreshCw
                    size={13}
                    className={testingId === activeIntegration.id ? "animate-spin" : ""}
                  />
                  <span>
                    {testingId === activeIntegration.id
                      ? "Testing Ping..."
                      : "Test Connection"}
                  </span>
                </button>

                {activeIntegration.status === "Connected" && (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(activeIntegration.id)}
                    className={styles.disconnectButton}
                  >
                    Disconnect
                  </button>
                )}
              </div>

              <button
                type="submit"
                form="integration-form"
                disabled={saving}
                className={styles.saveButton}
              >
                {saving ? "Saving..." : "Save & Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
