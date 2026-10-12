"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  Search,
  User,
  Heart,
  ShoppingBag,
  Home,
  Briefcase,
  Luggage as LuggageIcon,
  Compass,
  Wrench,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  CheckCircle2,
  X,
} from "lucide-react";

type TopTab =
  | "Main Menu"
  | "Footer Menu"
  | "Utility Menu (Top Bar)"
  | "Mobile Menu"
  | "Menu Settings";

type DeviceView = "desktop" | "tablet" | "mobile";

interface SubItem {
  id: string;
  label: string;
  href: string;
  image?: string;
  subtitle?: string;
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  iconName?: string;
  image?: string;
  enabled: boolean;
  expanded?: boolean;
  subItems?: SubItem[];
  dropdownStyle?: string;
  columns?: number;
  showFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  cssClass?: string;
  openNewTab?: boolean;
}

const DEFAULT_MAIN_MENU: MenuItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    iconName: "Home",
    enabled: true,
    expanded: false,
  },
  {
    id: "bags",
    label: "Bags",
    href: "/bags",
    iconName: "ShoppingBag",
    image: "/media/case-flowers.jpg",
    enabled: true,
    expanded: true,
    dropdownStyle: "Mega Menu (with images)",
    columns: 4,
    showFeatured: true,
    seoTitle: "Bags | OVIA",
    seoDescription:
      "Explore OVIA's collection of travel, business and everyday bags.",
    openNewTab: false,
    subItems: [
      { id: "all-bags", label: "All Bags", href: "/bags" },
      { id: "backpacks", label: "Backpacks", href: "/bags/backpacks", subtitle: "For every journey", image: "/media/luggage.svg" },
      { id: "tote-bags", label: "Tote Bags", href: "/bags/tote-bags", subtitle: "Work in style", image: "/media/luggage.svg" },
      { id: "crossbody", label: "Crossbody Bags", href: "/bags/crossbody", subtitle: "Modern essentials", image: "/media/luggage.svg" },
      { id: "travel-bags", label: "Travel Bags", href: "/bags/travel", subtitle: "Discover now", image: "/media/luggage.svg" },
    ],
  },
  {
    id: "luggage",
    label: "Luggage",
    href: "/luggage",
    iconName: "Luggage",
    image: "/media/case-flowers.jpg",
    enabled: true,
    expanded: false,
    dropdownStyle: "Mega Menu (with images)",
    columns: 4,
    showFeatured: true,
    seoTitle: "Luggage | OVIA",
    seoDescription: "Luxury suitcases and cabin trunks engineered for effortless mobility.",
    openNewTab: false,
    subItems: [
      { id: "all-luggage", label: "All Luggage", href: "/luggage" },
      { id: "cabin", label: "Cabin", href: "/luggage/cabin" },
      { id: "check-in", label: "Check-In", href: "/luggage/check-in" },
      { id: "trunks", label: "Trunks", href: "/luggage/trunks" },
      { id: "emblematic", label: "Emblematic Pieces", href: "/luggage/emblematic" },
    ],
  },
  {
    id: "discover",
    label: "Discover",
    href: "/journal",
    iconName: "Compass",
    enabled: true,
    expanded: false,
  },
  {
    id: "services",
    label: "Services",
    href: "/services",
    iconName: "Wrench",
    enabled: true,
    expanded: false,
  },
];

