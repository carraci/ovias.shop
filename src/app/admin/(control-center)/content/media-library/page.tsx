"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Search,
  Folder,
  FolderPlus,
  LayoutGrid,
  List,
  Check,
  MoreVertical,
  X,
  Trash2,
  Download,
  ExternalLink,
  Plus,
  Play,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Video,
  ChevronDown,
} from "lucide-react";

type TopTab = "All Media" | "Images" | "Videos" | "Documents" | "Others";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  dimensions: string;
  size: string;
  format: "JPG" | "PNG" | "MP4" | "SVG" | "PDF";
  uploadedDate: string;
  uploadedBy: string;
  altText: string;
  caption: string;
  tags: string[];
  folder: string;
  usage: string[];
  isVideo?: boolean;
  videoDuration?: string;
  featured?: boolean;
}

const DEFAULT_FOLDERS = [
  { id: "all", name: "All Files", count: 1248 },
  { id: "bags", name: "Bags", count: 320 },
  { id: "luggage", name: "Luggage", count: 280 },
  { id: "accessories", name: "Accessories", count: 166 },
  { id: "banners", name: "Banners", count: 98 },
  { id: "blog", name: "Blog", count: 212 },
  { id: "events", name: "Events", count: 86 },
  { id: "others", name: "Others", count: 96 },
];

