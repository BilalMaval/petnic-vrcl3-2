import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();

  // Optional date range (YYYY-MM-DD, inclusive) scoping orders/revenue -
  // mirrors WooCommerce's Analytics date-range picker. Product/user totals
  // stay all-time since they're catalog/account counts, not sales metrics.
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  const rangeStart = startParam ? new Date(`${startParam}T00:00:00.000Z`) : null;
  const rangeEnd = endParam ? new Date(`${endParam}T23:59:59.999Z`) : null;

  try {
    // Fetch all data and count manually for reliability
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      supabase.from('products').select('id'),
      supabase.from('orders').select('id, order_id, product_name, total, status, created_at').order('created_at', { ascending: false }),
      supabase.from('users').select('id'),
    ]);

    const products = productsRes.data || [];
    const allOrders = ordersRes.data || [];
    const users = usersRes.data || [];

    const orders = (rangeStart || rangeEnd)
      ? allOrders.filter(o => {
          const created = new Date(o.created_at);
          if (rangeStart && created < rangeStart) return false;
          if (rangeEnd && created > rangeEnd) return false;
          return true;
        })
      : allOrders;

    // Only orders confirmed as paid by Stripe (via the webhook/status-poll
    // flow) count as revenue - 'confirmed' can be set by the unauthenticated
    // /api/orders endpoint without any payment ever being taken.
    const totalRevenue = orders
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    const recentOrders = orders.slice(0, 10);
    const timeSeries = buildTimeSeries(orders, rangeStart, rangeEnd);

    return NextResponse.json({
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        totalUsers: users.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        confirmedOrders: orders.filter(o => o.status === 'paid').length,
      },
      recentOrders,
      timeSeries,
      range: { start: startParam || null, end: endParam || null },
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      stats: {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
      },
      recentOrders: [],
      timeSeries: [],
      error: error.message,
    });
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const fmtLabel = (d, granularity) => {
  if (granularity === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const startOfWeek = (d) => { const x = new Date(d); const day = x.getUTCDay(); x.setUTCDate(x.getUTCDate() - day); x.setUTCHours(0, 0, 0, 0); return x; };
const startOfMonth = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));

// Buckets orders into a day/week/month time series depending on the span of
// the range, similar to how WooCommerce Analytics auto-adjusts granularity
// so a year-long range doesn't render 365 individual daily points.
function buildTimeSeries(orders, rangeStart, rangeEnd) {
  if (orders.length === 0 && !rangeStart && !rangeEnd) return [];

  let start = rangeStart;
  let end = rangeEnd;
  if (!start || !end) {
    const dates = orders.map(o => new Date(o.created_at).getTime());
    if (dates.length === 0) return [];
    start = start || new Date(Math.min(...dates));
    end = end || new Date(Math.max(...dates));
  }

  const spanDays = Math.max(1, Math.round((end - start) / DAY_MS));
  const granularity = spanDays <= 31 ? 'day' : spanDays <= 182 ? 'week' : 'month';

  const bucketKey = (date) => {
    if (granularity === 'day') return date.toISOString().slice(0, 10);
    if (granularity === 'week') return startOfWeek(date).toISOString().slice(0, 10);
    return startOfMonth(date).toISOString().slice(0, 10);
  };

  const buckets = new Map();
  const advance = (date) => {
    const d = new Date(date);
    if (granularity === 'day') d.setUTCDate(d.getUTCDate() + 1);
    else if (granularity === 'week') d.setUTCDate(d.getUTCDate() + 7);
    else d.setUTCMonth(d.getUTCMonth() + 1);
    return d;
  };

  // Pre-seed every bucket in range with zero so the chart has a continuous
  // timeline instead of gaps where no orders happened to land.
  for (let cursor = new Date(bucketKey(start)); cursor <= end; cursor = advance(cursor)) {
    const key = bucketKey(cursor);
    buckets.set(key, { date: key, label: fmtLabel(cursor, granularity), revenue: 0, orders: 0 });
  }

  for (const o of orders) {
    const created = new Date(o.created_at);
    const key = bucketKey(created);
    if (!buckets.has(key)) buckets.set(key, { date: key, label: fmtLabel(created, granularity), revenue: 0, orders: 0 });
    const bucket = buckets.get(key);
    bucket.orders += 1;
    if (o.status === 'paid') bucket.revenue += parseFloat(o.total || 0);
  }

  return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
}
