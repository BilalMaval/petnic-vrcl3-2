import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const supabase = getSupabaseAdmin();

  try {
    // Fetch all data and count manually for reliability
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      supabase.from('products').select('id'),
      supabase.from('orders').select('id, order_id, product_name, total, status, created_at').order('created_at', { ascending: false }),
      supabase.from('users').select('id'),
    ]);

    const products = productsRes.data || [];
    const orders = ordersRes.data || [];
    const users = usersRes.data || [];

    const totalRevenue = orders
      .filter(o => o.status === 'confirmed')
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    const recentOrders = orders.slice(0, 10);

    return NextResponse.json({
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        totalUsers: users.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
      },
      recentOrders,
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
