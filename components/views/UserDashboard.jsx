"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ShoppingBag, LogOut, Package, Calendar, DollarSign } from 'lucide-react';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { router.push('/auth'); return; }

    fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setUser(d.user); setOrders(d.orders || []); setLoading(false); })
      .catch(() => { localStorage.removeItem('user_token'); router.push('/auth'); });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  if (loading) return <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full" /></main>;

  return (
    <main className="min-h-screen bg-[#FAFAFA] py-12" data-testid="user-dashboard">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>My Account</h1>
            <p className="text-[#4A4A68]">Welcome back, {user?.name || 'Pet Lover'}!</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors" data-testid="user-logout-btn"><LogOut className="w-4 h-4" />Sign Out</button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#F97316] flex items-center justify-center text-white text-2xl font-bold">{user?.name?.[0] || 'P'}</div>
            <div>
              <h2 className="text-xl font-bold text-[#1A1A2E]">{user?.name}</h2>
              <p className="text-[#4A4A68] text-sm">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">Member since {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-blue-500" /></div>
            <div><p className="text-2xl font-bold text-[#1A1A2E]">{orders.length}</p><p className="text-sm text-gray-500">Total Orders</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-green-500" /></div>
            <div><p className="text-2xl font-bold text-[#1A1A2E]">${orders.reduce((s, o) => s + parseFloat(o.total), 0).toFixed(2)}</p><p className="text-sm text-gray-500">Total Spent</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center"><Package className="w-6 h-6 text-purple-500" /></div>
            <div><p className="text-2xl font-bold text-[#1A1A2E]">{orders.filter(o => o.status === 'confirmed').length}</p><p className="text-sm text-gray-500">Active Orders</p></div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100"><h3 className="text-lg font-semibold text-[#1A1A2E]">Order History</h3></div>
          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No orders yet</p>
              <Link href="/shop" className="text-[#F97316] font-semibold hover:underline">Start Shopping</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50">
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Order</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Product</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Total</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Date</th>
                </tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-gray-50">
                      <td className="py-4 px-6 font-mono text-xs">{o.order_id}</td>
                      <td className="py-4 px-6 font-medium">{o.product_name}</td>
                      <td className="py-4 px-6 font-semibold">${parseFloat(o.total).toFixed(2)}</td>
                      <td className="py-4 px-6"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${o.status === 'confirmed' ? 'bg-green-100 text-green-700' : o.status === 'shipped' ? 'bg-blue-100 text-blue-700' : o.status === 'delivered' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span></td>
                      <td className="py-4 px-6 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
