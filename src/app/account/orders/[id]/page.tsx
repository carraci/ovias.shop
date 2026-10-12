"use client";

import { use } from "react";
import { AccountOrderDetails } from "@/components/account-order-details";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <AccountOrderDetails orderId={resolvedParams.id} />;
}
