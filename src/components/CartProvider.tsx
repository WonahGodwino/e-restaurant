"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { MenuItem } from "@/types";

type CartProduct = Pick<
  MenuItem,
  "id" | "name" | "description" | "category" | "pricePence" | "imageUrl" | "stockQuantity" | "isAgeRestricted"
>;

export type SelectedModifier = {
  modifierId: string;
  modifierName: string;
  groupName: string;
  priceDeltaPence: number;
};

export type CartItem = CartProduct & {
  cartKey: string;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  effectivePricePence: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotalPence: number;
  addItem: (item: CartProduct, selectedModifiers?: SelectedModifier[]) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "e-restaurant-cart";

function buildCartKey(id: string, selectedModifiers: SelectedModifier[]): string {
  if (selectedModifiers.length === 0) {
    return id;
  }
  const modKey = selectedModifiers
    .map((m) => m.modifierId)
    .sort()
    .join(",");
  return `${id}:${modKey}`;
}

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
    const subtotalPence = items.reduce(
      (sum, item) => sum + item.effectivePricePence * item.quantity,
      0,
    );

    return {
      items,
      totalItems,
      subtotalPence,
      addItem(item, selectedModifiers = []) {
        const modifierDelta = selectedModifiers.reduce((s, m) => s + m.priceDeltaPence, 0);
        const effectivePricePence = item.pricePence + modifierDelta;
        const cartKey = buildCartKey(item.id, selectedModifiers);

        setItems((current) => {
          const existing = current.find((entry) => entry.cartKey === cartKey);
          if (existing) {
            return current.map((entry) =>
              entry.cartKey === cartKey
                ? { ...entry, quantity: entry.quantity + 1, stockQuantity: item.stockQuantity }
                : entry,
            );
          }

          return [
            ...current,
            {
              ...item,
              cartKey,
              quantity: 1,
              selectedModifiers,
              effectivePricePence,
            },
          ];
        });
      },
      updateQuantity(cartKey, quantity) {
        setItems((current) => {
          if (quantity <= 0) {
            return current.filter((entry) => entry.cartKey !== cartKey);
          }

          return current.map((entry) =>
            entry.cartKey === cartKey
              ? { ...entry, quantity: Math.min(quantity, entry.stockQuantity || quantity) }
              : entry,
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
