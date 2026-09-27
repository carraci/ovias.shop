"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Star,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  MoveUp,
  MoveDown,
  X,
  FileText,
  Eye,
  RefreshCw,
} from "lucide-react";
import type { Story, ContentBlock, ContentBlockType } from "@/lib/types";

const PRESET_IMAGES = [
  { label: "Residência João Marino Architecture", url: "/media/architecture.jpg" },
  { label: "Artist Case Studio Tools", url: "/media/creative.jpg" },
  { label: "Contemporary Art Exhibition", url: "/media/editorial-collection.jpg" },
  { label: "Italian Leather Atelier", url: "/media/editorial-bags.jpg" },
  { label: "Modernist Gallery Interior", url: "/media/spaces.jpg" },
  { label: "Desert Travel Horizon", url: "/media/journey.jpg" },
  { label: "Cologne Museum Preview", url: "/media/editorial-events.jpg" },
  { label: "Design Retrospective", url: "/media/editorial-style.jpg" },
  { label: "Aluminium Heritage", url: "/media/rimowa-hero.jpg" },
];

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "published" | "draft" | "featured">("all");
  const [toastMessage, setToastMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("ARCHITECTURE & SPACES");
  const [excerpt, setExcerpt] = useState("");
  const [heroImage, setHeroImage] = useState("/media/architecture.jpg");
  const [thumbnail, setThumbnail] = useState("/media/architecture.jpg");
  const [author, setAuthor] = useState("OVIA Editorial Studio");
  const [readingTime, setReadingTime] = useState("5 min read");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [featured, setFeatured] = useState(false);
  const [relatedProductsStr, setRelatedProductsStr] = useState("interval-cabin, forma-backpack");
  const [galleryStr, setGalleryStr] = useState("/media/architecture.jpg, /media/spaces.jpg");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/stories?status=all");
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories || []);
      }
    } catch (e) {
      showToast("Error loading stories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const openNewStoryModal = () => {
    setEditingStory(null);
    setTitle("");
    setSlug("");
    setCategory("ARCHITECTURE & SPACES");
    setExcerpt("");
    setHeroImage("/media/architecture.jpg");
    setThumbnail("/media/architecture.jpg");
    setAuthor("OVIA Editorial Studio");
    setReadingTime("4 min read");
    setStatus("published");
    setFeatured(false);
    setRelatedProductsStr("interval-cabin, forma-backpack");
    setGalleryStr("/media/architecture.jpg, /media/spaces.jpg");
    setContentBlocks([
      {
        id: "b-1",
        type: "paragraph",
        text: "The journey begins with an appreciation for materials and considered spatial balance.",
      },
      {
        id: "b-2",
        type: "quote",
        text: "Design is not what is added, but what remains when all excess has fallen away.",
        author: "Studio OVIA",
      },
    ]);
    setModalOpen(true);
  };

  const openEditStoryModal = (s: Story) => {
    setEditingStory(s);
    setTitle(s.title);
    setSlug(s.slug);
    setCategory(s.category);
    setExcerpt(s.excerpt);
    setHeroImage(s.heroImage);
    setThumbnail(s.thumbnail);
    setAuthor(s.author || "OVIA Editorial Studio");
    setReadingTime(s.readingTime || "4 min read");
    setStatus(s.status);
    setFeatured(s.featured);
    setRelatedProductsStr((s.relatedProducts || []).join(", "));
    setGalleryStr((s.gallery || []).join(", "));
    setContentBlocks(s.contentBlocks || []);
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingStory) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(autoSlug);
    }
  };

  const handleAddBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: "b-" + Date.now(),
      type,
      text: type === "heading" ? "New Section Heading" : "",
      image: type === "image" ? "/media/architecture.jpg" : undefined,
      caption: type === "image" ? "Editorial photographic study." : undefined,
      author: type === "quote" ? "Architectural Perspective" : undefined,
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const handleUpdateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setContentBlocks((blocks) =>
      blocks.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === contentBlocks.length - 1)
    )
      return;
    const target = direction === "up" ? index - 1 : index + 1;
    const copy = [...contentBlocks];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setContentBlocks(copy);
  };

  const handleDeleteBlock = (id: string) => {
    setContentBlocks((blocks) => blocks.filter((b) => b.id !== id));
  };

  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      showToast("Please enter a title and slug.");
      return;
    }

    setSaving(true);
    const relatedProducts = relatedProductsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const gallery = galleryStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title,
      slug,
      category,
      excerpt,
      heroImage,
      thumbnail,
      author,
      readingTime,
      status,
      featured,
      relatedProducts,
      gallery,
      contentBlocks,
    };

    try {
      if (editingStory) {
        const res = await fetch(`/api/v1/stories/${editingStory.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to update story.");
        }
        showToast("Story updated successfully.");
      } else {
        const res = await fetch("/api/v1/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to create story.");
        }
        showToast("Story created and published!");
      }
      setModalOpen(false);
      fetchStories();
    } catch (err: any) {
      showToast(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (story: Story) => {
    const nextStatus = story.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/v1/stories/${story.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`Story marked as ${nextStatus}.`);
        fetchStories();
      }
    } catch (e) {
      showToast("Failed to update status.");
    }
  };

  const handleToggleFeatured = async (story: Story) => {
    try {
      const res = await fetch(`/api/v1/stories/${story.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !story.featured }),
      });
      if (res.ok) {
        showToast(
          story.featured ? "Removed from featured carousel." : "Added to featured carousel."
        );
        fetchStories();
      }
    } catch (e) {
      showToast("Failed to update featured flag.");
    }
  };

  const handleDeleteStory = async (story: Story) => {
    if (!confirm(`Are you sure you want to delete "${story.title}"?`)) return;
    try {
      const res = await fetch(`/api/v1/stories/${story.slug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Story deleted.");
        fetchStories();
      }
    } catch (e) {
      showToast("Failed to delete story.");
    }
  };

  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      if (tab === "published" && s.status !== "published") return false;
      if (tab === "draft" && s.status !== "draft") return false;
      if (tab === "featured" && !s.featured) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.excerpt.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [stories, tab, search]);

  const kpis = useMemo(() => {
    const total = stories.length;
    const published = stories.filter((s) => s.status === "published").length;
    const drafts = stories.filter((s) => s.status === "draft").length;
    const featuredCount = stories.filter((s) => s.featured).length;
    return { total, published, drafts, featuredCount };
  }, [stories]);

  return (
    <div className="admin-support-page section">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast-banner" role="status">
          {toastMessage}
        </div>
      )}

      {/* Header Row */}
      <div className="admin-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p className="eyebrow">OVIA EDITORIAL & MEDIA CMS</p>
          <h1 style={{ fontSize: "clamp(32px, 3.5vw, 44px)", margin: "8px 0" }}>
            Stories & Newsroom Management
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>
            Curate luxury brand stories, architectural studies, craftsmanship chronicles, and homepage carousel features.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            className="button outline"
            onClick={fetchStories}
            style={{ padding: "10px 16px", display: "inline-flex", gap: "8px", alignItems: "center" }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            type="button"
            className="button dark"
            onClick={openNewStoryModal}
            style={{ padding: "10px 22px", display: "inline-flex", gap: "8px", alignItems: "center" }}
          >
            <Plus size={16} /> New Story
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid" style={{ margin: "32px 0 28px" }}>
        <div className="admin-kpi-card">
          <p className="admin-kpi-label">TOTAL STORIES</p>
          <p className="admin-kpi-value">{kpis.total}</p>
        </div>
        <div className="admin-kpi-card">
          <p className="admin-kpi-label">PUBLISHED</p>
          <p className="admin-kpi-value" style={{ color: "#256029" }}>{kpis.published}</p>
        </div>
        <div className="admin-kpi-card">
          <p className="admin-kpi-label">DRAFTS</p>
          <p className="admin-kpi-value" style={{ color: "#8a5300" }}>{kpis.drafts}</p>
        </div>
        <div className="admin-kpi-card">
          <p className="admin-kpi-label">FEATURED IN CAROUSEL</p>
          <p className="admin-kpi-value" style={{ color: "#111111" }}>{kpis.featuredCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "all", label: `All (${kpis.total})` },
            { id: "published", label: `Published (${kpis.published})` },
            { id: "draft", label: `Drafts (${kpis.drafts})` },
            { id: "featured", label: `Featured (${kpis.featuredCount})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`filter-toggle ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id as any)}
              style={{
                padding: "8px 16px",
                borderRadius: "3px",
                fontSize: "13px",
                background: tab === t.id ? "#111111" : "transparent",
                color: tab === t.id ? "#ffffff" : "var(--ink)",
                border: "1px solid " + (tab === t.id ? "#111111" : "var(--line)"),
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#ffffff",
            padding: "8px 14px",
            border: "1px solid var(--line)",
            borderRadius: "3px",
            minWidth: "260px",
          }}
        >
          <Search size={16} color="var(--muted)" />
          <input
            type="text"
            placeholder="Search stories, categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: "14px", width: "100%" }}
          />
        </div>
      </div>

      {/* Stories Grid */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--muted)" }}>
          Loading stories from database…
        </div>
      ) : filteredStories.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", background: "#ffffff", border: "1px solid var(--line)", borderRadius: "4px" }}>
          <p style={{ fontSize: "16px", color: "var(--muted)", margin: "0 0 16px" }}>No stories match this filter.</p>
          <button type="button" className="button dark" onClick={openNewStoryModal}>
            Create your first story
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "24px",
          }}
        >
          {filteredStories.map((story) => (
            <div
              key={story.id}
              style={{
                background: "#ffffff",
                border: "1px solid var(--line)",
                borderRadius: "4px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              {/* Card Image */}
              <div style={{ position: "relative", width: "100%", height: "200px", background: "#f2f2ee" }}>
                <Image
                  src={story.thumbnail || story.heroImage}
                  alt={story.title}
                  fill
                  style={{ objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      background: story.status === "published" ? "#256029" : "#8a5300",
                      color: "#ffffff",
                      fontSize: "10.5px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      padding: "4px 8px",
                      borderRadius: "2px",
                      textTransform: "uppercase",
                    }}
                  >
                    {story.status}
                  </span>
                  {story.featured && (
                    <span
                      style={{
                        background: "#111111",
                        color: "#ffffff",
                        fontSize: "10.5px",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        padding: "4px 8px",
                        borderRadius: "2px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Star size={11} fill="#ffffff" /> Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Card Details */}
              <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    color: "var(--muted)",
                    margin: "0 0 6px",
                  }}
                >
                  {story.category}
                </p>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    lineHeight: 1.35,
                    margin: "0 0 10px",
                    minHeight: "44px",
                  }}
                >
                  {story.title}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--muted)",
                    lineHeight: 1.5,
                    margin: "0 0 14px",
                    flex: 1,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {story.excerpt}
                </p>

                <div
                  style={{
                    fontSize: "11.5px",
                    color: "#888888",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "14px",
                    borderBottom: "1px solid #f0f0ee",
                    marginBottom: "14px",
                  }}
                >
                  <span>{story.readingTime || "4 min read"}</span>
                  <span>{new Date(story.publishedAt).toLocaleDateString()}</span>
                </div>

                {/* Card Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => openEditStoryModal(story)}
                      style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", gap: "6px", alignItems: "center" }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => handleTogglePublish(story)}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      {story.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => handleToggleFeatured(story)}
                      style={{
                        padding: "6px 10px",
                        fontSize: "12px",
                        background: story.featured ? "#f2f2ea" : "transparent",
                      }}
                      title={story.featured ? "Remove from carousel" : "Pin to carousel"}
                    >
                      <Star size={13} fill={story.featured ? "#111111" : "none"} />
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Link
                      href={`/journal/${story.slug}`}
                      target="_blank"
                      style={{ color: "var(--muted)", padding: "4px" }}
                      title="Preview public page"
                    >
                      <ExternalLink size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteStory(story)}
                      style={{ color: "#a83232", padding: "4px", background: "none", border: "none" }}
                      title="Delete story"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Story Editor Modal Drawer */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              background: "#ffffff",
              height: "100%",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              padding: "32px 36px",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <p className="eyebrow">{editingStory ? "EDIT STORY" : "CREATE NEW STORY"}</p>
                <h2 style={{ fontSize: "24px", margin: "4px 0 0" }}>
                  {editingStory ? editingStory.title : "New Editorial Article"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStory} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "6px" }}>
                  STORY TITLE *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Inside Residência João Marino: An Engineering Experiment..."
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: "3px", fontSize: "15px" }}
                />
              </div>

              {/* Slug & Category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "6px" }}>
                    URL SLUG * (/journal/...)
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                    placeholder="inside-residencia-joao-marino"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: "3px", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "6px" }}>
                    CATEGORY
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: "3px", fontSize: "14px", background: "#ffffff" }}
                  >
                    <option value="ARCHITECTURE & SPACES">ARCHITECTURE & SPACES</option>
                    <option value="COLLABORATIONS & DESIGN">COLLABORATIONS & DESIGN</option>
                    <option value="EXHIBITIONS & CULTURE">EXHIBITIONS & CULTURE</option>
                    <option value="SAVOIR-FAIRE">SAVOIR-FAIRE</option>
                    <option value="AWARDS & INNOVATION">AWARDS & INNOVATION</option>
                    <option value="EVERYDAY JOURNEYS">EVERYDAY JOURNEYS</option>
                    <option value="PLACES & PERSPECTIVES">PLACES & PERSPECTIVES</option>
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "6px" }}>
                  EDITORIAL EXCERPT (Cards & Meta Description)
                </label>
                <textarea
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A concise luxury synopsis of the story..."
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: "3px", fontSize: "14px", fontFamily: "inherit" }}
                />
              </div>

              {/* Images Presets & Inputs */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "6px" }}>
                  HERO & THUMBNAIL IMAGE
                </label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        setHeroImage(preset.url);
                        setThumbnail(preset.url);
                      }}
                      style={{
                        padding: "4px 10px",
                        fontSize: "11px",
                        borderRadius: "2px",
                        background: heroImage === preset.url ? "#111111" : "#f0f0ee",
                        color: heroImage === preset.url ? "#ffffff" : "#111111",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <input
                    type="text"
                    value={heroImage}
                    onChange={(e) => setHeroImage(e.target.value)}
                    placeholder="Hero Image URL (/media/...)"
                    style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "3px", fontSize: "13px" }}
                  />
                  <input
                    type="text"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="Thumbnail URL (/media/...)"
                    style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "3px", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Status and Featured */}
              <div style={{ display: "flex", gap: "24px", alignItems: "center", padding: "14px 16px", background: "#f8f8f6", borderRadius: "4px" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={status === "published"}
                    onChange={(e) => setStatus(e.target.checked ? "published" : "draft")}
                  />
                  <strong>Publish Live</strong> (Immediate appearance in journal)
                </label>

                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  <strong>Feature on Homepage Carousel</strong>
                </label>
              </div>

              {/* Author & Reading time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "6px" }}>
                    AUTHOR / BYLINE
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "3px", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "6px" }}>
                    READING TIME
                  </label>
                  <input
                    type="text"
                    value={readingTime}
                    onChange={(e) => setReadingTime(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "3px", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Related Products & Gallery */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "6px" }}>
                    RELATED PRODUCT SLUGS (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={relatedProductsStr}
                    onChange={(e) => setRelatedProductsStr(e.target.value)}
                    placeholder="interval-cabin, forma-backpack"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "3px", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "6px" }}>
                    GALLERY IMAGES (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={galleryStr}
                    onChange={(e) => setGalleryStr(e.target.value)}
                    placeholder="/media/architecture.jpg, /media/spaces.jpg"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "3px", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Content Blocks Manager */}
              <div style={{ marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em" }}>
                    STORY CONTENT BLOCKS ({contentBlocks.length})
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => handleAddBlock("paragraph")}
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                    >
                      + Paragraph
                    </button>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => handleAddBlock("heading")}
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                    >
                      + Heading
                    </button>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => handleAddBlock("quote")}
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                    >
                      + Pull Quote
                    </button>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => handleAddBlock("image")}
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                    >
                      + Image
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {contentBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      style={{
                        padding: "14px",
                        border: "1px solid var(--line)",
                        borderRadius: "4px",
                        background: "#fafaf8",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--muted)" }}>
                          #{index + 1} — {block.type}
                        </span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(index, "up")}
                            disabled={index === 0}
                            style={{ padding: "2px 6px", background: "none", border: "none", cursor: "pointer", opacity: index === 0 ? 0.3 : 1 }}
                            title="Move Up"
                          >
                            <MoveUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(index, "down")}
                            disabled={index === contentBlocks.length - 1}
                            style={{ padding: "2px 6px", background: "none", border: "none", cursor: "pointer", opacity: index === contentBlocks.length - 1 ? 0.3 : 1 }}
                            title="Move Down"
                          >
                            <MoveDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(block.id)}
                            style={{ padding: "2px 6px", background: "none", border: "none", cursor: "pointer", color: "#a83232" }}
                            title="Remove Block"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {block.type === "paragraph" && (
                        <textarea
                          rows={3}
                          value={block.text || ""}
                          onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                          placeholder="Write paragraph content..."
                          style={{ width: "100%", padding: "8px 10px", fontSize: "13.5px", fontFamily: "inherit", border: "1px solid var(--line)", borderRadius: "3px" }}
                        />
                      )}

                      {block.type === "heading" && (
                        <input
                          type="text"
                          value={block.text || ""}
                          onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                          placeholder="Section Heading..."
                          style={{ width: "100%", padding: "8px 10px", fontSize: "14px", fontWeight: 600, border: "1px solid var(--line)", borderRadius: "3px" }}
                        />
                      )}

                      {block.type === "quote" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <textarea
                            rows={2}
                            value={block.text || ""}
                            onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                            placeholder="Pull Quote text..."
                            style={{ width: "100%", padding: "8px 10px", fontSize: "14px", fontStyle: "italic", border: "1px solid var(--line)", borderRadius: "3px" }}
                          />
                          <input
                            type="text"
                            value={block.author || ""}
                            onChange={(e) => handleUpdateBlock(block.id, { author: e.target.value })}
                            placeholder="Quote Attribution / Author..."
                            style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "3px" }}
                          />
                        </div>
                      )}

                      {block.type === "image" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <input
                            type="text"
                            value={block.image || ""}
                            onChange={(e) => handleUpdateBlock(block.id, { image: e.target.value })}
                            placeholder="Image URL (/media/...)"
                            style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--line)", borderRadius: "3px" }}
                          />
                          <input
                            type="text"
                            value={block.caption || ""}
                            onChange={(e) => handleUpdateBlock(block.id, { caption: e.target.value })}
                            placeholder="Editorial photographic caption..."
                            style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "3px" }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
                <button
                  type="button"
                  className="button outline"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button dark"
                  disabled={saving}
                  style={{ minWidth: "140px" }}
                >
                  {saving ? "Saving…" : editingStory ? "Update Story" : "Publish Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
