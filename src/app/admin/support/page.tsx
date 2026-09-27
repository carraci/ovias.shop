"use client";
import { useEffect, useState, useMemo } from "react";
import { request } from "@/components/store-provider";
import type { CareTicket, PrivacyRequest } from "@/lib/care";
import { Filter, Search, CheckCircle2, Clock, AlertCircle, ShieldCheck } from "lucide-react";

export default function StaffSupport() {
  const [data, setData] = useState<{
    tickets: CareTicket[];
    privacy: PrivacyRequest[];
  } | null>(null);
  const [message, setMessage] = useState("Loading requests…");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"all" | "tickets" | "privacy">("all");
  const [search, setSearch] = useState("");

  async function load() {
    try {
      setData(await request("care/admin"));
      setMessage("");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const allItems = useMemo(() => {
    if (!data) return [];
    const tList = data.tickets.map((t) => ({
      id: t.id,
      title: t.subject,
      status: t.status,
      kind: "ticket" as const,
      messages: t.messages,
    }));
    const pList = data.privacy.map((p) => ({
      id: p.id,
      title: p.requestType,
      status: p.status,
      kind: "privacy" as const,
      messages: [
        {
          id: p.id,
          author: "customer",
          text: p.message,
          createdAt: p.createdAt,
        },
      ],
    }));
    return [...tList, ...pList];
  }, [data]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (tab === "tickets" && item.kind !== "ticket") return false;
      if (tab === "privacy" && item.kind !== "privacy") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q) ||
          item.messages.some((m) => m.text?.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allItems, tab, search]);

  const kpis = useMemo(() => {
    if (!data) return { total: 0, open: 0, review: 0, resolved: 0 };
    const tickets = data.tickets;
    const privacy = data.privacy;
    const total = tickets.length + privacy.length;
    const open = tickets.filter((t) => t.status === "Open").length + privacy.filter((p) => p.status === "Submitted").length;
    const review = tickets.filter((t) => t.status === "In Review").length + privacy.filter((p) => p.status === "In Review").length;
    const resolved = tickets.filter((t) => ["Resolved", "Closed"].includes(t.status)).length + privacy.filter((p) => ["Completed", "Rejected"].includes(p.status)).length;
    return { total, open, review, resolved };
  }, [data]);

  return (
    <section className="section admin-support-page">
      <div className="admin-header-row">
        <div>
          <p className="eyebrow">AUTHORIZED STAFF PORTAL</p>
          <h1>
            Customer <em>care & operations.</em>
          </h1>
        </div>
      </div>

      {message && (
        <p role="status" className="admin-status-banner">
          {message}
        </p>
      )}

      {data && (
        <>
          {/* Responsive KPI Metrics Bar */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <span className="kpi-label">Total Requests</span>
              <strong className="kpi-value">{kpis.total}</strong>
            </div>
            <div className="admin-kpi-card kpi-alert">
              <span className="kpi-label">Open / New</span>
              <strong className="kpi-value">{kpis.open}</strong>
            </div>
            <div className="admin-kpi-card kpi-pending">
              <span className="kpi-label">In Review</span>
              <strong className="kpi-value">{kpis.review}</strong>
            </div>
            <div className="admin-kpi-card kpi-done">
              <span className="kpi-label">Completed / Resolved</span>
              <strong className="kpi-value">{kpis.resolved}</strong>
            </div>
          </div>

          {/* Controls Bar: Search & Filter Tabs */}
          <div className="admin-toolbar">
            <div className="admin-tabs" role="tablist" aria-label="Request categories">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "all"}
                className={`admin-tab-btn ${tab === "all" ? "active" : ""}`}
                onClick={() => setTab("all")}
              >
                All ({allItems.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "tickets"}
                className={`admin-tab-btn ${tab === "tickets" ? "active" : ""}`}
                onClick={() => setTab("tickets")}
              >
                Support Tickets ({data.tickets.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "privacy"}
                className={`admin-tab-btn ${tab === "privacy" ? "active" : ""}`}
                onClick={() => setTab("privacy")}
              >
                Privacy Compliance ({data.privacy.length})
              </button>
            </div>

            <div className="admin-search-wrapper">
              <Search size={16} />
              <input
                type="search"
                placeholder="Filter by subject, ID, message…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Filter support requests"
              />
            </div>
          </div>

          {/* Responsive Request Cards */}
          <div className="admin-requests-list">
            {filteredItems.map((item) => (
              <details className="staff-request" key={item.id}>
                <summary>
                  <div className="staff-summary-left">
                    <span className={`admin-kind-badge ${item.kind}`}>
                      {item.kind === "ticket" ? "TICKET" : "PRIVACY"}
                    </span>
                    <span className="staff-req-id">#{item.id.slice(0, 8)}</span>
                    <strong className="staff-req-title">{item.title}</strong>
                  </div>
                  <span className={`staff-status-badge status-${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {item.status}
                  </span>
                </summary>

                <div className="staff-request-content">
                  <div className="staff-messages-thread">
                    {item.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`staff-message-bubble ${m.author === "customer" ? "from-customer" : "from-advisor"}`}
                      >
                        <div className="message-header">
                          <strong>{m.author === "customer" ? "Customer" : "OVIA Advisor"}</strong>
                          {m.createdAt && (
                            <small>{new Date(m.createdAt).toLocaleDateString()}</small>
                          )}
                        </div>
                        <p>{m.text}</p>
                      </div>
                    ))}
                  </div>

                  <form
                    className="form admin-update-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      try {
                        await request("care/admin", "POST", {
                          ...Object.fromEntries(new FormData(e.currentTarget)),
                          id: item.id,
                          kind: item.kind,
                        });
                        await load();
                        setMessage("Request status updated.");
                      } catch (e) {
                        setMessage((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <div className="admin-form-row">
                      <label>
                        Update Status
                        <select name="status" defaultValue={item.status}>
                          {(item.kind === "ticket"
                            ? [
                                "Open",
                                "In Review",
                                "Waiting for Customer",
                                "Resolved",
                                "Closed",
                              ]
                            : ["Submitted", "In Review", "Completed", "Rejected"]
                          ).map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>

                      {item.kind === "ticket" && (
                        <label className="reply-label">
                          Reply to Customer
                          <textarea
                            name="reply"
                            maxLength={3000}
                            rows={3}
                            placeholder="Type advisor response…"
                          />
                        </label>
                      )}
                    </div>

                    {item.kind === "privacy" && (
                      <p className="small-note">
                        Mark completed only after the requested action has actually
                        been verified by compliance staff.
                      </p>
                    )}

                    <div className="admin-form-actions">
                      <button className="button dark" disabled={busy}>
                        {busy ? "Updating…" : "Update Request"}
                      </button>
                    </div>
                  </form>
                </div>
              </details>
            ))}

            {!filteredItems.length && (
              <div className="admin-empty-state">
                <p>No requests matching your filters.</p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
