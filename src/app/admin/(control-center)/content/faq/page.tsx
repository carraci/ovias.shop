"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  ChevronDown,
  GripVertical,
  HelpCircle,
  FolderTree,
} from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "f1",
    question: "What materials are used in OVIA luggage?",
    answer:
      "All OVIA trunks and cabin suitcases are engineered from aerospace-grade anodized aluminium or lightweight virgin polycarbonate, accented with vegetable-tanned full-grain Italian leather handles.",
    category: "Product & Materials",
    order: 1,
    published: true,
  },
  {
    id: "f2",
    question: "What is covered under the OVIA Lifetime Guarantee?",
    answer:
      "Our lifetime warranty covers functional damage to wheels, telescoping handles, locks, and structural zippers. Cosmetic wear and tear is not covered, but repair services are available at all our ateliers.",
    category: "Warranty & Repair",
    order: 2,
    published: true,
  },
  {
    id: "f3",
    question: "How long does domestic shipping take across India?",
    answer:
      "Standard domestic express delivery takes 2 to 4 business days. Priority same-day or next-day courier is available in Mumbai, Delhi NCR, and Bangalore.",
    category: "Shipping & Delivery",
    order: 3,
    published: true,
  },
  {
    id: "f4",
    question: "Can I personalize or hot-stamp my luggage tag?",
    answer:
      "Yes. Complimentary initials hot-stamping (up to 3 characters in gold, silver, or blind deboss) is included with all suitcase and leather duffel orders.",
    category: "Personalisation",
    order: 4,
    published: true,
  },
  {
    id: "f5",
    question: "What is your return policy?",
    answer:
      "We accept returns within 14 days of delivery for unused items in their original packaging with tags intact. Monogrammed custom items cannot be returned.",
    category: "Returns & Exchanges",
    order: 5,
    published: true,
  },
];

export default function ContentFaqAdminPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [selectedId, setSelectedId] = useState<string>("f1");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toast, setToast] = useState<string | null>(null);

  const selectedFaq = faqs.find((f) => f.id === selectedId) || faqs[0];

  function updateFaq(fields: Partial<FaqItem>) {
    setFaqs((prev) =>
      prev.map((f) => (f.id === selectedId ? { ...f, ...fields } : f))
    );
  }

  function handleCreateFaq() {
    const newFaq: FaqItem = {
      id: "f_" + Date.now(),
      question: "New Frequently Asked Question",
      answer: "Provide a detailed, helpful explanation here...",
      category: "Product & Materials",
      order: faqs.length + 1,
      published: true,
    };
    setFaqs([newFaq, ...faqs]);
    setSelectedId(newFaq.id);
    showToast("New FAQ item created");
  }

  function handleDeleteFaq(id: string) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    if (selectedId === id && faqs.length > 1) {
      setSelectedId(faqs[0].id);
    }
    showToast("FAQ deleted");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = faqs.filter((f) => {
    if (selectedCategory !== "All" && f.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      );
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

      {/* Header */}
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
            <span style={{ color: "#111111", fontWeight: 500 }}>FAQ / Help</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/faq"
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 4,
                border: "1px solid #D5CFC5",
                backgroundColor: "#FFFFFF",
                color: "#222",
                fontSize: 11,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <span>View FAQ Page</span>
              <ExternalLink size={12} />
            </Link>

            <button
              onClick={handleCreateFaq}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 4,
                backgroundColor: "#111111",
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={13} />
              <span>Add FAQ</span>
            </button>
          </div>
        </div>

        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 26,
            fontWeight: 400,
            color: "#111111",
            margin: "0 0 4px",
          }}
        >
          FAQ & Help Studio
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#777777" }}>
          Manage customer assistance knowledge base, product care instructions, and warranty FAQs.
        </p>
      </header>

      {/* Main Studio Body */}
      <main
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "24px 32px 60px",
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Left Column: FAQ List */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #EAE5DC",
            borderRadius: 6,
            padding: "16px",
          }}
        >
          {/* Search & Filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 4,
                border: "1px solid #D5CFC5",
              }}
            >
              <Search size={13} color="#888" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search FAQs..."
                style={{ border: "none", outline: "none", fontSize: 11, width: "100%" }}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #D5CFC5",
                backgroundColor: "#FFF",
                fontSize: 11,
              }}
            >
              <option value="All">All Categories</option>
              <option value="Product & Materials">Product & Materials</option>
              <option value="Warranty & Repair">Warranty & Repair</option>
              <option value="Shipping & Delivery">Shipping & Delivery</option>
              <option value="Personalisation">Personalisation</option>
              <option value="Returns & Exchanges">Returns & Exchanges</option>
            </select>
          </div>

          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 4,
                    border: isSelected ? "1.5px solid #111111" : "1px solid #EAE5DC",
                    backgroundColor: isSelected ? "#FDFBF7" : "#FFFFFF",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <GripVertical size={13} color="#BBB" />
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
                      {item.question}
                    </div>
                    <div style={{ fontSize: 10, color: "#888888", marginTop: 2 }}>
                      {item.category}
                    </div>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      updateFaq({ published: !item.published });
                    }}
                    style={{
                      width: 28,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: item.published ? "#111111" : "#D5CFC5",
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: item.published ? 14 : 2,
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
        </div>

        {/* Right Column: Edit FAQ Item */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #EAE5DC",
            borderRadius: 6,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
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
                margin: 0,
              }}
            >
              Edit FAQ Details
            </h2>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handleDeleteFaq(selectedFaq.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 10px",
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
                <span>Delete</span>
              </button>

              <button
                onClick={() => showToast("FAQ saved")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 4,
                  backgroundColor: "#111111",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Save FAQ
              </button>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#555",
                marginBottom: 4,
              }}
            >
              Question *
            </label>
            <input
              type="text"
              value={selectedFaq.question}
              onChange={(e) => updateFaq({ question: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 4,
                border: "1px solid #D5CFC5",
                fontSize: 12,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#555",
                marginBottom: 4,
              }}
            >
              Category
            </label>
            <select
              value={selectedFaq.category}
              onChange={(e) => updateFaq({ category: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 4,
                border: "1px solid #D5CFC5",
                fontSize: 12,
                backgroundColor: "#FFF",
              }}
            >
              <option>Product & Materials</option>
              <option>Warranty & Repair</option>
              <option>Shipping & Delivery</option>
              <option>Personalisation</option>
              <option>Returns & Exchanges</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#555",
                marginBottom: 4,
              }}
            >
              Answer (Help text) *
            </label>
            <textarea
              rows={6}
              value={selectedFaq.answer}
              onChange={(e) => updateFaq({ answer: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 4,
                border: "1px solid #D5CFC5",
                fontSize: 12,
                lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Live Preview Card */}
          <div
            style={{
              backgroundColor: "#FDFBF7",
              border: "1px solid #EAE5DC",
              borderRadius: 6,
              padding: "16px",
              marginTop: 10,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8E693E", marginBottom: 6 }}>
              LIVE STOREFRONT PREVIEW
            </div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#111",
                marginBottom: 6,
              }}
            >
              {selectedFaq.question}
            </div>
            <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>
              {selectedFaq.answer}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