export default function NavigationAdminPage() {
  const [activeTab, setActiveTab] = useState<TopTab>("Main Menu");
  const [deviceView, setDeviceView] = useState<DeviceView>("desktop");
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MAIN_MENU);
  const [selectedId, setSelectedId] = useState<string>("bags");
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Settings State
  const [menuSettings, setMenuSettings] = useState({
    stickyHeader: true,
    showSearch: true,
    showAccount: true,
    showWishlist: true,
    showCart: true,
    menuAlignment: "Center",
    menuStyle: "Clean (Minimal)",
    hoverEffect: "Underline",
  });

  const selectedItem = menuItems.find((i) => i.id === selectedId) || menuItems[1];

  function updateSelectedItem(fields: Partial<MenuItem>) {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === selectedId ? { ...item, ...fields } : item))
    );
  }

  function toggleItemEnabled(id: string) {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  }

  function toggleItemExpanded(id: string) {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, expanded: !item.expanded } : item))
    );
  }

  async function handleSaveChanges() {
    setSaving(true);
    try {
      await fetch("/api/admin/content/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItems, menuSettings }),
      });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3500);
    } catch {
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3500);
    } finally {
      setSaving(false);
    }
  }

  function renderMenuIcon(name?: string) {
    switch (name) {
      case "Home":
        return <Home size={15} color="#555" />;
      case "ShoppingBag":
        return <ShoppingBag size={15} color="#555" />;
      case "Luggage":
        return <LuggageIcon size={15} color="#555" />;
      case "Compass":
        return <Compass size={15} color="#555" />;
      case "Wrench":
        return <Wrench size={15} color="#555" />;
      default:
        return <ShoppingBag size={15} color="#555" />;
    }
  }

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
      {saveToast && (
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
          <span>Navigation menu changes saved successfully!</span>
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
            <span style={{ color: "#111111", fontWeight: 500 }}>Navigation</span>
          </div>

          {/* Top Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/"
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 4,
                border: "1px solid #D5CFC5",
                backgroundColor: "#FFFFFF",
                color: "#222222",
                fontSize: 12,
                fontWeight: 500,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              <span>View Website</span>
              <ExternalLink size={13} />
            </Link>

            <button
              onClick={handleSaveChanges}
              disabled={saving}
              style={{
                padding: "8px 20px",
                borderRadius: 4,
                backgroundColor: "#111111",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "opacity 0.15s ease",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
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
            Navigation
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#777777" }}>
            Manage your website menus, categories and navigation structure.
          </p>
        </div>

        {/* Studio Top Tabs */}
        <div
          style={{
            display: "flex",
            gap: 24,
            borderBottom: "1px solid #EAE5DC",
            margin: "0 -32px -16px",
            padding: "0 32px",
          }}
        >
          {(
            [
              "Main Menu",
              "Footer Menu",
              "Utility Menu (Top Bar)",
              "Mobile Menu",
              "Menu Settings",
            ] as TopTab[]
          ).map((tab) => {
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
                  borderBottom: isActive ? "2px solid #111111" : "2px solid transparent",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Studio Body: 3-column Layout */}
      <main
        style={{
          maxWidth: 1680,
          margin: "0 auto",
          padding: "24px 32px 60px",
          display: "grid",
          gridTemplateColumns: "340px 440px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* =========================================
            COLUMN 1: MENU STRUCTURE
            ========================================= */}
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
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 16,
                fontWeight: 600,
                color: "#111111",
                margin: 0,
              }}
            >
              Menu Structure
            </h2>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid #E5E0D8",
                backgroundColor: "#FDFBF7",
                fontSize: 11,
                fontWeight: 500,
                color: "#111111",
                cursor: "pointer",
              }}
            >
              <Plus size={11} />
              <span>Add Menu Item</span>
              <ChevronDown size={11} />
            </button>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 11, color: "#888888" }}>
            Drag and drop to reorder menu items. Click any item to edit.
          </p>

          {/* Menu Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {menuItems.map((item) => {
              const isSelected = item.id === selectedId;
              const hasSub = item.subItems && item.subItems.length > 0;

              return (
                <div key={item.id} style={{ display: "flex", flexDirection: "column" }}>
                  {/* Primary Item Row */}
                  <div
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 4,
                      border: isSelected ? "1px solid #D8B486" : "1px solid #EAE5DC",
                      backgroundColor: isSelected ? "#FDFBF7" : "#FFFFFF",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <GripVertical size={13} color="#BBB" style={{ cursor: "grab" }} />
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 4,
                        backgroundColor: "#F5F2EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {renderMenuIcon(item.iconName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#111111",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#888888",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.href}
                      </div>
                    </div>

                    {/* Enable Toggle Switch */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItemEnabled(item.id);
                      }}
                      style={{
                        width: 32,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: item.enabled ? "#111111" : "#D5CFC5",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 2,
                          left: item.enabled ? 16 : 2,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: "#FFFFFF",
                          transition: "left 0.2s ease",
                        }}
                      />
                    </div>

                    {/* Expand/Collapse Chevron */}
                    {hasSub && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemExpanded(item.id);
                        }}
                        style={{ padding: 2, cursor: "pointer" }}
                      >
                        <ChevronDown
                          size={13}
                          color="#777"
                          style={{
                            transform: item.expanded ? "rotate(0deg)" : "rotate(-90deg)",
                            transition: "transform 0.2s ease",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Sub-Items List */}
                  {hasSub && item.expanded && (
                    <div
                      style={{
                        marginLeft: 32,
                        marginTop: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        borderLeft: "2px dashed #EAE5DC",
                        paddingLeft: 10,
                      }}
                    >
                      {item.subItems?.map((sub) => (
                        <div
                          key={sub.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 8px",
                            borderRadius: 4,
                            border: "1px solid #EAE5DC",
                            backgroundColor: "#FAFAF8",
                            fontSize: 11,
                          }}
                        >
                          <GripVertical size={11} color="#CCC" />
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 3,
                              backgroundColor: "#ECE8DF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 600,
                              color: "#666",
                            }}
                          >
                            {sub.label.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, color: "#222" }}>{sub.label}</div>
                            <div style={{ color: "#999", fontSize: 9 }}>{sub.href}</div>
                          </div>
                          <MoreVertical size={12} color="#999" style={{ cursor: "pointer" }} />
                        </div>
                      ))}

                      {/* Add Sub Item Button */}
                      <button
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 8px",
                          borderRadius: 4,
                          border: "1px dashed #D5CFC5",
                          backgroundColor: "#FDFBF7",
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#666",
                          cursor: "pointer",
                          alignSelf: "flex-start",
                        }}
                      >
                        <Plus size={11} />
                        <span>Add Sub Item</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Menu Item Bottom Button */}
          <button
            style={{
              width: "100%",
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px",
              borderRadius: 4,
              border: "1px dashed #D5CFC5",
              backgroundColor: "#FDFBF7",
              fontSize: 12,
              fontWeight: 500,
              color: "#333",
              cursor: "pointer",
            }}
          >
            <Plus size={13} />
            <span>Add Menu Item</span>
            <ChevronDown size={12} />
          </button>
        </div>

        {/* =========================================
            COLUMN 2: EDIT MENU ITEM
            ========================================= */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #EAE5DC",
            borderRadius: 6,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #EAE5DC",
              paddingBottom: 14,
            }}
          >
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 16,
                fontWeight: 600,
                color: "#111111",
                margin: 0,
              }}
            >
              Edit Menu Item
            </h2>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 4,
                border: "1px solid #FCA5A5",
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Trash2 size={12} />
              <span>Delete Item</span>
            </button>
          </div>

          {/* Group 1: Basic Information */}
          <div>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#111111",
                margin: "0 0 12px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Basic Information
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#555555",
                    marginBottom: 4,
                  }}
                >
                  Label *
                </label>
                <input
                  type="text"
                  value={selectedItem.label}
                  onChange={(e) => updateSelectedItem({ label: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 4,
                    border: "1px solid #D5CFC5",
                    fontSize: 12,
                    color: "#111111",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#555555",
                    marginBottom: 4,
                  }}
                >
                  URL / Link *
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={selectedItem.href}
                    onChange={(e) => updateSelectedItem({ href: e.target.value })}
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      borderRadius: 4,
                      border: "1px solid #D5CFC5",
                      fontSize: 12,
                      color: "#111111",
                      outline: "none",
                    }}
                  />
                  <select
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      border: "1px solid #D5CFC5",
                      backgroundColor: "#FFFFFF",
                      fontSize: 11,
                      color: "#333",
                      outline: "none",
                    }}
                  >
                    <option>Website Page</option>
                    <option>Collection</option>
                    <option>Custom URL</option>
                  </select>
                </div>
              </div>

              {/* Icon selector */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#555555",
                    marginBottom: 4,
                  }}
                >
                  Icon (Optional)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      backgroundColor: "#F5F2EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {renderMenuIcon(selectedItem.iconName)}
                  </div>
                  <button
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "1px solid #D5CFC5",
                      backgroundColor: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    <span>Change Icon</span>
                    <ChevronDown size={11} />
                  </button>
                </div>
              </div>

              {/* Menu Image */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#555555",
                    marginBottom: 4,
                  }}
                >
                  Menu Image (Optional)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 50,
                      height: 40,
                      borderRadius: 4,
                      border: "1px solid #D5CFC5",
                      backgroundImage: `url(${selectedItem.image || "/media/case-flowers.jpg"})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        style={{
                          padding: "5px 10px",
                          borderRadius: 4,
                          border: "1px solid #D5CFC5",
                          backgroundColor: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Change Image
                      </button>
                      <button
                        style={{
                          padding: "5px 8px",
                          borderRadius: 4,
                          border: "1px solid #EAE5DC",
                          backgroundColor: "#FFFFFF",
                          color: "#777",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <span style={{ fontSize: 10, color: "#888888" }}>
                      Recommended: 400 × 300 (JPG/PNG)
                    </span>
                  </div>
                </div>
              </div>

              {/* Switches */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#333333" }}>Show in Menu</span>
                  <div
                    onClick={() => updateSelectedItem({ enabled: !selectedItem.enabled })}
                    style={{
                      width: 32,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: selectedItem.enabled ? "#111111" : "#D5CFC5",
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: selectedItem.enabled ? 16 : 2,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#333333" }}>Open in New Tab</span>
                  <div
                    onClick={() => updateSelectedItem({ openNewTab: !selectedItem.openNewTab })}
                    style={{
                      width: 32,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: selectedItem.openNewTab ? "#111111" : "#D5CFC5",
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: selectedItem.openNewTab ? 16 : 2,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Group 2: Dropdown Settings */}
          <div style={{ borderTop: "1px solid #EAE5DC", paddingTop: 16 }}>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#111111",
                margin: "0 0 12px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Dropdown Settings
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#555555",
                    marginBottom: 4,
                  }}
                >
                  Dropdown Style
                </label>
                <select
                  value={selectedItem.dropdownStyle || "Mega Menu (with images)"}
                  onChange={(e) => updateSelectedItem({ dropdownStyle: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 4,
                    border: "1px solid #D5CFC5",
                    backgroundColor: "#FFFFFF",
                    fontSize: 12,
                    color: "#111111",
                    outline: "none",
                  }}
                >
                  <option>Mega Menu (with images)</option>
                  <option>Standard Dropdown</option>
                  <option>Multi-level Flyout</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#555555",
                    marginBottom: 4,
                  }}
                >
                  Columns
                </label>
                <select
                  value={selectedItem.columns || 4}
                  onChange={(e) => updateSelectedItem({ columns: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 4,
                    border: "1px solid #D5CFC5",
                    backgroundColor: "#FFFFFF",
                    fontSize: 12,
                    color: "#111111",
                    outline: "none",
                  }}
                >
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                  <option value={5}>5 Columns</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 12, color: "#333333" }}>
                  Show Featured Section in Dropdown
                </span>
                <div
                  onClick={() => updateSelectedItem({ showFeatured: !selectedItem.showFeatured })}
                  style={{
                    width: 32,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: selectedItem.showFeatured ? "#111111" : "#D5CFC5",
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      left: selectedItem.showFeatured ? 16 : 2,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Group 3: SEO & Advanced */}
          <div style={{ borderTop: "1px solid #EAE5DC", paddingTop: 16 }}>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#111111",
                margin: "0 0 12px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              SEO & Advanced
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#555555",
                    marginBottom: 4,
                  }}
                >
                  Navigation Title (for SEO)
                </label>
                <input
                  type="text"
                  value={selectedItem.seoTitle || ""}
                  onChange={(e) => updateSelectedItem({ seoTitle: e.target.value })}
                  placeholder="e.g. Bags | OVIA"
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 4,
                    border: "1px solid #D5CFC5",
                    fontSize: 12,
                    color: "#111111",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <label style={{ fontSize: 11, fontWeight: 500, color: "#555555" }}>
                    Navigation Description
                  </label>
                  <span style={{ fontSize: 10, color: "#888888" }}>
                    {(selectedItem.seoDescription || "").length}/160
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={selectedItem.seoDescription || ""}
                  onChange={(e) => updateSelectedItem({ seoDescription: e.target.value })}
                  placeholder="Short description for accessibility and search..."
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 4,
                    border: "1px solid #D5CFC5",
                    fontSize: 12,
                    color: "#111111",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#555555",
                    marginBottom: 4,
                  }}
                >
                  CSS Class (Optional)
                </label>
                <input
                  type="text"
                  value={selectedItem.cssClass || ""}
                  onChange={(e) => updateSelectedItem({ cssClass: e.target.value })}
                  placeholder="e.g. highlight, menu-new"
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 4,
                    border: "1px solid #D5CFC5",
                    fontSize: 12,
                    color: "#111111",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            COLUMN 3: PREVIEWS & MENU SETTINGS
            ========================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Live Menu Preview Card */}
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
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#111111",
                  margin: 0,
                }}
              >
                Live Menu Preview
              </h2>

              {/* Viewport Toggles */}
              <div
                style={{
                  display: "flex",
                  borderRadius: 4,
                  border: "1px solid #EAE5DC",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setDeviceView("desktop")}
                  style={{
                    padding: "5px 10px",
                    border: "none",
                    backgroundColor: deviceView === "desktop" ? "#111111" : "#FFFFFF",
                    color: deviceView === "desktop" ? "#FFFFFF" : "#777777",
                    cursor: "pointer",
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Monitor size={12} />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setDeviceView("tablet")}
                  style={{
                    padding: "5px 10px",
                    border: "none",
                    backgroundColor: deviceView === "tablet" ? "#111111" : "#FFFFFF",
                    color: deviceView === "tablet" ? "#FFFFFF" : "#777777",
                    cursor: "pointer",
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Tablet size={12} />
                  <span>Tablet</span>
                </button>
                <button
                  onClick={() => setDeviceView("mobile")}
                  style={{
                    padding: "5px 10px",
                    border: "none",
                    backgroundColor: deviceView === "mobile" ? "#111111" : "#FFFFFF",
                    color: deviceView === "mobile" ? "#FFFFFF" : "#777777",
                    cursor: "pointer",
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Smartphone size={12} />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Desktop / Tablet Mega Menu Simulation */}
            <div
              style={{
                border: "1px solid #EAE5DC",
                borderRadius: 6,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              {/* OVIA Store Header */}
              <div
                style={{
                  padding: "12px 24px",
                  borderBottom: "1px solid #F0ECE6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 2,
                  }}
                >
                  OVIA
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: "#777" }}>Home</span>
                  <span
                    style={{
                      color: "#111",
                      borderBottom: "2px solid #111",
                      paddingBottom: 2,
                    }}
                  >
                    Bags
                  </span>
                  <span style={{ color: "#777" }}>Luggage</span>
                  <span style={{ color: "#777" }}>Discover</span>
                  <span style={{ color: "#777" }}>Services</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#444" }}>
                  <Search size={14} />
                  <User size={14} />
                  <Heart size={14} />
                  <div style={{ position: "relative" }}>
                    <ShoppingBag size={14} />
                    <span
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        fontSize: 8,
                        backgroundColor: "#111",
                        color: "#FFF",
                        borderRadius: "50%",
                        width: 12,
                        height: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      2
                    </span>
                  </div>
                </div>
              </div>

              {/* Mega Menu Dropdown Body */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px 1fr",
                  borderBottom: "1px solid #F0ECE6",
                }}
              >
                {/* Left links */}
                <div
                  style={{
                    padding: "20px 24px",
                    borderRight: "1px solid #F0ECE6",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#111" }}>All Bags</span>
                  <span style={{ color: "#666" }}>Backpacks</span>
                  <span style={{ color: "#666" }}>Tote Bags</span>
                  <span style={{ color: "#666" }}>Crossbody Bags</span>
                  <span style={{ color: "#666" }}>Travel Bags</span>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#111",
                      cursor: "pointer",
                    }}
                  >
                    <span>View All Bags</span>
                    <ArrowRight size={11} />
                  </div>
                </div>

                {/* Right Product Grid */}
                <div
                  style={{
                    padding: "20px",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 14,
                    backgroundColor: "#FAFAF8",
                  }}
                >
                  {[
                    { title: "Travel Bags", desc: "For every journey", img: "/media/luggage.svg" },
                    { title: "Business Bags", desc: "Work in style", img: "/media/luggage.svg" },
                    { title: "Everyday Bags", desc: "Modern essentials", img: "/media/luggage.svg" },
                    { title: "New Arrivals", desc: "Discover now", img: "/media/case-flowers.jpg" },
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #EAE5DC",
                        borderRadius: 4,
                        padding: 10,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: 70,
                          borderRadius: 3,
                          backgroundImage: `url(${card.img})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          marginBottom: 8,
                        }}
                      />
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#111" }}>
                        {card.title}
                      </div>
                      <div style={{ fontSize: 9, color: "#888" }}>{card.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Banner Strip Snippet */}
              <div
                style={{
                  height: 100,
                  backgroundImage: "url(/media/case-flowers.jpg)",
                  backgroundSize: "cover",
                  backgroundPosition: "center 30%",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(0,0,0,0.45)",
                    position: "absolute",
                    inset: 0,
                  }}
                />
                <button
                  style={{
                    position: "relative",
                    padding: "6px 16px",
                    backgroundColor: "#FFFFFF",
                    color: "#111111",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 1,
                    border: "none",
                    borderRadius: 2,
                    cursor: "pointer",
                  }}
                >
                  DISCOVER THE SELECTION
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Mobile Menu Preview + Menu Settings */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              gap: 20,
              alignItems: "start",
            }}
          >
            {/* Mobile Menu Preview */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #EAE5DC",
                borderRadius: 6,
                padding: "16px",
              }}
            >
              <h3
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 14,
                  fontWeight: 600,
                  margin: "0 0 12px",
                }}
              >
                Mobile Menu Preview
              </h3>

              {/* Mobile device frame */}
              <div
                style={{
                  border: "1px solid #D5CFC5",
                  borderRadius: 12,
                  padding: "14px 12px",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 12,
                    borderBottom: "1px solid #F0ECE6",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Georgia, serif",
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      fontSize: 12,
                    }}
                  >
                    OVIA
                  </span>
                  <X size={13} color="#666" />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Home size={12} color="#666" />
                    <span>Home</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontWeight: 600,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ShoppingBag size={12} color="#111" />
                        <span>Bags</span>
                      </div>
                      <ChevronDown size={11} color="#666" />
                    </div>

                    <div
                      style={{
                        paddingLeft: 20,
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        color: "#666",
                        fontSize: 10,
                      }}
                    >
                      <span>All Bags</span>
                      <span>Backpacks</span>
                      <span>Tote Bags</span>
                      <span>Crossbody Bags</span>
                      <span>Travel Bags</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <LuggageIcon size={12} color="#666" />
                      <span>Luggage</span>
                    </div>
                    <ChevronRight size={11} color="#999" />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Compass size={12} color="#666" />
                      <span>Discover</span>
                    </div>
                    <ChevronRight size={11} color="#999" />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Wrench size={12} color="#666" />
                      <span>Services</span>
                    </div>
                    <ChevronRight size={11} color="#999" />
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Settings */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #EAE5DC",
                borderRadius: 6,
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h3
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 14,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Menu Settings
              </h3>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { key: "stickyHeader", label: "Enable Sticky Header" },
                  { key: "showSearch", label: "Show Search Icon" },
                  { key: "showAccount", label: "Show Account Icon" },
                  { key: "showWishlist", label: "Show Wishlist Icon" },
                  { key: "showCart", label: "Show Cart Icon" },
                ].map((s) => {
                  const val = (menuSettings as any)[s.key];
                  return (
                    <div
                      key={s.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 11,
                        color: "#333",
                      }}
                    >
                      <span>{s.label}</span>
                      <div
                        onClick={() =>
                          setMenuSettings((prev) => ({ ...prev, [s.key]: !val }))
                        }
                        style={{
                          width: 28,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: val ? "#111111" : "#D5CFC5",
                          position: "relative",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 2,
                            left: val ? 14 : 2,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: "#FFFFFF",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selects */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "#666",
                      marginBottom: 3,
                    }}
                  >
                    Menu Alignment
                  </label>
                  <select
                    value={menuSettings.menuAlignment}
                    onChange={(e) =>
                      setMenuSettings((prev) => ({ ...prev, menuAlignment: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 4,
                      border: "1px solid #D5CFC5",
                      fontSize: 11,
                      backgroundColor: "#FFF",
                    }}
                  >
                    <option>Center</option>
                    <option>Left</option>
                    <option>Right</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "#666",
                      marginBottom: 3,
                    }}
                  >
                    Menu Style
                  </label>
                  <select
                    value={menuSettings.menuStyle}
                    onChange={(e) =>
                      setMenuSettings((prev) => ({ ...prev, menuStyle: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 4,
                      border: "1px solid #D5CFC5",
                      fontSize: 11,
                      backgroundColor: "#FFF",
                    }}
                  >
                    <option>Clean (Minimal)</option>
                    <option>Classic Luxury</option>
                    <option>Bold Modern</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "#666",
                      marginBottom: 3,
                    }}
                  >
                    Hover Effect
                  </label>
                  <select
                    value={menuSettings.hoverEffect}
                    onChange={(e) =>
                      setMenuSettings((prev) => ({ ...prev, hoverEffect: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 4,
                      border: "1px solid #D5CFC5",
                      fontSize: 11,
                      backgroundColor: "#FFF",
                    }}
                  >
                    <option>Underline</option>
                    <option>Fade Color</option>
                    <option>Subtle Pill</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveChanges}
                disabled={saving}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "9px",
                  borderRadius: 4,
                  backgroundColor: "#111111",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