const DEFAULT_MEDIA_FILES: MediaItem[] = [
  {
    id: "1",
    name: "hero-travel.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1920 × 1080",
    size: "1.2 MB",
    format: "JPG",
    uploadedDate: "Oct 1, 2026, 10:24 AM",
    uploadedBy: "Adarsh Shukla",
    altText: "OVIA luxury luggage for everyday journeys",
    caption: "Built for everyday journeys",
    tags: ["hero", "homepage", "luggage"],
    folder: "Banners",
    usage: ["Homepage Hero", "Page Section"],
  },
  {
    id: "2",
    name: "bag-collection.jpg",
    url: "/media/luggage.svg",
    dimensions: "1440 × 960",
    size: "890 KB",
    format: "JPG",
    uploadedDate: "Sep 28, 2026, 04:15 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "Crafted for modern life",
    caption: "Bags Collection Banner",
    tags: ["bags", "collection", "lifestyle"],
    folder: "Bags",
    usage: ["Product", "Page Section"],
  },
  {
    id: "3",
    name: "luggage-cabin.jpg",
    url: "/media/luggage.svg",
    dimensions: "1440 × 960",
    size: "1.1 MB",
    format: "JPG",
    uploadedDate: "Sep 26, 2026, 11:30 AM",
    uploadedBy: "Adarsh Shukla",
    altText: "OVIA Aluminium Cabin Trunk",
    caption: "Cabin Edition Silver",
    tags: ["luggage", "cabin", "aluminium"],
    folder: "Luggage",
    usage: ["Product"],
  },
  {
    id: "4",
    name: "model-travel.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1440 × 960",
    size: "940 KB",
    format: "JPG",
    uploadedDate: "Sep 24, 2026, 02:45 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "Traveler carrying OVIA Cabin Suitcase",
    caption: "Lifestyle in Transit",
    tags: ["lifestyle", "model", "travel"],
    folder: "Blog",
    usage: ["Blog Post"],
  },
  {
    id: "5",
    name: "store-mumbai.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1440 × 960",
    size: "1.4 MB",
    format: "JPG",
    uploadedDate: "Sep 22, 2026, 06:10 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "OVIA Mumbai Flagship Boutique Exterior",
    caption: "Mumbai Flagship Store Opening",
    tags: ["store", "mumbai", "flagship"],
    folder: "Events",
    usage: ["Event"],
  },
  {
    id: "6",
    name: "blog-journal.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1440 × 960",
    size: "760 KB",
    format: "JPG",
    uploadedDate: "Sep 20, 2026, 09:15 AM",
    uploadedBy: "Adarsh Shukla",
    altText: "Editorial feature image on artisanal leather",
    caption: "The Art of Hand-Stitched Leather",
    tags: ["journal", "editorial", "craft"],
    folder: "Blog",
    usage: ["Blog Post"],
  },
  {
    id: "7",
    name: "accessories.jpg",
    url: "/media/luggage.svg",
    dimensions: "1440 × 960",
    size: "620 KB",
    format: "JPG",
    uploadedDate: "Sep 18, 2026, 01:20 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "Leather tags and passport covers",
    caption: "Signature Travel Accessories",
    tags: ["accessories", "leather", "gifts"],
    folder: "Accessories",
    usage: ["Product"],
  },
  {
    id: "8",
    name: "luggage-aluminium.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1440 × 960",
    size: "1.3 MB",
    format: "JPG",
    uploadedDate: "Sep 15, 2026, 05:00 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "Aerospace-grade aluminium luggage shell",
    caption: "Titanium Silver Anodized",
    tags: ["aluminium", "titanium", "featured"],
    folder: "Luggage",
    usage: ["Homepage Hero", "Product"],
    featured: true,
  },
  {
    id: "9",
    name: "store-interior.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1440 × 960",
    size: "1.5 MB",
    format: "JPG",
    uploadedDate: "Sep 12, 2026, 12:00 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "Architectural interior of OVIA showroom",
    caption: "Atelier Display Room",
    tags: ["architecture", "store", "interior"],
    folder: "Events",
    usage: ["Event", "Page Section"],
  },
  {
    id: "10",
    name: "event-evening.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1440 × 960",
    size: "1.1 MB",
    format: "JPG",
    uploadedDate: "Sep 10, 2026, 08:30 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "Evening gala gathering at flagship opening",
    caption: "Private Preview Gala",
    tags: ["event", "gala", "guests"],
    folder: "Events",
    usage: ["Event"],
  },
  {
    id: "11",
    name: "banner-discover.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1920 × 800",
    size: "1.6 MB",
    format: "JPG",
    uploadedDate: "Sep 08, 2026, 10:15 AM",
    uploadedBy: "Adarsh Shukla",
    altText: "Discover panoramic mountain journey",
    caption: "Stories from the World Banner",
    tags: ["discover", "banner", "landscape"],
    folder: "Banners",
    usage: ["Page Section"],
  },
  {
    id: "12",
    name: "bag-black.jpg",
    url: "/media/luggage.svg",
    dimensions: "1440 × 960",
    size: "810 KB",
    format: "JPG",
    uploadedDate: "Sep 05, 2026, 03:40 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "Full-grain noir calfskin weekender",
    caption: "Noir Voyage Duffel",
    tags: ["duffel", "noir", "leather"],
    folder: "Bags",
    usage: ["Product"],
  },
  {
    id: "13",
    name: "video-campaign.mp4",
    url: "/media/case-flowers.jpg",
    dimensions: "1920 × 1080",
    size: "18.4 MB",
    format: "MP4",
    uploadedDate: "Sep 02, 2026, 07:20 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "Campaign video of OVIA in Paris and Tokyo",
    caption: "The Journey Begins Campaign",
    tags: ["video", "campaign", "global"],
    folder: "Banners",
    usage: ["Homepage Hero"],
    isVideo: true,
    videoDuration: "00:24",
  },
  {
    id: "14",
    name: "blog-fashion.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1440 × 960",
    size: "890 KB",
    format: "JPG",
    uploadedDate: "Aug 30, 2026, 01:10 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "Fashion week styling with OVIA briefcase",
    caption: "Style Editorial Milan",
    tags: ["milan", "fashion", "briefcase"],
    folder: "Blog",
    usage: ["Blog Post"],
  },
  {
    id: "15",
    name: "service-repair.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1440 × 960",
    size: "930 KB",
    format: "JPG",
    uploadedDate: "Aug 28, 2026, 11:00 AM",
    uploadedBy: "Adarsh Shukla",
    altText: "Master artisan repairing wheel system",
    caption: "Lifetime Care Guarantee",
    tags: ["service", "repair", "artisan"],
    folder: "Others",
    usage: ["Page Section"],
  },
  {
    id: "16",
    name: "journal-story.jpg",
    url: "/media/case-flowers.jpg",
    dimensions: "1440 × 960",
    size: "840 KB",
    format: "JPG",
    uploadedDate: "Aug 25, 2026, 04:30 PM",
    uploadedBy: "Adarsh Shukla",
    altText: "Historic European cobblestone streets",
    caption: "Wandering Kyoto & Rome",
    tags: ["journal", "kyoto", "rome"],
    folder: "Blog",
    usage: ["Blog Post"],
  },
];

