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
      error: error.message,
    });
  }
}
