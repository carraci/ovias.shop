"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { OrderLine } from "@/lib/types";
import type { WishlistItem } from "@/lib/account-wishlist";
import { usePathname } from "next/navigation";

type CartView = { lines: OrderLine[]; total: number; version: number };
type UserView = { id: string; name: string; email: string; role?: string };

export async function request<T>(
  path: string,
  method = "GET",
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`/api/v1/${path}`, {
    method,
    cache: "no-store",
    signal,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(
      json.error?.message || (typeof json.error === "string" ? json.error : "Something went wrong. Please try again."),
    );
  return json.data !== undefined ? json.data : json;
}

export type StoreContextType = {
  cart: CartView;
  user: UserView | null;
  wishlist: WishlistItem[];
  wishlistSkus: string[];
  isWishlisted: (target: string) => boolean;
  toggleWishlist: (skuOrSlug: string, itemData?: Partial<WishlistItem>) => Promise<void>;
  removeFromWishlist: (skuOrSlug: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  refresh: () => Promise<void>;
  add: (sku: string, quantity?: number) => Promise<void>;
  setQuantity: (sku: string, q: number) => Promise<void>;
  notify: (s: string) => void;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
};

const Context = createContext<StoreContextType>({
  cart: { lines: [], total: 0, version: 0 },
  user: null,
  wishlist: [],
  wishlistSkus: [],
  isWishlisted: () => false,
  toggleWishlist: async () => {},
  removeFromWishlist: async () => {},
  refreshWishlist: async () => {},
  refresh: async () => {},
  add: async () => {},
  setQuantity: async () => {},
  notify: () => {},
  isCartDrawerOpen: false,
  openCartDrawer: () => {},
  closeCartDrawer: () => {},
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const [cart, setCart] = useState<CartView>({
    lines: [],
    total: 0,
    version: 0,
  });
  const [user, setUser] = useState<UserView | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistSkus, setWishlistSkus] = useState<string[]>([]);
  const [notice, notify] = useState("");
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const openCartDrawer = useCallback(() => setIsCartDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setIsCartDrawerOpen(false), []);
  const acceptCart = useCallback((next: CartView) => {
    setCart(previous => previous.version === next.version && previous.total === next.total &&
      JSON.stringify(previous.lines) === JSON.stringify(next.lines) ? previous : next);
  }, []);

  const refreshWishlist = useCallback(async () => {
    try {
      const items = await request<WishlistItem[]>("account/wishlist");
      if (Array.isArray(items)) {
        setWishlist(previous => JSON.stringify(previous) === JSON.stringify(items) ? previous : items);
        const skus = items.map((i) => i.sku);
        setWishlistSkus(previous => previous.length === skus.length && previous.every((sku, index) => sku === skus[index]) ? previous : skus);
        try {
          localStorage.setItem("ovia_wishlist", JSON.stringify(skus));
          localStorage.setItem("ovia_wishlist_items", JSON.stringify(items));
        } catch {}
      }
    } catch {
      // Guest or offline: read from localStorage
      try {
        const storedItems = JSON.parse(localStorage.getItem("ovia_wishlist_items") || "[]");
        const storedSkus = JSON.parse(localStorage.getItem("ovia_wishlist") || "[]");
        if (Array.isArray(storedItems) && storedItems.length > 0) {
          setWishlist(storedItems);
        }
        if (Array.isArray(storedSkus) && storedSkus.length > 0) {
          setWishlistSkus(storedSkus);
        }
      } catch {}
    }
  }, []);

  const refresh = useCallback(async () => {
    const [account, nextCart] = await Promise.allSettled([
      request<{ user: UserView | null }>("account"),
      request<CartView>("cart"),
    ]);
    if (account.status === "fulfilled") setUser(account.value.user);
    if (nextCart.status === "fulfilled") acceptCart(nextCart.value);
  }, [acceptCart]);

  useEffect(() => {
    if (isAdmin) return;
    // Initial local cache hydration
    try {
      const storedItems = JSON.parse(localStorage.getItem("ovia_wishlist_items") || "[]");
      const storedSkus = JSON.parse(localStorage.getItem("ovia_wishlist") || "[]");
      if (Array.isArray(storedItems) && storedItems.length > 0) setWishlist(storedItems);
      if (Array.isArray(storedSkus) && storedSkus.length > 0) setWishlistSkus(storedSkus);
    } catch {}

    void refresh();
    void refreshWishlist();
  }, [isAdmin, refresh, refreshWishlist]);

  useEffect(() => {
    if (isAdmin) return;
    let mounted=true, running=false;
    const update=async()=>{if(running || document.visibilityState!=="visible")return;running=true;try{const nextCart=await request<CartView>("cart");if(mounted)acceptCart(nextCart);await refreshWishlist();}catch{}finally{running=false;}};
    const timer=setInterval(()=>void update(),5000);
    window.addEventListener("focus",update);
    return()=>{mounted=false;clearInterval(timer);window.removeEventListener("focus",update);};
  },[isAdmin, refreshWishlist, acceptCart]);

  // Sync wishlist to user's MongoDB record when user logs in
  useEffect(() => {
    if (user && !isAdmin) {
      try {
        const localSkus: string[] = JSON.parse(localStorage.getItem("ovia_wishlist") || "[]");
        if (Array.isArray(localSkus) && localSkus.length > 0) {
          for (const sku of localSkus) {
            request("account/wishlist", "POST", { sku }).catch(() => {});
          }
        }
      } catch {}
      void refreshWishlist();
    }
  }, [user, isAdmin, refreshWishlist]);

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => notify(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const isWishlisted = useCallback(
    (target: string) => {
      if (!target) return false;
      const lower = target.toLowerCase();
      return (
        wishlistSkus.some((s) => s.toLowerCase() === lower) ||
        wishlist.some(
          (item) =>
            item.sku.toLowerCase() === lower ||
            item.slug.toLowerCase() === lower,
        )
      );
    },
    [wishlistSkus, wishlist],
  );

  const removeFromWishlist = useCallback(
    async (skuOrSlug: string) => {
      if (!skuOrSlug) return;
      const lower = skuOrSlug.toLowerCase();
      setWishlistSkus((prev) => prev.filter((s) => s.toLowerCase() !== lower));
      setWishlist((prev) =>
        prev.filter(
          (i) =>
            i.sku.toLowerCase() !== lower &&
            i.slug.toLowerCase() !== lower,
        ),
      );
      try {
        const curSkus: string[] = JSON.parse(localStorage.getItem("ovia_wishlist") || "[]");
        const nextSkus = curSkus.filter((s) => s.toLowerCase() !== lower);
        localStorage.setItem("ovia_wishlist", JSON.stringify(nextSkus));
        const curItems: WishlistItem[] = JSON.parse(localStorage.getItem("ovia_wishlist_items") || "[]");
        const nextItems = curItems.filter(
          (i) =>
            i.sku.toLowerCase() !== lower &&
            i.slug.toLowerCase() !== lower,
        );
        localStorage.setItem("ovia_wishlist_items", JSON.stringify(nextItems));
      } catch {}
      notify("Removed from your wishlist.");
      if (user) {
        request<WishlistItem[]>("account/wishlist", "DELETE", { sku: skuOrSlug })
          .then((serverItems) => {
            if (Array.isArray(serverItems)) setWishlist(serverItems);
          })
          .catch(() => {});
      }
    },
    [user, notify],
  );

  const toggleWishlist = useCallback(
    async (skuOrSlug: string, itemData?: Partial<WishlistItem>) => {
      if (!skuOrSlug) return;
      const already = isWishlisted(skuOrSlug);
      if (already) {
        await removeFromWishlist(skuOrSlug);
      } else {
        const newSkus = [...new Set([...wishlistSkus, skuOrSlug])];
        setWishlistSkus(newSkus);
        try {
          localStorage.setItem("ovia_wishlist", JSON.stringify(newSkus));
        } catch {}

        const fallbackItem: WishlistItem = {
          sku: itemData?.sku || skuOrSlug,
          name: itemData?.name || "OVIA Luxury Piece",
          color: itemData?.color || "Classic",
          slug: itemData?.slug || skuOrSlug,
          image: itemData?.image || "/media/account/order-meridian.png",
          price: itemData?.price || 0,
          available: true,
        };

        setWishlist((prev) => {
          const exists = prev.some(
            (i) =>
              i.sku.toLowerCase() === fallbackItem.sku.toLowerCase() ||
              i.slug.toLowerCase() === fallbackItem.slug.toLowerCase(),
          );
          return exists ? prev : [fallbackItem, ...prev];
        });

        try {
          const curItems: WishlistItem[] = JSON.parse(localStorage.getItem("ovia_wishlist_items") || "[]");
          const exists = curItems.some(
            (i) =>
              i.sku.toLowerCase() === fallbackItem.sku.toLowerCase() ||
              i.slug.toLowerCase() === fallbackItem.slug.toLowerCase(),
          );
          if (!exists) {
            localStorage.setItem("ovia_wishlist_items", JSON.stringify([fallbackItem, ...curItems]));
          }
        } catch {}

        notify("Added to your wishlist.");

        if (user) {
          request<WishlistItem[]>("account/wishlist", "POST", { sku: skuOrSlug })
            .then((serverItems) => {
              if (Array.isArray(serverItems) && serverItems.length > 0) {
                setWishlist(serverItems);
                try {
                  localStorage.setItem("ovia_wishlist_items", JSON.stringify(serverItems));
                } catch {}
              }
            })
            .catch(() => {});
        } else {
          // Enrich piece metadata from catalog
          request<any[]>(`search?q=${encodeURIComponent(skuOrSlug)}`)
            .then((res) => {
              const p = res?.[0];
              if (p) {
                const variant = p.variants?.find((v: any) => v.sku === skuOrSlug) || p.variants?.[0];
                const enriched: WishlistItem = {
                  sku: variant?.sku || p.variants?.[0]?.sku || skuOrSlug,
                  name: p.name,
                  color: variant?.color || "Classic",
                  slug: p.slug,
                  image: variant?.image || p.image || "/media/account/order-meridian.png",
                  price: variant?.price || p.price || 0,
                  available: true,
                };
                setWishlist((prev) =>
                  prev.map((i) =>
                    i.sku === skuOrSlug || i.slug === skuOrSlug ? enriched : i,
                  ),
                );
                try {
                  const curItems: WishlistItem[] = JSON.parse(localStorage.getItem("ovia_wishlist_items") || "[]");
                  const updated = curItems.map((i) =>
                    i.sku === skuOrSlug || i.slug === skuOrSlug ? enriched : i,
                  );
                  localStorage.setItem("ovia_wishlist_items", JSON.stringify(updated));
                } catch {}
              }
            })
            .catch(() => {});
        }
      }
    },
    [isWishlisted, removeFromWishlist, wishlistSkus, user, notify],
  );

  async function add(sku: string, quantity = 1) {
    setCart(
      await request<CartView>("cart/items", "POST", { sku, quantity }),
    );
    notify("Added to your bag.");
    setIsCartDrawerOpen(true);
  }

  async function setQuantity(sku: string, quantity: number) {
    try {
      setCart(
        await request<CartView>(
          `cart/items/${encodeURIComponent(sku)}`,
          "PATCH",
          { quantity, version: cart.version },
        ),
      );
    } catch (e) {
      await refresh();
      throw e;
    }
  }

  return (
    <Context.Provider
      value={{
        cart,
        user,
        wishlist,
        wishlistSkus,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        refreshWishlist,
        refresh,
        add,
        setQuantity,
        notify,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
      }}
    >
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`toast ${notice ? "visible" : ""}`}
      >
        {notice}
      </div>
    </Context.Provider>
  );
}

export const useStore = () => useContext(Context);
