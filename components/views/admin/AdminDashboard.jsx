"use client";
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, FolderTree, ShoppingBag, LogOut, Menu, X, BarChart3, Users, Mail, FileText, Palette, Image, Truck, Layers, Ticket } from 'lucide-react';
import AdminLogin from './AdminLogin';
import DashboardHome from './DashboardHome';
import ProductsManager from './ProductsManager';
import CategoriesManager from './CategoriesManager';
import OrdersManager from './OrdersManager';
import BlogManager from './BlogManager';
import ReferenceDesignsManager from './ReferenceDesignsManager';
import DropshippingManager from './DropshippingManager';
import UsersManager from './UsersManager';
import VariationsManager from './VariationsManager';
import CouponsManager from './CouponsManager';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'variations', label: 'Variations', icon: Layers },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'designs', label: 'AI Designs', icon: Image },
  { id: 'dropship', label: 'Dropshipping', icon: Truck },
];

export default function AdminDashboard() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    const savedUser = localStorage.getItem('admin_user');
    if (saved && savedUser) {
      // Verify token is still valid by testing API
      fetch('/api/admin/stats', { 
        headers: { 'Authorization': `Bearer ${saved}` } 
      }).then(r => {
        if (r.ok) {
          setToken(saved);
          setUser(JSON.parse(savedUser));
        } else {
          // Token invalid, clear it
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      }).catch(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      });
    }
  }, []);

  const handleLogin = (t, u) => {
    setToken(t);
    setUser(u);
    localStorage.setItem('admin_token', t);
    localStorage.setItem('admin_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  if (!token) return <AdminLogin onLogin={handleLogin} />;

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardHome token={token} />;
      case 'products': return <ProductsManager token={token} />;
      case 'variations': return <VariationsManager token={token} />;
      case 'categories': return <CategoriesManager token={token} />;
      case 'orders': return <OrdersManager token={token} />;
      case 'coupons': return <CouponsManager token={token} />;
      case 'users': return <UsersManager token={token} />;
      case 'blog': return <BlogManager token={token} />;
      case 'designs': return <ReferenceDesignsManager token={token} />;
      case 'dropship': return <DropshippingManager token={token} />;
      default: return <DashboardHome token={token} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#1A1A2E] text-white transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>PETNIC STUDIO</h1>
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
        </div>
        <nav className="p-4 space-y-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[#F97316] text-white' : 'text-gray-300 hover:bg-white/10'}`} data-testid={`admin-tab-${tab.id}`}>
              <tab.icon className="w-5 h-5" />{tab.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-sm font-bold">{user?.name?.[0] || 'A'}</div>
            <div>
              <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="admin-logout"><LogOut className="w-4 h-4" />Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600"><Menu className="w-6 h-6" /></button>
          <h2 className="font-semibold text-[#1A1A2E]">{tabs.find(t => t.id === activeTab)?.label}</h2>
        </header>
        <main className="p-6 lg:p-8">{renderTab()}</main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
