import { getSupabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { buildOrderFromTransaction } from '@/lib/orders';
import { recordRedemption, releaseCoupon } from '@/lib/coupons';

// Finishing a payment: shared by the Stripe webhook, the status-poll
// fallback and the free-order path, so all three behave identically.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://petnicstudio.com';

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function extensionFromUrl(url) {
  try {
    const last = new URL(url).pathname.split('/').pop() || '';
    const ext = last.includes('.') ? last.split('.').pop().toLowerCase() : '';
    return /^[a-z0-9]{1,6}$/.test(ext) ? ext : '';
  } catch {
    return '';
  }
}

// Which purchased products have a downloadable file (never exposes the URL).
export async function listDownloadableFiles(items) {
  const ids = [...new Set((items || []).map((i) => i.product_id).filter(Boolean))];
  if (ids.length === 0) return [];
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('products').select('id, name, download_file_url').in('id', ids);
  return (data || [])
    .filter((p) => p.download_file_url)
    .map((p) => ({ product_id: p.id, title: p.name, extension: extensionFromUrl(p.download_file_url) }));
}

async function sendPaidOrderEmail({ order, items, email, sessionId, total }) {
  // Reserved-for-testing addresses never get real mail.
  if (!email || /\.invalid$/i.test(email)) return;
  try {
    const files = await listDownloadableFiles(items);
    const fileLinks = files.map((f) =>
      `<li style="margin:6px 0;"><a href="${SITE_URL}/api/orders/download?session_id=${encodeURIComponent(sessionId)}&product_id=${encodeURIComponent(f.product_id)}">Download ${escapeHtml(f.title)}</a></li>`
    ).join('');
    const rows = (items || []).map((i) =>
      `<li style="margin:4px 0;">${escapeHtml(i.product_name)} &times; ${i.quantity}</li>`
    ).join('');
    await sendEmail({
      to: email,
      subject: `Your Petnic Studio order ${order?.order_id || ''}`.trim(),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A1A2E;">
          <h2>Thank you for your order!</h2>
          ${order?.order_id ? `<p>Order <strong>${escapeHtml(order.order_id)}</strong> &middot; Total $${Number(total || 0).toFixed(2)}</p>` : ''}
          <ul>${rows}</ul>
          ${fileLinks ? `<h3>Your downloads</h3><ul>${fileLinks}</ul>` : ''}
          <p style="color:#4A4A68;">Questions? Reply to this email or contact info@petnicstudio.com.</p>
        </div>`,
    });
  } catch (e) {
    console.error('order confirmation email failed:', e);
  }
}

// Marks a transaction paid exactly once, then creates the order, records any
// coupon redemption and sends the confirmation email. The conditional UPDATE
// means that if the webhook and the status poll race, only one of them
// proceeds. Returns the order, or null when there was nothing to do.
export async function completePaidSession(sessionId, { status, paymentStatus, customerEmail }) {
  const supabase = getSupabaseAdmin();

  const { data: tx } = await supabase
    .from('payment_transactions')
    .update({ status, payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .neq('payment_status', 'paid')
    .select('*')
    .maybeSingle();

  if (!tx || paymentStatus !== 'paid') return null;

  const email = tx.user_email || customerEmail || null;

  let order = null;
  let created = false;
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, order_id')
    .eq('payment_session_id', sessionId)
    .maybeSingle();

  if (existingOrder) {
    order = existingOrder;
  } else {
    const row = buildOrderFromTransaction({ ...tx, user_email: email });
    let { data: inserted, error } = await supabase.from('orders').insert(row).select('id, order_id').single();
    if (error && (row.customer_name || row.shipping_address)) {
      // Never lose a paid order over optional fields (e.g. an unexpected column type).
      console.error('order insert with buyer details failed, retrying without them:', error.message);
      const { customer_name, shipping_address, ...bare } = row;
      ({ data: inserted, error } = await supabase.from('orders').insert(bare).select('id, order_id').single());
    }
    if (error) console.error('order insert failed for session', sessionId, error);
    else { order = inserted; created = true; }
  }

  // The payment happened either way, so the coupon use is recorded even if
  // the order row failed to insert.
  const coupon = tx.metadata?.coupon;
  if (coupon?.id) {
    await recordRedemption({
      couponId: coupon.id,
      orderId: sessionId,
      orderNumber: order?.order_id,
      email,
      discount: coupon.discount,
    });
  }

  if (created) {
    await sendPaidOrderEmail({ order, items: tx.metadata?.items || [], email, sessionId, total: tx.amount });
  }
  return order;
}

// Checkout abandoned/expired: give back the coupon use that was reserved when
// the session was created. The conditional UPDATE guarantees one release.
export async function expireSession(sessionId) {
  const supabase = getSupabaseAdmin();
  const { data: tx } = await supabase
    .from('payment_transactions')
    .update({ status: 'expired', payment_status: 'expired', updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .not('payment_status', 'in', '(paid,expired)')
    .select('metadata')
    .maybeSingle();
  if (tx?.metadata?.coupon?.id) await releaseCoupon(tx.metadata.coupon.id);
}
