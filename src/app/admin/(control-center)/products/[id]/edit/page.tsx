"use client";

import React, { useState, useEffect, use } from "react";
import { ProductEditor } from "@/components/admin/product-editor";
import { RefreshCw } from "lucide-react";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/admin/products/${id}`);
        const json = await res.json();
        if (json.success) {
          setProduct(json.product);
        }
      } catch (err) {
        console.error("Failed to load product for editing:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6B6B6B" }}>
        <RefreshCw size={24} className="animate-spin" style={{ display: "inline", marginBottom: 8 }} />
        <div>Loading product attributes...</div>
      </div>
    );
  }

  return <ProductEditor initialData={product} isEditing={true} />;
}
