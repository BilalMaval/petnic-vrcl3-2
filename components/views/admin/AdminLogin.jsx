"use client";
import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, action: 'login' }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      if (data.user.role !== 'admin') { setError('Admin access required'); setLoading(false); return; }

      onLogin(data.token, data.user);
    } catch {
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4" data-testid="admin-login">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Admin Login</h1>
          <p className="text-sm text-gray-500">PETNIC STUDIO Dashboard</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4" data-testid="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" required placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" data-testid="admin-email-input" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" data-testid="admin-password-input" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#F97316] text-white py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-all disabled:opacity-50" data-testid="admin-login-btn">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
