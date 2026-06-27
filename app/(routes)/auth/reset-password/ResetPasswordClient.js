"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch {
      setError('Connection error');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Invalid Reset Link</h1>
        <p className="text-[#4A4A68] mb-6">This password reset link is invalid or has expired.</p>
        <Link href="/auth" className="text-[#F97316] font-semibold hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Password Reset Successful</h1>
        <p className="text-[#4A4A68] mb-6">Your password has been updated. You can now sign in with your new password.</p>
        <Link
          href="/auth"
          className="inline-block bg-[#F97316] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Set New Password
        </h1>
        <p className="text-[#4A4A68]">Choose a strong password for your account</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="New Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#F97316] text-white py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordClient() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
