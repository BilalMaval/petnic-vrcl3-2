"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    // Call the verification API
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Connection error. Please try again.');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4" data-testid="verify-email-page">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <Loader2 className="w-16 h-16 text-[#F97316] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Verifying Your Email
          </h1>
          <p className="text-[#4A4A68]">Please wait while we verify your email address...</p>
        </div>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4" data-testid="verify-email-page">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Email Verified!
          </h1>
          <p className="text-[#4A4A68] mb-6">{message}</p>
          <p className="text-[#4A4A68] mb-6">You can now sign in to your account and start exploring.</p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 bg-[#F97316] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors"
            data-testid="go-to-login-btn"
          >
            Sign In Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  // Error state
  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4" data-testid="verify-email-page">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Verification Failed
        </h1>
        <p className="text-[#4A4A68] mb-6">{message}</p>
        <p className="text-sm text-gray-500 mb-6">
          If you're having trouble, try signing in and requesting a new verification email.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 bg-[#F97316] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors"
        >
          Go to Sign In <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </main>
  );
}
