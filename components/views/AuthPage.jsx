"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot', 'reset-sent', 'verify-sent'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, action: mode === 'register' ? 'register' : 'login' }),
      });
      const data = await res.json();

      // Handle registration success - requires email verification
      if (mode === 'register' && data.requiresVerification) {
        setPendingVerificationEmail(data.email);
        setMode('verify-sent');
        setLoading(false);
        return;
      }

      // Handle login blocked due to unverified email
      if (res.status === 403 && data.requiresVerification) {
        setPendingVerificationEmail(data.email);
        setError(data.error);
        setLoading(false);
        return;
      }

      if (!res.ok) { 
        setError(data.error || 'Something went wrong'); 
        setLoading(false); 
        return; 
      }

      // Successful login
      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));
      router.push('/account');
    } catch {
      setError('Connection error');
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingVerificationEmail }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Verification email sent! Please check your inbox.');
      } else {
        setError(data.error || 'Failed to resend');
      }
    } catch {
      setError('Connection error');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();

      if (res.ok) {
        setMode('reset-sent');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Connection error');
    }
    setLoading(false);
  };

  // Verification email sent confirmation (after registration)
  if (mode === 'verify-sent') {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4" data-testid="auth-page">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-[#F97316]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Verify Your Email</h1>
          <p className="text-[#4A4A68] mb-4">
            We've sent a verification link to:
          </p>
          <p className="font-semibold text-[#1A1A2E] mb-6">{pendingVerificationEmail}</p>
          <p className="text-sm text-[#4A4A68] mb-6">
            Please click the link in the email to verify your account before logging in.
          </p>
          
          {success && <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="flex items-center justify-center gap-2 mx-auto text-[#F97316] font-semibold hover:underline mb-4"
            data-testid="resend-verification-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Resend Verification Email
          </button>
          
          <button
            onClick={() => { setMode('login'); setForm({ name: '', email: '', password: '' }); setPendingVerificationEmail(''); }}
            className="text-[#4A4A68] hover:text-[#F97316] flex items-center justify-center gap-2 mx-auto text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  // Reset password sent confirmation
  if (mode === 'reset-sent') {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4" data-testid="auth-page">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Check Your Email</h1>
          <p className="text-[#4A4A68] mb-6">
            If an account exists for <strong>{form.email}</strong>, we've sent password reset instructions.
          </p>
          <button
            onClick={() => { setMode('login'); setForm({ name: '', email: '', password: '' }); }}
            className="text-[#F97316] font-semibold hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  // Forgot password form
  if (mode === 'forgot') {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4" data-testid="auth-page">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <button
            onClick={() => setMode('login')}
            className="text-[#4A4A68] hover:text-[#F97316] flex items-center gap-1 text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </button>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Reset Password
            </h1>
            <p className="text-[#4A4A68]">Enter your email to receive reset instructions</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none"
                data-testid="forgot-email-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] text-white py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="forgot-submit-btn"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4" data-testid="auth-page">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-[#4A4A68]">{mode === 'login' ? 'Sign in to your account' : 'Join the PETNIC STUDIO community'}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4" data-testid="auth-error">
            {error}
            {pendingVerificationEmail && (
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="block mt-2 text-[#F97316] font-semibold hover:underline"
              >
                {loading ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}
        {success && <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" required placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" data-testid="auth-name-input" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" required placeholder="Email Address" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" data-testid="auth-email-input" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type={showPassword ? 'text' : 'password'} required placeholder="Password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" data-testid="auth-password-input" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
          </div>

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); }}
                className="text-sm text-[#F97316] hover:underline"
                data-testid="forgot-password-link"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-[#F97316] text-white py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-all disabled:opacity-50 flex items-center justify-center gap-2" data-testid="auth-submit-btn">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#4A4A68] mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); setPendingVerificationEmail(''); }} className="text-[#F97316] font-semibold hover:underline" data-testid="auth-toggle">
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </main>
  );
}
