"use client";
import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, Users, TrendingUp, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';

export default function DashboardHome({ token }) {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    fetch('/api/admin/stats', { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => { 
        setStats(d.stats || {}); 
        setRecentOrders(d.recentOrders || []); 
        setLoading(false);
      })
      .catch(e => {
        console.error('Dashboard error:', e);
        setError(e.message);
        setLoading(false);
      });
  }, [token]);

  const cards = [
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'bg-green-500' },
    { label: 'Revenue', value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: 'bg-[#F97316]' },
    { label: 'Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="admin-dashboard-loading">
        <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 text-center" data-testid="admin-dashboard-error">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium">Failed to load dashboard</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard-home">
      <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Dashboard Overview</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${c.color} rounded-xl flex items-center justify-center text-white`}><c.icon className="w-6 h-6" /></div>
              <ArrowUpRight className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A2E]">{c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Order ID</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Product</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Total</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-b border-gray-50">
                    <td className="py-3 px-2 font-mono text-xs">{o.order_id}</td>
                    <td className="py-3 px-2">{o.product_name}</td>
                    <td className="py-3 px-2 font-semibold">${parseFloat(o.total || 0).toFixed(2)}</td>
                    <td className="py-3 px-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${(o.status === 'confirmed' || o.status === 'paid') ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
