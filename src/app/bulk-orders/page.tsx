import { BulkOrdersForm } from "@/components/bulk-orders-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk Gifting & Corporate Orders | OVIA Luxury Travel Goods",
  description:
    "Exclusive volume discounts, tailored corporate gifting, and bespoke luxury travel goods from OVIA. Inquire directly with our concierge team.",
};

export default function BulkOrdersPage() {
  return (
    <main style={{ minHeight: "80vh", background: "#ffffff" }}>
      <BulkOrdersForm />
    </main>
  );
}
