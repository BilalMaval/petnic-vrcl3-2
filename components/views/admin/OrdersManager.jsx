"use client";
import React, { useState, useEffect } from 'react';
import { Truck, Download, Search, Calendar, Filter, Package, DollarSign, ShoppingBag } from 'lucide-react';

export default function OrdersManager({ token }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = () => {
    fetch(`/api/admin/orders?status=${filter}`, { headers }).then(r => r.json()).then(d => setOrders(d.orders || []));
  };

  useEffect(load, [token, filter]);

  // Apply client-side filters
  useEffect(() => {
    let filtered = [...orders];
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(o => 
        o.order_id?.toLowerCase().includes(searchLower) ||
        o.customer_name?.toLowerCase().includes(searchLower) ||
        o.customer_email?.toLowerCase().includes(searchLower) ||
        o.product_name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      switch(typeFilter) {
        case 'dropship': filtered = filtered.filter(o => o.is_dropship); break;
        case 'digital': filtered = filtered.filter(o => o.is_digital); break;
        case 'custom': filtered = filtered.filter(o => o.custom_order); break;
        case 'standard': filtered = filtered.filter(o => !o.is_dropship && !o.is_digital && !o.custom_order); break;
      }
    }
    
    // Date filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      switch(dateRange) {
        case 'today': startDate = new Date(now.setHours(0,0,0,0)); break;
        case 'week': startDate = new Date(now.setDate(now.getDate() - 7)); break;
        case 'month': startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
        case 'quarter': startDate = new Date(now.setMonth(now.getMonth() - 3)); break;
      }
      if (startDate) {
        filtered = filtered.filter(o => new Date(o.created_at) >= startDate);
      }
    }
    
    setFilteredOrders(filtered);
  }, [orders, search, typeFilter, dateRange]);

  const updateStatus = async (id, status) => {
    await fetch('/api/admin/orders', { method: 'PUT', headers, body: JSON.stringify({ id, status }) });
    load();
  };

  // Calculate stats
  const stats = {
    total: filteredOrders.length,
    revenue: filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    confirmed: filteredOrders.filter(o => o.status === 'confirmed').length,
  };

  return (
    <div data-testid="admin-orders-manager">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Orders</h2>
          <p className="text-sm text-gray-500 mt-1">{filteredOrders.length} of {orders.length} orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">${stats.revenue.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{stats.confirmed}</p>
              <p className="text-xs text-gray-500">Confirmed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers, products..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none"
            data-testid="order-search-input"
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none min-w-[140px]" data-testid="status-filter">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none min-w-[140px]" data-testid="type-filter">
          <option value="all">All Types</option>
          <option value="dropship">Dropship</option>
          <option value="digital">Digital</option>
          <option value="custom">Custom</option>
          <option value="standard">Standard</option>
        </select>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none min-w-[140px]" data-testid="date-filter">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 3 Months</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Order ID</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr></thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No orders found</td></tr>
              ) : filteredOrders.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{o.order_id}</td>
                  <td className="py-3 px-4"><p className="font-medium">{o.customer_name || 'Guest'}</p><p className="text-xs text-gray-400">{o.customer_email}</p></td>
                  <td className="py-3 px-4">
                    <p>{o.product_name}</p>
                    {o.selected_design && <p className="text-xs text-purple-600">Style: {o.selected_design}</p>}
                    {o.size && <p className="text-xs text-gray-400">Size: {o.size}</p>}
                  </td>
                  <td className="py-3 px-4 font-semibold">${parseFloat(o.total).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      {o.is_dropship && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          <Truck className="w-3 h-3" />Dropship
                        </span>
                      )}
                      {o.is_digital && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          <Download className="w-3 h-3" />Digital
                        </span>
                      )}
                      {o.custom_order && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">Custom</span>
                      )}
                      {!o.is_dropship && !o.is_digital && !o.custom_order && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">Standard</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${o.status === 'confirmed' ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : o.status === 'shipped' ? 'bg-blue-100 text-blue-700' : o.status === 'delivered' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>{o.status}</span>
                    {o.cj_order_id && (
                      <p className="text-xs text-purple-600 mt-1">CJ: {o.cj_order_id}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 outline-none">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
