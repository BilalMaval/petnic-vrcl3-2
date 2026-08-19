"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

// Bumping this key would start shoppers with a fresh cart if the stored
// shape ever changes incompatibly.
export const CART_STORAGE_KEY = 'petnic_cart_v1';
// Set right before redirecting to Stripe from the Cart page so the success
// page knows THIS particular payment was a cart checkout (not a Buy Now
// purchase) and it's safe to clear the cart once payment is confirmed.
export const PENDING_CART_CHECKOUT_KEY = 'petnic_pending_cart_checkout';

const CartContext = createContext(null);

function readStoredCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive shape check so a corrupted/old entry can't crash the app.
    return parsed.filter((item) => item && typeof item === 'object' && item.id && item.product_id);
  } catch {
    return [];
  }
}

function writeStoredCart(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full/unavailable (e.g. private browsing) - fail silently,
    // cart just won't persist across a refresh in that case.
  }
}

export function clearStoredCart() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch {}
}

/**
 * Builds a stable identity for a cart line so that two different
 * configurations of the same product (different size, different art style,
 * etc.) are kept as separate lines, while adding the exact same
 * configuration twice increases quantity instead of duplicating the line.
 */
export function buildCartItemId(productId, designId, variationOptionIds) {
  const sortedOpts = [...(variationOptionIds || [])].sort().join(',');
  return `${productId}::design=${designId || 'none'}::opts=${sortedOpts}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount (client-only - localStorage doesn't exist during SSR).
  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  // Persist on every change, but only after the initial load so we don't
  // clobber storage with an empty array before hydration finishes.
  useEffect(() => {
    if (hydrated) writeStoredCart(items);
  }, [items, hydrated]);

  const addItem = useCallback((newItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === newItem.id);
      if (idx === -1) {
        return [...prev, { ...newItem, quantity: Math.max(1, newItem.quantity || 1) }];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: next[idx].quantity + Math.max(1, newItem.quantity || 1) };
      return next;
    });
  }, []);

  const removeItem = useCallback((cartItemId) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId, quantity) => {
    setItems((prev) => {
      if (quantity < 1) return prev.filter((i) => i.id !== cartItemId);
      return prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i));
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => {
      const unit = (parseFloat(i.price) || 0)
        + (i.design?.price_addition ? parseFloat(i.design.price_addition) || 0 : 0)
        + (i.variations || []).reduce((s, v) => s + (parseFloat(v.price_addition) || 0), 0);
      return sum + unit * i.quantity;
    }, 0);
  }, [items]);

  const value = useMemo(() => ({
    items,
    hydrated,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }), [items, hydrated, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
