"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit3, Trash2, ExternalLink, Calendar, MapPin, CheckCircle, RefreshCw } from "lucide-react";

interface EventItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  location: string;
  date: string;
  image: string;
  gallery: string[];
  description: string;
  status: "Draft" | "Upcoming" | "Completed";
  featured?: boolean;
  updatedAt?: string;
}

export function EventManager() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("Events");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState("/media/editorial-events.jpg");
  const [galleryText, setGalleryText] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Draft" | "Upcoming" | "Completed">("Upcoming");
  const [featured, setFeatured] = useState(false);

  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      if (res.ok && data.events) {
        setEvents(data.events);
      }
    } catch {
      setError("Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setCategory("Events");
    setLocation("");
    setDate("");
    setImage("/media/editorial-events.jpg");
    setGalleryText("");
    setDescription("");
    setStatus("Upcoming");
    setFeatured(false);
    setMessage("");
  };

  const handleEdit = (ev: EventItem) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setSubtitle(ev.subtitle || "");
    setCategory(ev.category || "Events");
    setLocation(ev.location || "");
    setDate(ev.date || "");
    setImage(ev.image || "/media/editorial-events.jpg");
    setGalleryText((ev.gallery || []).join("\n"));
    setDescription(ev.description || "");
    setStatus(ev.status || "Upcoming");
    setFeatured(Boolean(ev.featured));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (targetStatus?: "Draft" | "Upcoming" | "Completed") => {
    if (!title.trim()) {
      setError("Please enter an event title.");
      return;
    }

    setBusy(true);
    setMessage("");
    setError("");

    const chosenStatus = targetStatus || status;

    const payload = {
      id: editingId || undefined,
      title,
      slug,
      subtitle,
      category,
      location,
      date,
      image,
      gallery: galleryText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
      description,
      status: chosenStatus,
      featured,
    };

    try {
      const res = await fetch("/api/admin/events", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save event");

      setMessage(
        editingId
          ? "Event updated successfully."
          : `Event published! Available at /events/${slug}`
      );
      resetForm();
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string, titleName: string) => {
    if (!confirm(`Are you sure you want to delete "${titleName}"?`)) return;

    setBusy(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await loadEvents();
      }
    } catch {
      setError("Failed to delete event.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: "32px" }}>
      {/* Event Publisher Panel */}
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e0ded9",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "36px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 600 }}>
              {editingId ? "Edit OVIA Event" : "Publish New OVIA Event"}
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
              Publish luxury editorial events, exhibitions and previews.
            </p>
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              style={{
                background: "none",
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        {message && (
          <div
            style={{
              padding: "10px 14px",
              background: "#edf7ed",
              color: "#1e4620",
              borderRadius: "6px",
              fontSize: "13px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle size={15} />
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fdeded",
              color: "#5f2120",
              borderRadius: "6px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>
              Event Title *
            </label>
            <input
              type="text"
              placeholder="e.g. An Evening with OVIA"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
            {title && (
              <small style={{ display: "block", marginTop: "4px", color: "#777", fontSize: "11px" }}>
                Auto URL slug: <code>/events/{slug}</code>
              </small>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "14px",
                background: "#fff",
              }}
            >
              <option value="Events">Events</option>
              <option value="Experiences">Experiences</option>
              <option value="Launches">Launches</option>
              <option value="Collections">Collections</option>
              <option value="Exhibition">Exhibition</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>
            Subtitle / Curatorial Thesis
          </label>
          <input
            type="text"
            placeholder="e.g. An exploration of design, movement and the art of travel."
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>
              Date
            </label>
            <input
              type="text"
              placeholder="e.g. October 24, 2026"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>
              Location
            </label>
            <input
              type="text"
              placeholder="e.g. Palazzo Bocconi, Milan"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>
              Cover Image URL
            </label>
            <input
              type="text"
              placeholder="/media/editorial-events.jpg"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "14px",
                background: "#fff",
              }}
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>
            Gallery Images (one URL per line)
          </label>
          <textarea
            rows={3}
            placeholder={`/media/spaces.jpg\n/media/editorial-events.jpg\n/media/craftsmanship-artisan-detail.jpg`}
            value={galleryText}
            onChange={(e) => setGalleryText(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "13px",
              fontFamily: "monospace",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#333" }}>
            Event Description &amp; Editorial Article
          </label>
          <textarea
            rows={6}
            placeholder="Write the full luxury editorial story of the event..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Feature as top Experience Hero on <code>/events</code>
          </label>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            disabled={busy || !title}
            onClick={() => void handleSubmit("Draft")}
            style={{
              padding: "10px 18px",
              borderRadius: "20px",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={busy || !title}
            onClick={() => void handleSubmit()}
            style={{
              padding: "10px 22px",
              borderRadius: "20px",
              border: "none",
              background: "#121212",
              color: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {busy ? "Saving..." : editingId ? "Update Event" : "Publish Event"}
          </button>
        </div>
      </section>

      {/* Events Directory Table */}
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e0ded9",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Published Events &amp; Experiences</h3>
          <button
            onClick={() => void loadEvents()}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              fontSize: "12px",
              color: "#555",
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#777", fontSize: "13px" }}>Loading events...</p>
        ) : events.length === 0 ? (
          <p style={{ color: "#777", fontSize: "13px" }}>No events found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px",
                  border: "1px solid #f0eee9",
                  borderRadius: "8px",
                  background: "#fbfaf8",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <img
                    src={ev.image || "/media/editorial-events.jpg"}
                    alt=""
                    style={{ width: "54px", height: "42px", objectFit: "cover", borderRadius: "4px" }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "14px" }}>{ev.title}</strong>
                      <span
                        style={{
                          fontSize: "10px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: ev.status === "Completed" ? "#e6f4ea" : ev.status === "Upcoming" ? "#e8f0fe" : "#f1f3f4",
                          color: ev.status === "Completed" ? "#137333" : ev.status === "Upcoming" ? "#1a73e8" : "#5f6368",
                          fontWeight: 600,
                        }}
                      >
                        {ev.status}
                      </span>
                      {ev.featured && (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "#fef7e0",
                            color: "#b06000",
                            fontWeight: 600,
                          }}
                        >
                          Hero Featured
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "3px", display: "flex", gap: "12px" }}>
                      <span><Calendar size={12} style={{ verticalAlign: "-2px" }} /> {ev.date}</span>
                      <span><MapPin size={12} style={{ verticalAlign: "-2px" }} /> {ev.location}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <a
                    href={`/events/${ev.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "#121212",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    View <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => handleEdit(ev)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1a73e8",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => void handleDelete(ev.id, ev.title)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#d93025",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
