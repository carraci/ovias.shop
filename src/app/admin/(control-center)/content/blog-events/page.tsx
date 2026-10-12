"use client";

import { useState } from "react";
import { Upload, BookOpen, Calendar } from "lucide-react";
import { BlogManager } from "@/components/admin/blog-manager";
import { EventManager } from "@/components/admin/event-manager";

export default function ContentManagerPage() {
  const [activeTab, setActiveTab] = useState<"articles" | "events">("events");

  // Article Creator State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState<{ slug: string; status: string } | null>(
    null,
  );

  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);

  async function upload(file?: File) {
    if (!file || busy) return;
    setBusy(true);
    setMessage("");
    setSaved(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/articles", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTitle(data.title);
      setContent(data.content);
      setMessage("File imported. Review the title before publishing.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save(status: string) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(data);
      window.dispatchEvent(new Event("ovia-articles-updated"));
      setMessage(
        status === "published"
          ? "Article published on the website."
          : "Draft saved.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: "32px auto", padding: 20 }}>
      {/* Editorial Content Mode Switcher */}
      <div
        style={{
          display: "flex",
          gap: 12,
          borderBottom: "1px solid #ddd",
          paddingBottom: 12,
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("events")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 20,
            border: activeTab === "events" ? "none" : "1px solid #ccc",
            background: activeTab === "events" ? "#121212" : "#fff",
            color: activeTab === "events" ? "#fff" : "#333",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <Calendar size={15} />
          OVIA Events &amp; Experiences
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("articles")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 20,
            border: activeTab === "articles" ? "none" : "1px solid #ccc",
            background: activeTab === "articles" ? "#121212" : "#fff",
            color: activeTab === "articles" ? "#fff" : "#333",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <BookOpen size={15} />
          Journal Articles &amp; Stories
        </button>
      </div>

      {activeTab === "events" ? (
        <EventManager />
      ) : (
        <>
          <section
            style={{
              border: "1px solid #ddd",
              borderRadius: 14,
              padding: 20,
              background: "#fff",
            }}
          >
            <h1 style={{ fontSize: 20, margin: "0 0 16px" }}>Create Article</h1>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void upload(e.dataTransfer.files[0]);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                border: "1px dashed #ddd",
                borderRadius: 10,
                padding: 24,
                cursor: "pointer",
              }}
            >
              <Upload size={20} />
              <strong>{busy ? "Processing…" : "Drop article file here"}</strong>
              <small>PDF, DOCX, TXT · up to 10 MB</small>
              <input
                type="file"
                aria-label="Upload article file"
                accept=".pdf,.docx,.txt"
                disabled={busy}
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </label>
            <label style={{ display: "block", marginTop: 16 }}>
              Article Title
              <input
                value={title}
                disabled={busy || !!saved}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  border: "1px solid #ddd",
                  borderRadius: 24,
                  padding: 12,
                  marginTop: 6,
                }}
              />
            </label>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                disabled={busy || !!saved || !title || !content}
                onClick={() => void save("draft")}
              >
                Save Draft
              </button>
              <button
                disabled={busy || !!saved || !title || !content}
                onClick={() => void save("published")}
                className="admin-btn-stroyka-yellow"
              >
                Publish Article
              </button>
              {saved?.status === "published" && (
                <a
                  href={`/blog/${saved.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View article
                </a>
              )}
              {saved && (
                <button
                  onClick={() => {
                    setSaved(null);
                    setTitle("");
                    setContent("");
                    setMessage("");
                  }}
                >
                  New article
                </button>
              )}
            </div>
            {message && <p role="status">{message}</p>}
          </section>
          <p style={{ marginTop: 16, color: "#666", fontSize: 13 }}>
            Drop file → Review title → Publish → Article appears on website.
          </p>
          <BlogManager />
        </>
      )}
    </main>
  );
}
