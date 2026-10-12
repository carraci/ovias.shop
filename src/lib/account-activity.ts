export type AccountActivity = {
  id: string;
  userId: string;
  category: "Orders" | "Returns & refunds" | "Support" | "Security";
  title: string;
  description: string;
  href: string;
  createdAt: string;
  readAt?: string;
};