export default function MediaLibraryAdminPage() {
  const [activeTab, setActiveTab] = useState<TopTab>("All Media");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMediaId, setSelectedMediaId] = useState<string>("1");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(DEFAULT_MEDIA_FILES);
  const [newTagInput, setNewTagInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const selectedItem =
    mediaItems.find((m) => m.id === selectedMediaId) || mediaItems[0];

  function updateSelected(fields: Partial<MediaItem>) {
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === selectedMediaId ? { ...item, ...fields } : item
      )
    );
  }

  function handleAddTag() {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim().toLowerCase();
    if (!selectedItem.tags.includes(tag)) {
      updateSelected({ tags: [...selectedItem.tags, tag] });
    }
    setNewTagInput("");
  }

  function handleRemoveTag(tag: string) {
    updateSelected({ tags: selectedItem.tags.filter((t) => t !== tag) });
  }

  function handleToggleUsage(badge: string) {
    const current = selectedItem.usage || [];
    const updated = current.includes(badge)
      ? current.filter((b) => b !== badge)
      : [...current, badge];
    updateSelected({ usage: updated });
  }

  function showToastMessage(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const filteredItems = mediaItems.filter((item) => {
    if (activeTab === "Images" && item.isVideo) return false;
    if (activeTab === "Videos" && !item.isVideo) return false;
    if (selectedFolder !== "all") {
      const folderObj = DEFAULT_FOLDERS.find((f) => f.id === selectedFolder);
      if (folderObj && item.folder.toLowerCase() !== folderObj.name.toLowerCase()) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchAlt = item.altText.toLowerCase().includes(q);
      const matchTag = item.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchAlt || matchTag;
    }
    return true;
  });

  return (
    <div
      style={{
        backgroundColor: "#FBF9F5",
        minHeight: "100vh",
        color: "#1A1A1A",
        fontFamily: "var(--sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            backgroundColor: "#111111",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 9999,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={16} color="#4ADE80" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Bar */}
      <header
        style={{
          borderBottom: "1px solid #EAE5DC",
          padding: "20px 32px 16px",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              fontSize: 12,
              color: "#8A8A8A",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>Content</span>
            <span style={{ fontSize: 10 }}>&gt;</span>
            <span style={{ color: "#111111", fontWeight: 500 }}>Media Library</span>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => showToastMessage("Upload dialog opened. Select media files.")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 4,
              backgroundColor: "#111111",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <UploadCloud size={14} />
            <span>Upload Media</span>
          </button>
        </div>

        {/* Page Title & Subtitle */}
        <div style={{ marginBottom: 16 }}>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 26,
              fontWeight: 400,
              color: "#111111",
              margin: "0 0 4px",
            }}
          >
            Media Library
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#777777" }}>
            Manage all images, videos and files for your website. Organize, optimize and
            reuse across pages, products, blog and events.
          </p>
        </div>

        {/* Top Tabs */}
        <div
          style={{
            display: "flex",
            gap: 24,
            borderBottom: "1px solid #EAE5DC",
            margin: "0 -32px -16px",
            padding: "0 32px",
          }}
        >
          {(["All Media", "Images", "Videos", "Documents", "Others"] as TopTab[]).map(
            (tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 0 12px",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#111111" : "#777777",
                    border: "none",
                    borderBottom: isActive
                      ? "2px solid #111111"
                      : "2px solid transparent",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab}
                </button>
              );
            }
          )}
        </div>
      </header>

      {/* Main Studio Area */}
      <main
        style={{
          maxWidth: 1680,
          margin: "0 auto",
          padding: "24px 32px 60px",
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Left Column: Folders + Grid of Media Files */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              backgroundColor: "#FFFFFF",
              border: "1px solid #EAE5DC",
              borderRadius: 6,
              padding: "10px 14px",
            }}
          >
            {/* Search Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: 1,
                maxWidth: 380,
              }}
            >
              <Search size={14} color="#888" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files, folders, or tags..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  color: "#111",
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select
                style={{
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px solid #D5CFC5",
                  backgroundColor: "#FFFFFF",
                  fontSize: 11,
                  color: "#333",
                  outline: "none",
                }}
              >
                <option>All Types</option>
                <option>Images</option>
                <option>Videos</option>
                <option>Documents</option>
              </select>

              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px solid #D5CFC5",
                  backgroundColor: "#FFFFFF",
                  fontSize: 11,
                  color: "#333",
                  outline: "none",
                }}
              >
                <option value="all">All Folders</option>
                <option value="bags">Bags</option>
                <option value="luggage">Luggage</option>
                <option value="accessories">Accessories</option>
                <option value="banners">Banners</option>
                <option value="blog">Blog</option>
                <option value="events">Events</option>
                <option value="others">Others</option>
              </select>

              <select
                style={{
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px solid #D5CFC5",
                  backgroundColor: "#FFFFFF",
                  fontSize: 11,
                  color: "#333",
                  outline: "none",
                }}
              >
                <option>Date Added (Newest)</option>
                <option>Date Added (Oldest)</option>
                <option>File Size (Largest)</option>
                <option>Name (A-Z)</option>
              </select>

              {/* View Toggle */}
              <div
                style={{
                  display: "flex",
                  borderRadius: 4,
                  border: "1px solid #EAE5DC",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  style={{
                    padding: "6px 8px",
                    border: "none",
                    backgroundColor: viewMode === "grid" ? "#F5F2EB" : "#FFFFFF",
                    color: viewMode === "grid" ? "#111" : "#888",
                    cursor: "pointer",
                  }}
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  style={{
                    padding: "6px 8px",
                    border: "none",
                    backgroundColor: viewMode === "list" ? "#F5F2EB" : "#FFFFFF",
                    color: viewMode === "list" ? "#111" : "#888",
                    cursor: "pointer",
                  }}
                >
                  <List size={13} />
                </button>
              </div>

              <button
                style={{
                  padding: "6px 12px",
                  borderRadius: 4,
                  border: "1px solid #D5CFC5",
                  backgroundColor: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Select
              </button>

              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px dashed #D5CFC5",
                  backgroundColor: "#FDFBF7",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                <Plus size={11} />
                <span>New Folder</span>
              </button>
            </div>
          </div>

          {/* Folders (8) Bar */}
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#111111",
                marginBottom: 10,
              }}
            >
              Folders (8)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: 10,
              }}
            >
              {DEFAULT_FOLDERS.map((f) => {
                const isActive = selectedFolder === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFolder(f.id)}
                    style={{
                      backgroundColor: isActive ? "#FDFBF7" : "#FFFFFF",
                      border: isActive ? "1.5px solid #111111" : "1px solid #EAE5DC",
                      borderRadius: 6,
                      padding: "10px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Folder
                      size={16}
                      color={isActive ? "#111111" : "#8E693E"}
                      fill={isActive ? "#111111" : "#D8B486"}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#111111",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {f.name}
                      </div>
                      <div style={{ fontSize: 9, color: "#888888" }}>{f.count} files</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media Files Header & Grid */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #EAE5DC",
              borderRadius: 6,
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#111111",
                marginBottom: 16,
              }}
            >
              Media Files ({filteredItems.length})
            </div>

            {/* Media Items Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 14,
              }}
            >
              {filteredItems.map((item) => {
                const isSelected = item.id === selectedMediaId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMediaId(item.id)}
                    style={{
                      border: isSelected ? "2px solid #111111" : "1px solid #EAE5DC",
                      borderRadius: 6,
                      overflow: "hidden",
                      backgroundColor: "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    {/* Media Thumbnail Container */}
                    <div
                      style={{
                        position: "relative",
                        height: 120,
                        backgroundColor: "#F5F2EB",
                        backgroundImage: `url(${item.url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          width: 16,
                          height: 16,
                          borderRadius: 3,
                          backgroundColor: isSelected ? "#111111" : "rgba(255,255,255,0.85)",
                          border: isSelected ? "none" : "1px solid #CCC",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isSelected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </div>

                      {/* Featured Badge */}
                      {item.featured && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 28,
                            backgroundColor: "rgba(17,17,17,0.8)",
                            color: "#FFFFFF",
                            fontSize: 8,
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 2,
                            letterSpacing: "0.04em",
                          }}
                        >
                          Featured
                        </div>
                      )}

                      {/* Action Menu Dots */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToastMessage(`Options for ${item.name}`);
                        }}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 20,
                          height: 20,
                          borderRadius: 3,
                          backgroundColor: "rgba(255,255,255,0.75)",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#333",
                        }}
                      >
                        <MoreVertical size={12} />
                      </button>

                      {/* Video Play Overlay */}
                      {item.isVideo && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(0,0,0,0.25)",
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              backgroundColor: "rgba(255,255,255,0.9)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Play size={12} fill="#111" color="#111" style={{ marginLeft: 2 }} />
                          </div>
                        </div>
                      )}

                      {/* Video Duration */}
                      {item.videoDuration && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 6,
                            right: 6,
                            backgroundColor: "rgba(0,0,0,0.75)",
                            color: "#FFFFFF",
                            fontSize: 8,
                            padding: "1px 4px",
                            borderRadius: 2,
                          }}
                        >
                          {item.videoDuration}
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata Info */}
                    <div style={{ padding: "8px 10px" }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#111111",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 3,
                        }}
                      >
                        <span style={{ fontSize: 9, color: "#888888" }}>
                          {item.dimensions}
                        </span>
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            padding: "1px 4px",
                            borderRadius: 2,
                            backgroundColor: "#F0ECE6",
                            color: "#666666",
                          }}
                        >
                          {item.format}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: File Details Inspector Panel */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #EAE5DC",
            borderRadius: 6,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            position: "sticky",
            top: 24,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111111" }}>
              File Details
            </div>
            <button
              style={{
                border: "none",
                backgroundColor: "transparent",
                color: "#888",
                cursor: "pointer",
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Large Preview */}
          <div
            style={{
              width: "100%",
              height: 180,
              borderRadius: 4,
              border: "1px solid #EAE5DC",
              backgroundImage: `url(${selectedItem.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
            }}
          />

          {/* File Meta Summary */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111111" }}>
              {selectedItem.name}
            </div>
            <div style={{ fontSize: 10, color: "#888888", marginTop: 2 }}>
              {selectedItem.dimensions} • {selectedItem.size} • {selectedItem.format}
            </div>
            <div style={{ fontSize: 10, color: "#888888", marginTop: 2 }}>
              Uploaded on {selectedItem.uploadedDate}
            </div>
            <div style={{ fontSize: 10, color: "#888888", marginTop: 1 }}>
              Uploaded by {selectedItem.uploadedBy}
            </div>
          </div>

          {/* Actions: Replace Image & Delete */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => showToastMessage("Replace dialog opened")}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px",
                borderRadius: 4,
                backgroundColor: "#111111",
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              <UploadCloud size={13} />
              <span>Replace Image</span>
            </button>

            <button
              onClick={() => showToastMessage("File deleted")}
              style={{
                padding: "8px 12px",
                borderRadius: 4,
                border: "1px solid #FCA5A5",
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#666",
                  marginBottom: 3,
                }}
              >
                File Name
              </label>
              <input
                type="text"
                value={selectedItem.name}
                onChange={(e) => updateSelected({ name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  border: "1px solid #D5CFC5",
                  fontSize: 11,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#666",
                  marginBottom: 3,
                }}
              >
                Alt Text (for SEO)
              </label>
              <input
                type="text"
                value={selectedItem.altText}
                onChange={(e) => updateSelected({ altText: e.target.value })}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  border: "1px solid #D5CFC5",
                  fontSize: 11,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#666",
                  marginBottom: 3,
                }}
              >
                Caption
              </label>
              <input
                type="text"
                value={selectedItem.caption}
                onChange={(e) => updateSelected({ caption: e.target.value })}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  border: "1px solid #D5CFC5",
                  fontSize: 11,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Tags */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#666",
                  marginBottom: 4,
                }}
              >
                Tags
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                {selectedItem.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 7px",
                      borderRadius: 3,
                      backgroundColor: "#F0ECE6",
                      fontSize: 10,
                      color: "#333",
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        padding: 0,
                        color: "#888",
                      }}
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  placeholder="New tag..."
                  style={{
                    flex: 1,
                    padding: "4px 8px",
                    borderRadius: 3,
                    border: "1px solid #D5CFC5",
                    fontSize: 10,
                  }}
                />
                <button
                  onClick={handleAddTag}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 3,
                    border: "1px solid #D5CFC5",
                    backgroundColor: "#FFF",
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  + Add Tag
                </button>
              </div>
            </div>

            {/* Folder Dropdown */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#666",
                  marginBottom: 3,
                }}
              >
                Folder
              </label>
              <select
                value={selectedItem.folder}
                onChange={(e) => updateSelected({ folder: e.target.value })}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  border: "1px solid #D5CFC5",
                  fontSize: 11,
                  backgroundColor: "#FFF",
                }}
              >
                <option>Banners</option>
                <option>Bags</option>
                <option>Luggage</option>
                <option>Accessories</option>
                <option>Blog</option>
                <option>Events</option>
                <option>Others</option>
              </select>
            </div>

            {/* Usage Badges */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#666",
                  marginBottom: 6,
                }}
              >
                Usage
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {[
                  "Homepage Hero",
                  "Blog Post",
                  "Event",
                  "Product",
                  "Page Section",
                  "Other",
                ].map((badge) => {
                  const isUsed = selectedItem.usage?.includes(badge);
                  return (
                    <button
                      key={badge}
                      onClick={() => handleToggleUsage(badge)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 3,
                        border: isUsed ? "1px solid #111111" : "1px solid #E5E0D8",
                        backgroundColor: isUsed ? "#111111" : "#FAFAF8",
                        color: isUsed ? "#FFFFFF" : "#666666",
                        fontSize: 10,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {badge}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Download & External Open */}
          <div
            style={{
              display: "flex",
              gap: 8,
              borderTop: "1px solid #EAE5DC",
              paddingTop: 14,
            }}
          >
            <button
              onClick={() => showToastMessage(`Downloading ${selectedItem.name}`)}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px",
                borderRadius: 4,
                border: "1px solid #D5CFC5",
                backgroundColor: "#FFFFFF",
                fontSize: 11,
                fontWeight: 600,
                color: "#111111",
                cursor: "pointer",
              }}
            >
              <Download size={13} />
              <span>Download</span>
            </button>

            <Link
              href={selectedItem.url}
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 12px",
                borderRadius: 4,
                border: "1px solid #D5CFC5",
                backgroundColor: "#FFFFFF",
                color: "#111111",
                cursor: "pointer",
              }}
            >
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
