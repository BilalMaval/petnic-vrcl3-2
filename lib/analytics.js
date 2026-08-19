"use client";

/**
 * Ecommerce dataLayer utility.
 *
 * This file never talks to GA4 or Meta directly - it only pushes
 * GA4-shaped ecommerce events onto window.dataLayer, which GTM (container
 * GTM-5793BFCL, already installed sitewide in app/layout.js) reads from.
 * GTM's existing Google Tag (G-0JWFCNHG8M) and any future GA4/Meta event
 * tags configured inside GTM are the actual consumers of these pushes -
 * nothing here is edited to add or change what fires inside GTM.
 */

const CURRENCY = 'USD';

function push(payload) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

// GA4's own guidance: dataLayer.push performs a shallow merge, so a stale
// `items` array from a previous ecommerce event can otherwise bleed into
// the next one. Clearing `ecommerce` immediately before each push avoids
// that cross-event contamination.
function pushEcommerce(event, ecommerce, extra = {}) {
  push({ ecommerce: null });
  push({ event, ecommerce, ...extra });
}

export function trackViewItem({ items, value }) {
  if (!items?.length) return;
  pushEcommerce('view_item', { currency: CURRENCY, value, items });
}

export function trackAddToCart({ items, value }) {
  if (!items?.length) return;
  pushEcommerce('add_to_cart', { currency: CURRENCY, value, items });
}

export function trackBeginCheckout({ items, value }) {
  if (!items?.length) return;
  pushEcommerce('begin_checkout', { currency: CURRENCY, value, items });
}

const PURCHASE_FIRED_PREFIX = 'petnic_purchase_fired_';

// localStorage (not sessionStorage) so the guard is shared across tabs: if
// the same success URL is opened in a second tab - or the same tab is
// refreshed - both see the same "already fired" flag for this session_id.
// sessionStorage would miss the multi-tab case since each tab gets its own
// isolated sessionStorage.
function hasPurchaseFired(sessionId) {
  if (typeof window === 'undefined' || !sessionId) return false;
  try {
    return window.localStorage.getItem(PURCHASE_FIRED_PREFIX + sessionId) === '1';
  } catch {
    return false;
  }
}

function markPurchaseFired(sessionId) {
  if (typeof window === 'undefined' || !sessionId) return;
  try {
    window.localStorage.setItem(PURCHASE_FIRED_PREFIX + sessionId, '1');
  } catch {}
}

/**
 * Fires `purchase` exactly once per Stripe checkout session, regardless of
 * how many times this is called - repeated status polls, React re-renders,
 * a refresh of the success page, or the same success URL opened in a
 * second tab all safely no-op after the first real fire. Returns true if
 * it actually fired, false if it was a deduplicated no-op.
 */
export function trackPurchase({ transactionId, value, items }) {
  if (!transactionId) return false;
  if (hasPurchaseFired(transactionId)) return false;
  markPurchaseFired(transactionId);
  pushEcommerce(
    'purchase',
    { transaction_id: transactionId, currency: CURRENCY, value, items },
    // event_id is a plain top-level dataLayer field (outside `ecommerce`)
    // so a future GTM Meta Pixel tag can read it as a Data Layer Variable
    // and pass it as fbq's eventID. If Meta Conversions API is added later
    // using this same event_id for the server-side Purchase call, Meta
    // will deduplicate the browser Pixel and CAPI events instead of
    // counting the purchase twice.
    { event_id: `purchase_${transactionId}` }
  );
  return true;
}

// --- Marketing attribution -------------------------------------------------
// Captures utm_source/medium/campaign/content/term and fbclid from the
// landing URL into sessionStorage, first-touch only within the session
// (never overwrites an already-captured value). Purely additive/read-only
// with respect to checkout - it doesn't touch the Stripe session, orders,
// or any existing flow. It exists so this data is available later if it
// needs to be threaded into checkout metadata or a future Meta CAPI call.
const ATTRIBUTION_KEY = 'petnic_attribution_v1';
const ATTRIBUTION_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];

export function captureAttribution() {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    let any = false;
    for (const key of ATTRIBUTION_PARAMS) {
      const v = params.get(key);
      if (v) { found[key] = v; any = true; }
    }
    if (!any) return;
    if (window.sessionStorage.getItem(ATTRIBUTION_KEY)) return; // first-touch only
    window.sessionStorage.setItem(
      ATTRIBUTION_KEY,
      JSON.stringify({ ...found, captured_at: new Date().toISOString() })
    );
  } catch {}
}

export function getStoredAttribution() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
