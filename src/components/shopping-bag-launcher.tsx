"use client";

import dynamic from "next/dynamic";
import { useStore } from "./store-provider";

const ShoppingBagDrawer = dynamic(
  () => import("./shopping-bag-drawer").then(m => m.ShoppingBagDrawer),
  { ssr: false },
);

export function ShoppingBagLauncher() {
  const { isCartDrawerOpen } = useStore();
  return isCartDrawerOpen ? <ShoppingBagDrawer /> : null;
}
