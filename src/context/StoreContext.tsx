'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ProductId = string | number;
export type CartItem = { productId: ProductId; qty: number };
export type StoreState = {
  cart: CartItem[];
  wishlist: ProductId[]; // product ids
};

export type StoreActions = {
  addToCart: (productId: ProductId, qty?: number) => Promise<void>;
  removeFromCart: (productId: ProductId) => Promise<void>;
  clearCart: () => Promise<void>;
  addToWishlist: (productId: ProductId) => Promise<void>;
  removeFromWishlist: (productId: ProductId) => Promise<void>;
  isInWishlist: (productId: ProductId) => boolean;
  cartQty: (productId: ProductId) => number;
};

const defaultState: StoreState = { cart: [], wishlist: [] };

const StoreContext = createContext<(StoreState & StoreActions) | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(defaultState);

  useEffect(() => {
    // Load cart and wishlist from backend only if user is authenticated
    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const me = await meRes.json();
        if (cancelled) return;
        if (!me?.user) {
          setState(defaultState);
          return;
        }
        const [cartRes, wishRes] = await Promise.all([
          fetch('/api/my/cart', { credentials: 'include' }),
          fetch('/api/my/wishlist', { credentials: 'include' }),
        ]);
        if (cancelled) return;
        if (cartRes.status === 401 || wishRes.status === 401) {
          setState(defaultState);
          return;
        }
        const cartData = await cartRes.json();
        const wishData = await wishRes.json();
        const apiCart = Array.isArray(cartData?.cart)
          ? cartData.cart.map((c: any) => ({ productId: c.product, qty: c.qty }))
          : [];
        const apiWishlist = Array.isArray(wishData?.wishlist) ? wishData.wishlist : [];
        setState({ cart: apiCart, wishlist: apiWishlist });
      } catch {
        // If backend not reachable, keep empty state (no local fallback per requirements)
        setState(defaultState);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const actions = useMemo<StoreActions>(() => ({
    addToCart: async (productId, qty = 1) => {
      try {
        const res = await fetch('/api/my/cart', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: String(productId), qty, mode: 'add' }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const apiCart = Array.isArray(data?.cart)
          ? data.cart.map((c: any) => ({ productId: c.product, qty: c.qty }))
          : [];
        setState((s) => ({ ...s, cart: apiCart }));
      } catch {}
    },
    removeFromCart: async (productId) => {
      try {
        const url = `/api/my/cart?productId=${encodeURIComponent(String(productId))}`;
        const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const apiCart = Array.isArray(data?.cart)
          ? data.cart.map((c: any) => ({ productId: c.product, qty: c.qty }))
          : [];
        setState((s) => ({ ...s, cart: apiCart }));
      } catch {}
    },
    clearCart: async () => {
      try {
        const res = await fetch('/api/my/cart?all=true', { method: 'DELETE', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const apiCart = Array.isArray(data?.cart)
          ? data.cart.map((c: any) => ({ productId: c.product, qty: c.qty }))
          : [];
        setState((s) => ({ ...s, cart: apiCart }));
      } catch {}
    },
    addToWishlist: async (productId) => {
      try {
        const res = await fetch('/api/my/wishlist', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: String(productId) }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const apiWishlist = Array.isArray(data?.wishlist) ? data.wishlist : [];
        setState((s) => ({ ...s, wishlist: apiWishlist }));
      } catch {}
    },
    removeFromWishlist: async (productId) => {
      try {
        const url = `/api/my/wishlist?productId=${encodeURIComponent(String(productId))}`;
        const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const apiWishlist = Array.isArray(data?.wishlist) ? data.wishlist : [];
        setState((s) => ({ ...s, wishlist: apiWishlist }));
      } catch {}
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

