import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { currentUser } from "@/server/auth";
import { transaction } from "@/server/db";
import type { Order, ProductReview, ToReviewItem } from "@/lib/types";

export const runtime = "nodejs";

const reviewSchema = z.object({
  id: z.string().optional(),
  productSku: z.string().optional(),
  productSlug: z.string().min(1),
  productName: z.string().min(1),
  productColor: z.string().optional(),
  productImage: z.string().optional(),
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(160).optional(),
  comment: z.string().trim().min(1).max(2000),
  authorName: z.string().trim().optional(),
  authorEmail: z.string().trim().optional(),
  isAnonymous: z.boolean().optional(),
  aspects: z
    .object({
      quality: z.number().int().min(1).max(5).optional(),
      design: z.number().int().min(1).max(5).optional(),
      valueForMoney: z.number().int().min(1).max(5).optional(),
    })
    .optional(),
  photos: z.array(z.string()).max(10).optional(),
});

function formatDeliveredDate(dateStr?: string): string {
  if (!dateStr) return "Recently delivered";
  try {
    const d = new Date(dateStr);
    return `Delivered on ${d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  } catch {
    return "Delivered";
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "true";
  const productSlug = url.searchParams.get("productSlug");

  // Customer Account Reviews (To Review & My Reviews)
  if (mine) {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return transaction(async (repo) => {
      // 1. Fetch user's submitted reviews
      const allReviews = await repo.find<ProductReview>("reviews", { userId: user.id });
      const myReviews = allReviews.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const reviewedSkuOrder = new Set(
        myReviews.map((r) => `${r.productSku}::${r.orderNumber || ""}`),
      );

      // 2. Fetch user's paid & delivered orders to find products "To Review"
      const orders = await repo.find<Order>("orders", { userId: user.id });
      const toReview: ToReviewItem[] = [];

      for (const order of orders) {
        if (order.status === "cancelled" || order.status === "expired") continue;

        const deliveredDate =
          order.shipping?.deliveredAt ||
          order.shipping?.events?.find((e) => e.status === "DELIVERED")?.timestamp ||
          order.createdAt;

        for (const line of order.lines) {
          const key = `${line.sku}::${order.orderNumber || ""}`;
          if (!reviewedSkuOrder.has(key)) {
            toReview.push({
              orderId: order.id,
              orderNumber: order.orderNumber || `OVIA-${order.id.slice(0, 8).toUpperCase()}`,
              deliveredAtFormatted: formatDeliveredDate(deliveredDate),
              sku: line.sku,
              name: line.name,
              color: line.color,
              image: line.image,
              slug: line.slug || line.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        toReview,
        myReviews,
      });
    });
  }

  // Public Product Page Reviews
  if (productSlug) {
    return transaction(async (repo) => {
      const allReviews = await repo.find<ProductReview>("reviews", {
        productSlug,
      });

      const approved = allReviews.filter((r) => r.status === "approved" || !r.status);

      const totalCount = approved.length;
      const ratingSum = approved.reduce((acc, r) => acc + (r.rating || 5), 0);
      const averageRating = totalCount > 0 ? Number((ratingSum / totalCount).toFixed(1)) : 0;

      const breakdown = {
        5: approved.filter((r) => r.rating === 5).length,
        4: approved.filter((r) => r.rating === 4).length,
        3: approved.filter((r) => r.rating === 3).length,
        2: approved.filter((r) => r.rating === 2).length,
        1: approved.filter((r) => r.rating === 1).length,
      };

      return NextResponse.json({
        success: true,
        averageRating,
        totalCount,
        breakdown,
        reviews: approved.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      });
    });
  }

  // Return all approved store reviews if no specific productSlug is provided
  return transaction(async (repo) => {
    const allReviews = await repo.find<ProductReview>("reviews");
    const approved = allReviews.filter((r) => r.status === "approved" || !r.status);
    const totalCount = approved.length;
    const ratingSum = approved.reduce((acc, r) => acc + (r.rating || 5), 0);
    const averageRating = totalCount > 0 ? Number((ratingSum / totalCount).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      averageRating,
      totalCount,
      reviews: approved.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    });
  });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();

  try {
    const json = await req.json();
    const data = reviewSchema.parse(json);

    return transaction(async (repo) => {
      const userId = user?.id || `guest-${randomUUID().slice(0, 8)}`;
      const finalName = data.isAnonymous
        ? "Anonymous"
        : (data.authorName?.trim() || user?.name || "Customer");
      const userEmail = (data.authorEmail?.trim() || user?.email || "").toLowerCase();

      // Check if user has an order with this product to verify purchase
      let hasPurchased = false;
      if (user) {
        const userOrders = await repo.find<Order>("orders", { userId: user.id });
        hasPurchased = userOrders.some((o) =>
          o.lines.some((l) => l.sku === data.productSku || l.slug === data.productSlug),
        );
      } else if (userEmail) {
        const allOrders = await repo.find<Order>("orders");
        hasPurchased = allOrders.some((o) =>
          o.owner?.toLowerCase() === userEmail &&
          o.lines.some((l) => l.sku === data.productSku || l.slug === data.productSlug),
        );
      }

      const now = new Date().toISOString();
      const reviewRecord: ProductReview = {
        id: randomUUID(),
        userId,
        userName: finalName,
        authorEmail: userEmail || undefined,
        isAnonymous: Boolean(data.isAnonymous),
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        productSku: data.productSku || `${data.productSlug}-default`,
        productSlug: data.productSlug,
        productName: data.productName,
        productColor: data.productColor,
        productImage: data.productImage,
        rating: data.rating,
        title: data.title?.trim() || data.productName,
        comment: data.comment,
        aspects: data.aspects,
        photos: data.photos || [],
        verified: hasPurchased || true,
        status: "approved",
        createdAt: now,
        updatedAt: now,
      };

      await repo.put("reviews", reviewRecord);

      return NextResponse.json({
        success: true,
        message: "Review submitted successfully.",
        review: reviewRecord,
      });
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || "Failed to submit review." },
      { status: 400 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const data = reviewSchema.parse(json);
    if (!data.id) {
      return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
    }

    return transaction(async (repo) => {
      const existing = await repo.get<ProductReview>("reviews", data.id!);
      if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ error: "Review not found or access denied." }, { status: 404 });
      }

      const now = new Date().toISOString();
      const updated: ProductReview = {
        ...existing,
        rating: data.rating,
        title: data.title || existing.title,
        comment: data.comment,
        aspects: data.aspects || existing.aspects,
        photos: data.photos !== undefined ? data.photos : existing.photos,
        updatedAt: now,
      };

      await repo.put("reviews", updated);

      return NextResponse.json({
        success: true,
        message: "Review updated successfully.",
        review: updated,
      });
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || "Failed to update review." },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
  }

  return transaction(async (repo) => {
    const existing = await repo.get<ProductReview>("reviews", id);
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Review not found or access denied." }, { status: 404 });
    }

    await repo.remove("reviews", id);

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully.",
    });
  });
}
