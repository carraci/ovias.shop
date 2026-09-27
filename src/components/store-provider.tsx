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
type CartView = { lines: OrderLine[]; total: number; version: number };
type UserView = { id: string; name: string; email: string };
export async function request<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const res = await fetch(`/api/v1/${path}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(
      json.error?.message || "Something went wrong. Please try again.",
    );
  return json.data;
}
const Context = createContext<{
  cart: CartView;
  user: UserView | null;
  refresh: () => Promise<void>;
  add: (sku: string, quantity?: number) => Promise<void>;
  setQuantity: (sku: string, q: number) => Promise<void>;
  notify: (s: string) => void;
}>({
  cart: { lines: [], total: 0, version: 0 },
  user: null,
  refresh: async () => {},
  add: async () => {},
  setQuantity: async () => {},
  notify: () => {},
});
export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartView>({
    lines: [],
    total: 0,
    version: 0,
  });
  const [user, setUser] = useState<UserView | null>(null);
  const [notice, notify] = useState("");
  const refresh = useCallback(async () => {
    try {
      const account = await request<{ user: UserView | null }>("account");
      setUser(account.user);
      setCart(await request<CartView>("cart"));
    } catch {
      /* Pages surface service errors when an action is attempted. */
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => notify(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  async function add(sku: string, quantity = 1) {
    setCart(
      await request<CartView>("cart/items", "POST", { sku, quantity }),
    );
    notify("Added to your bag.");
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
    <Context.Provider value={{ cart, user, refresh, add, setQuantity, notify }}>
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
