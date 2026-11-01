// Builds an `orders` row from a paid `payment_transactions` record. Shared
// by the Stripe webhook and the /api/payments/status polling fallback so
// both create orders identically.
export function buildOrderFromTransaction(tx) {
  const items = tx.metadata?.items || [];
  const firstItem = items[0];
  const totalQuantity = items.reduce((sum, i) => sum + (i.quantity || 1), 0) || 1;
  const productName = items.length > 1
    ? `${firstItem?.product_name || 'Order'} (+${items.length - 1} more)`
    : firstItem?.product_name || 'Order';

  return {
    order_id: `PNC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    user_id: tx.user_id || null,
    product_id: firstItem?.product_id || null,
    product_name: productName,
    product_slug: firstItem?.product_slug || null,
    quantity: totalQuantity,
    total: tx.amount,
    customer_name: tx.metadata?.customer?.name || null,
    customer_email: tx.user_email || null,
    shipping_address: tx.metadata?.shipping_address || null,
    status: 'paid',
    payment_session_id: tx.session_id,
    items,
    created_at: new Date().toISOString(),
  };
}
