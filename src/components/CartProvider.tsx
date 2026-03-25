"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { MenuItem } from "@/types";

type CartProduct = Pick<
  MenuItem,
  "id" | "name" | "description" | "category" | "pricePence" | "imageUrl" | "stockQuantity"
>;

export type CartItem = CartProduct & {
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotalPence: number;
  addItem: (item: CartProduct) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "e-restaurant-cart";

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore invalid local cart state.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalPence = items.reduce((sum, item) => sum + item.pricePence * item.quantity, 0);

    return {
      items,
      totalItems,
      subtotalPence,
      addItem(item) {
        setItems((current) => {
          const existing = current.find((entry) => entry.id === item.id);
          if (existing) {
            return current.map((entry) =>
              entry.id === item.id
                ? { ...entry, quantity: entry.quantity + 1, stockQuantity: item.stockQuantity }
                : entry,
            );
          }

          return [...current, { ...item, quantity: 1 }];
        });
      },
      updateQuantity(id, quantity) {
        setItems((current) => {
          if (quantity <= 0) {
            return current.filter((entry) => entry.id !== id);
          }

          return current.map((entry) =>
            entry.id === id ? { ...entry, quantity: Math.min(quantity, entry.stockQuantity || quantity) } : entry,
          );
        });
      },
      clearCart() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}