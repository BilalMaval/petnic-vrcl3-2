"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Package, ShoppingBag, DollarSign, Users, ArrowUpRight, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'this_year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' },
];

// Mirrors WooCommerce Analytics' date-range picker: a preset dropdown plus a
// custom start/end fallback. Returns { start, end } as 'YYYY-MM-DD' strings,
// or { start: null, end: null } for 'all' (no filter).
function presetToRange(preset, customStart, customEnd) {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { start: fmt(now), end: fmt(now) };
    case 'yesterday': {
      const y = daysAgo(1);
      return { start: fmt(y), end: fmt(y) };
    }
    case 'last7':
      return { start: fmt(daysAgo(6)), end: fmt(now) };
    case 'last30':
      return { start: fmt(daysAgo(29)), end: fmt(now) };
    case 'this_month':
      return { start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end: fmt(now) };
    case 'last_month': {
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
      return { start: fmt(lastMonthStart), end: fmt(lastMonthEnd) };
    }
    case 'this_year':
      return { start: fmt(new Date(now.getFullYear(), 0, 1)), end: fmt(now) };
    case 'custom':
      return { start: customStart || null, end: customEnd || null };
    case 'all':
    default:
      return { start: null, end: null };
  }
}

export default function DashboardHome({ token }) {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [timeSeries, setTimeSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [preset, setPreset] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  // Only re-fetch on custom range once the user hits Apply, not per keystroke.
  const [appliedCustom, setAppliedCustom] = useState({ start: null, end: null });

  const activeRange = preset === 'custom'
    ? { start: appliedCustom.start, end: appliedCustom.end }
    : presetToRange(preset);

  const fetchStats = useCallback(() => {
    if (!token) { setLoading(false); return; }
    if (preset === 'custom' && (!activeRange.start || !activeRange.end)) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (activeRange.start) params.set('start', activeRange.start);
    if (activeRange.end) params.set('end', activeRange.end);

    fetch(`/api/admin/stats?${params.toString()}`, {
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
        setTimeSeries(d.timeSeries || []);
        setLoading(false);
      })
      .catch(e => {
        console.error('Dashboard error:', e);
        setError(e.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, preset, appliedCustom.start, appliedCustom.end]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const formatDisplayDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Always show the actual resolved date(s), not just the preset name, so
  // "This Month" etc. reads as e.g. "This Month (Aug 1 - Aug 20, 2026)".
  const rangeLabel = (() => {
    if (preset === 'all') return 'All Time';
    const { start, end } = activeRange;
    if (!start || !end) return preset === 'custom' ? 'Pick a range' : '...';
    const dateStr = start === end ? formatDisplayDate(start) : `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
    if (preset === 'custom') return dateStr;
    const presetName = PRESETS.find(p => p.key === preset)?.label;
    return `${presetName} (${dateStr})`;
  })();

  const cards = [
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'bg-green-500' },
    { label: 'Revenue', value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: 'bg-[#F97316]' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-purple-500' },
  ];

  if (loading && !stats) {
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Dashboard Overview</h2>

        <div className="flex flex-col items-end gap-1" data-testid="date-range-filter">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/30"
            data-testid="date-range-preset"
          >
            {PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>

          {preset === 'custom' && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/30"
                data-testid="date-range-start"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/30"
                data-testid="date-range-end"
              />
              <button
                onClick={() => setAppliedCustom({ start: customStart, end: customEnd })}
                disabled={!customStart || !customEnd}
                className="bg-[#F97316] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#EA6C10] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="date-range-apply"
              >
                Apply
              </button>
            </>
          )}
        </div>
        <span className="text-xs text-gray-400" data-testid="date-range-resolved">{rangeLabel}</span>
        </div>
      </div>

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

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6" data-testid="sales-chart">
          <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">Sales</h3>
          {timeSeries.length === 0 ? (
            <p className="text-gray-500 text-center py-16">No sales data in this range</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timeSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#4A4A68' }} />
                <YAxis tick={{ fontSize: 12, fill: '#4A4A68' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} dot={{ r: 3, fill: '#F97316' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6" data-testid="orders-chart">
          <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">Orders</h3>
          {timeSeries.length === 0 ? (
            <p className="text-gray-500 text-center py-16">No orders data in this range</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={timeSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#4A4A68' }} />
                <YAxis tick={{ fontSize: 12, fill: '#4A4A68' }} allowDecimals={false} />
                <Tooltip formatter={(value) => [value, 'Orders']} />
                <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1A1A2E]">Recent Orders</h3>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders in this range</p>
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
