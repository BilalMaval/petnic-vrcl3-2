"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('loading');
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await fetch(`/api/payments/status/${sessionId}`);
      const data = await response.json();

      if (data.payment_status === 'paid') {
        setStatus('success');
        setOrderData(data);
        return;
      } else if (data.status === 'expired' || data.payment_status === 'failed') {
        setStatus('failed');
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
      } else {
        setStatus('error');
      }
    }
  };

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <Loader2 className="w-16 h-16 text-[#F97316] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Processing Your Order
          </h1>
          <p className="text-[#4A4A68]">Please wait while we confirm your payment...</p>
        </div>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Thank You for Your Order!
          </h1>
          <p className="text-[#4A4A68] mb-6">
            Your payment was successful. We've sent a confirmation email with your order details.
          </p>
          
          {orderData && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Order Total:</span>
                <span className="font-semibold">${(orderData.amount_total / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction ID:</span>
                <span className="font-mono text-xs">{sessionId?.slice(0, 20)}...</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center gap-2 bg-[#F97316] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors"
            >
              <Package className="w-4 h-4" /> View Orders
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-[#4A4A68] px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Error/Failed states
  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-12 h-12 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          {status === 'timeout' ? 'Order Processing' : 'Payment Issue'}
        </h1>
        <p className="text-[#4A4A68] mb-6">
          {status === 'timeout' 
            ? "Your payment is still being processed. Please check your email for confirmation."
            : "There was an issue with your payment. Please try again or contact support."}
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 bg-[#F97316] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors"
        >
          Return to Shop
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
      </main>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
