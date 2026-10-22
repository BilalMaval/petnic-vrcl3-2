"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Ticket, X, Loader2 } from 'lucide-react';
import { formatInZone } from '@/lib/coupon-time';

const COUPON_STORAGE_KEY = 'petnic_coupon_v1';

function readStoredCode() {
  try { return window.localStorage.getItem(COUPON_STORAGE_KEY) || ''; } catch { return ''; }
}
function writeStoredCode(code) {
  try {
    if (code) window.localStorage.setItem(COUPON_STORAGE_KEY, code);
    else window.localStorage.removeItem(COUPON_STORAGE_KEY);
  } catch {}
}
export function clearStoredCoupon() { writeStoredCode(''); }

// Reusable coupon field for the cart and the Buy Now checkout.
// `items`: [{ productId, quantity, designId?, variationOptionIds? }]. Only ids
// and quantities are sent; the server prices everything.
// `onChange(applied)` receives null or { coupon, subtotal, discount, total }.
export default function CouponBox({ items, email, onChange }) {
  const [input, setInput] = useState('');
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const itemsKey = JSON.stringify(items || []);
  const hasItems = (items || []).length > 0;

  const validate = async (code, { silent }) => {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, items, email: email || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      setApplied(data);
      setError('');
      writeStoredCode(data.coupon.code);
      onChangeRef.current?.(data);
      return true;
    }
    // Rate-limited re-checks keep the current state instead of dropping a valid code.
    if (silent && res.status === 429) return true;
    setApplied(null);
    onChangeRef.current?.(null);
    if (silent) writeStoredCode('');
    else setError(data.error || 'Could not apply this coupon');
    return false;
  };

  // Restore a remembered code, and re-check it whenever the cart or the
  // email changes (a code that stops being valid is dropped silently).
  useEffect(() => {
    if (!hasItems) return undefined;
    const code = applied?.coupon?.code || readStoredCode();
    if (!code) return undefined;
    const timer = setTimeout(() => { validate(code, { silent: true }); }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, email]);

  const apply = async () => {
    const code = input.trim().toUpperCase().replace(/\s+/g, '');
    if (!code || busy) return;
    setBusy(true);
    setError('');
    const ok = await validate(code, { silent: false });
    if (ok) setInput('');
    setBusy(false);
  };

  const remove = () => {
    setApplied(null);
    setError('');
    writeStoredCode('');
    onChangeRef.current?.(null);
  };

  if (applied) {
    const c = applied.coupon;
    return (
      <div className="flex items-start justify-between gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mb-4" data-testid="coupon-applied">
        <div className="text-sm text-green-800">
          <p className="font-semibold flex items-center gap-1.5"><Ticket className="w-4 h-4" />{c.code} applied &middot; You save ${applied.discount.toFixed(2)}</p>
          {c.expiresAt && <p className="text-xs text-green-700 mt-0.5">Ends {formatInZone(c.expiresAt, c.endTimezone)}</p>}
        </div>
        <button type="button" onClick={remove} className="text-green-700 hover:text-green-900 p-0.5" aria-label="Remove coupon" data-testid="coupon-remove"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div className="mb-4" data-testid="coupon-box">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
          placeholder="Coupon code"
          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
          data-testid="coupon-input"
        />
        <button type="button" onClick={apply} disabled={busy || !input.trim() || !hasItems} className="px-4 py-2.5 bg-[#1A1A2E] text-white rounded-lg text-sm font-semibold hover:bg-[#2a2a4a] disabled:opacity-50 flex items-center gap-1.5" data-testid="coupon-apply">
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Apply
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5" data-testid="coupon-error">{error}</p>}
    </div>
  );
}
