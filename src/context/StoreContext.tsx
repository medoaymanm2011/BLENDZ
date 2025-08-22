'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ProductId = string | number;
export type CartItem = { productId: ProductId; qty: number };
export type StoreState = {
  cart: CartItem[];
  wishlist: ProductId[]; // product ids
};

export type StoreActions = {
  addToCart: (productId: ProductId, qty?: number) => void;
  removeFromCart: (productId: ProductId) => void;
  clearCart: () => void;
  addToWishlist: (productId: ProductId) => void;
  removeFromWishlist: (productId: ProductId) => void;
  isInWishlist: (productId: ProductId) => boolean;
  cartQty: (productId: ProductId) => number;
};

const defaultState: StoreState = { cart: [], wishlist: [] };

const StoreContext = createContext<(StoreState & StoreActions) | null>(null);

const BASE_KEY = 'vk-store';

function makeKey(email: string | null | undefined) {
  const id = (email || 'guest').toLowerCase();
  return `${BASE_KEY}:${id}`;
}

function loadStateForKey(key: string): StoreState {
  try {
    const raw = localStorage.getItem(key);
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

function saveStateForKey(key: string, state: StoreState) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(defaultState);
  const [email, setEmail] = useState<string | null>(null);
  const [storageKey, setStorageKey] = useState<string>(() => makeKey(null));

  useEffect(() => {
    // Fetch current user to determine per-user storage key
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        const userEmail: string | null = res.ok && data?.user?.email ? data.user.email : null;
        if (cancelled) return;
        setEmail(userEmail);
        const nextKey = makeKey(userEmail);

        // Migrate guest -> user on first login (only if user store empty)
        const guestKey = makeKey(null);
        const userState = loadStateForKey(nextKey);
        const guestState = loadStateForKey(guestKey);
        if ((userEmail && userState.cart.length === 0 && userState.wishlist.length === 0)
          && (guestState.cart.length > 0 || guestState.wishlist.length > 0)) {
          saveStateForKey(nextKey, guestState);
          try { localStorage.removeItem(guestKey); } catch {}
          setState(guestState);
        } else {
          setState(userState);
        }
        setStorageKey(nextKey);
      } catch {
        // fallback to guest storage
        const guestKey = makeKey(null);
        setStorageKey(guestKey);
        setState(loadStateForKey(guestKey));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Persist to the active user's key
    saveStateForKey(storageKey, state);
  }, [state, storageKey]);

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
