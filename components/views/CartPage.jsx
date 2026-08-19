"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight, Loader2, AlertTriangle, CreditCard, Shield } from 'lucide-react';
import { useCart, PENDING_CART_CHECKOUT_KEY } from '@/lib/cart-context';
import { trackBeginCheckout, getStoredAttribution } from '@/lib/analytics';

const CartPage = () => {
  const { items, hydrated, subtotal, updateQuantity, removeItem } = useCart();
  const [availability, setAvailability] = useState({}); // { [product_id]: { available, currentPrice, name, image_url } }
  const [checking, setChecking] = useState(true);
  const [checkoutError, setCheckoutError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Re-validate each cart line against the live product catalog: current
  // price/name/image for display, and whether it's still purchasable.
  // The actual charge is always recomputed server-side at checkout
  // regardless of what's shown here.
  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    const uniqueSlugs = [...new Set(items.map((i) => i.slug).filter(Boolean))];

    Promise.all(
      uniqueSlugs.map((slug) =>
        fetch(`/api/products/${encodeURIComponent(slug)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => ({ slug, data: d }))
          .catch(() => ({ slug, data: null }))
      )
    ).then((results) => {
      if (cancelled) return;
      const map = {};
      for (const item of items) {
        const found = results.find((r) => r.slug === item.slug)?.data?.product;
        if (found && found.id === item.product_id) {
          map[item.id] = {
            available: found.in_stock !== false,
            currentPrice: found.price,
            name: found.name,
            image_url: found.image_url,
          };
        } else {
          map[item.id] = { available: false, currentPrice: null, name: null, image_url: null };
        }
      }
      setAvailability(map);
      setChecking(false);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, items.length]);

  const unitPrice = (item) => {
    const base = parseFloat(item.price) || 0;
    const design = item.design?.price_addition ? parseFloat(item.design.price_addition) || 0 : 0;
    const variations = (item.variations || []).reduce((s, v) => s + (parseFloat(v.price_addition) || 0), 0);
    return base + design + variations;
  };

  const hasUnavailable = items.some((i) => availability[i.id]?.available === false);
  const hasNonDigital = items.some((i) => i.collection_slug !== 'digital');

  const handleCheckout = async () => {
    if (hasUnavailable) {
      setCheckoutError('Remove unavailable items before checking out.');
      return;
    }
    setCheckoutError('');
    setProcessing(true);
    // Cart checkout is actually starting (not just the cart page opening) -
    // represents the full cart contents.
    trackBeginCheckout({
      items: items.map((item) => ({
        item_id: item.product_id,
        item_name: item.name,
        price: unitPrice(item),
        quantity: item.quantity,
        item_variant: [item.design?.name, ...(item.variations || []).map((v) => v.label)].filter(Boolean).join(', ') || undefined,
      })),
      value: subtotal,
    });
    try {
      const cart_items = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        design_id: item.collection_slug === 'pod' ? (item.design?.id || null) : null,
        variation_option_ids: (item.variations || []).map((v) => v.id),
      }));

      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_url: window.location.origin,
          user_email: null,
          cart_items,
          shipping: { required: hasNonDigital, name: '' },
          selected_design: null,
          attribution: getStoredAttribution(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to start checkout');
      }
      // Flag this session as cart-originated so the success page knows it's
      // safe to clear the cart once payment is confirmed - Buy Now sessions
      // never set this flag, so they never touch the cart.
      try { window.localStorage.setItem(PENDING_CART_CHECKOUT_KEY, '1'); } catch {}
      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err.message || 'Something went wrong. Please try again.');
      setProcessing(false);
    }
  };

  if (!hydrated || checking) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-20" data-testid="cart-empty-state">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-[#F97316]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Your cart is empty</h1>
          <p className="text-[#4A4A68] mb-8">Looks like you haven't added anything yet.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 bg-[#F97316] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] py-10" data-testid="cart-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/shop" className="inline-flex items-center gap-2 text-[#4A4A68] hover:text-[#F97316] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /><span>Continue Shopping</span>
        </Link>

        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>
          Your Cart <span className="text-[#4A4A68] font-normal text-xl">({items.length} item{items.length === 1 ? '' : 's'})</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Line Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const avail = availability[item.id];
              const unavailable = avail?.available === false;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-4 flex gap-4 ${unavailable ? 'border-red-200' : 'border-gray-100'}`}
                  data-testid={`cart-item-${item.id}`}
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                    {item.image_url && (
                      <Image src={item.image_url} alt={item.name} fill sizes="96px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/product/${item.slug}`} className="font-bold text-[#1A1A2E] hover:text-[#F97316] transition-colors line-clamp-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {item.name}
                        </Link>
                        {item.design && (
                          <p className="text-sm text-[#4A4A68] mt-0.5">Style: {item.design.name}</p>
                        )}
                        {(item.variations || []).length > 0 && (
                          <p className="text-sm text-[#4A4A68] mt-0.5">{item.variations.map((v) => v.label).join(', ')}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Remove item"
                        data-testid={`remove-item-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {unavailable && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-2">
                        <AlertTriangle className="w-3.5 h-3.5" /> No longer available — please remove this item
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold" data-testid={`quantity-${item.id}`}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-bold text-[#F97316]">${(unitPrice(item) * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Order Summary</h2>
              <div className="flex justify-between text-sm text-[#4A4A68] mb-2">
                <span>Subtotal</span>
                <span data-testid="cart-subtotal">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">Shipping and final total are calculated securely at checkout.</p>
              <div className="flex justify-between font-bold text-lg border-t pt-3 mb-6">
                <span>Estimated Total</span>
                <span className="text-[#F97316]" data-testid="cart-total">${subtotal.toFixed(2)}</span>
              </div>

              {checkoutError && <p className="text-sm text-red-600 mb-3" data-testid="checkout-error">{checkoutError}</p>}

              <button
                onClick={handleCheckout}
                disabled={processing || hasUnavailable}
                data-testid="proceed-to-checkout-button"
                className="w-full flex items-center justify-center gap-2 bg-[#F97316] text-white py-4 rounded-xl font-bold hover:bg-[#EA6C10] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5" />{processing ? 'Redirecting…' : 'Proceed to Checkout'}
              </button>
              <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1 mt-3">
                <Shield className="w-3 h-3" />Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
