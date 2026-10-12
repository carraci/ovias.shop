"use client";

import { useParams } from "next/navigation";
import { CouponEditor } from "@/components/admin/coupon-editor";

export default function EditCouponPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return <CouponEditor couponId={id} />;
}
