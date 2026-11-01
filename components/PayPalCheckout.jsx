"use client";
import React, { useEffect, useRef, useState } from 'react';

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

let sdkPromise = null;
function loadPayPalSdk() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.paypal?.Buttons) return Promise.resolve(window.paypal);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CLIENT_ID)}&currency=USD&intent=capture&components=buttons&enable-funding=card`;
      script.async = true;
      script.onload = () => (window.paypal?.Buttons ? resolve(window.paypal) : reject(new Error('PayPal failed to load')));
      script.onerror = () => { sdkPromise = null; reject(new Error('PayPal failed to load')); };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

// PayPal Smart Buttons. The browser only asks the server to create and capture
// the order; prices, coupons and the final amount are all decided server-side.
//   getPayload() -> { payload } to start, or { error } to block (shown to the buyer)
//   onStart()    -> fired when a checkout is actually created (analytics)
//   onPaid(sessionId) -> payment captured; navigate to the confirmation page
// Renders nothing until NEXT_PUBLIC_PAYPAL_CLIENT_ID is configured.
export default function PayPalCheckout({ getPayload, onStart, onPaid, disabled = false }) {
  const containerRef = useRef(null);
  const propsRef = useRef({ getPayload, onStart, onPaid });
  propsRef.current = { getPayload, onStart, onPaid };
  const orderRef = useRef(null);
  const [message, setMessage] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || disabled) return undefined;
    let buttons = null;
    let cancelled = false;

    loadPayPalSdk()
      .then((paypal) => {
        if (cancelled || !containerRef.current) return;
        buttons = paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'paypal', height: 45 },

          // Blocks the popup (without an error screen) if the form is incomplete.
          onClick: (_data, actions) => {
            setMessage('');
            const check = propsRef.current.getPayload();
            if (check.error) { setMessage(check.error); return actions.reject(); }
            return actions.resolve();
          },

          createOrder: async () => {
            const { payload, error } = propsRef.current.getPayload();
            if (error) throw new Error(error);
            propsRef.current.onStart?.();
            const res = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.orderId) {
              setMessage(data.error || 'Could not start PayPal checkout. Please try again.');
              throw new Error(data.error || 'create failed');
            }
            orderRef.current = data.orderId;
            return data.orderId;
          },

          onApprove: async (data, actions) => {
            const res = await fetch('/api/paypal/capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const result = await res.json().catch(() => ({}));
            if (res.ok && result.success) {
              propsRef.current.onPaid(result.session_id);
              return undefined;
            }
            // Declined funding source: let the buyer pick another one in the same window.
            if (result.code === 'INSTRUMENT_DECLINED') return actions.restart();
            setMessage(result.error || 'We could not complete your PayPal payment. You have not been charged.');
            return undefined;
          },

          onCancel: () => {
            if (orderRef.current) {
              fetch('/api/paypal/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderRef.current }),
              }).catch(() => {});
              orderRef.current = null;
            }
          },

          onError: () => {
            setMessage((m) => m || 'Something went wrong with PayPal. Please try again or use another payment method.');
          },
        });
        if (buttons.isEligible()) buttons.render(containerRef.current);
        else setLoadFailed(true);
      })
      .catch(() => { if (!cancelled) setLoadFailed(true); });

    return () => {
      cancelled = true;
      try { buttons?.close(); } catch {}
    };
  }, [disabled]);

  if (!CLIENT_ID || loadFailed) return null;

  return (
    <div data-testid="paypal-checkout" className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex items-center gap-3 my-3 text-xs text-gray-400">
        <span className="flex-1 h-px bg-gray-200" />or pay with PayPal<span className="flex-1 h-px bg-gray-200" />
      </div>
      {!disabled && <div ref={containerRef} data-testid="paypal-buttons" />}
      {message && <p className="text-sm text-red-600 mt-2" data-testid="paypal-error">{message}</p>}
    </div>
  );
}
