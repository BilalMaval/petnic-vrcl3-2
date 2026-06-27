"use client";
import React from 'react';
import Link from 'next/link';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-16 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Checkout Cancelled
        </h1>
        <p className="text-[#4A4A68] mb-6">
          Your order has been cancelled. No charges were made. Your cart items are still saved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/cart"
            className="inline-flex items-center justify-center gap-2 bg-[#F97316] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors"
          >
            <ShoppingCart className="w-4 h-4" /> Return to Cart
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-[#4A4A68] px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
