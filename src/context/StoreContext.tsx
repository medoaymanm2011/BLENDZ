'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = { productId: number; qty: number };
export type StoreState = {
  cart: CartItem[];
  wishlist: number[]; // product ids
};

export type StoreActions = {
  addToCart: (productId: number, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  cartQty: (productId: number) => number;
};

const defaultState: StoreState = { cart: [], wishlist: [] };

const StoreContext = createContext<(StoreState & StoreActions) | null>(null);

const STORAGE_KEY = 'vk-store';

function loadState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      Array.isArray(parsed.cart) &&
      Array.isArray(parsed.wishlist)
    ) {
      return parsed as StoreState;
    }
    return defaultState;
  } catch {
    return defaultState;
  }
}

function saveState(state: StoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(defaultState);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const actions = useMemo<StoreActions>(() => ({
    addToCart: (productId, qty = 1) => {
      setState((s) => {
        const exists = s.cart.find((c) => c.productId === productId);
        const cart = exists
          ? s.cart.map((c) => (c.productId === productId ? { ...c, qty: c.qty + qty } : c))
          : [...s.cart, { productId, qty }];
        return { ...s, cart };
      });
    },
    removeFromCart: (productId) => {
      setState((s) => ({ ...s, cart: s.cart.filter((c) => c.productId !== productId) }));
    },
    clearCart: () => setState((s) => ({ ...s, cart: [] })),
    addToWishlist: (productId) => {
      setState((s) =>
        s.wishlist.includes(productId)
          ? s
          : { ...s, wishlist: [...s.wishlist, productId] }
      );
    },
    removeFromWishlist: (productId) => {
      setState((s) => ({ ...s, wishlist: s.wishlist.filter((id) => id !== productId) }));
    },
    isInWishlist: (productId) => state.wishlist.includes(productId),
    cartQty: (productId) => state.cart.find((c) => c.productId === productId)?.qty ?? 0,
  }), [state]);

  const value = { ...state, ...actions };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
