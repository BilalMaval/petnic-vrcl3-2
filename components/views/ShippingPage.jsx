"use client";
import React from 'react';
import Link from 'next/link';
import { Truck, RotateCcw, Clock, Globe } from 'lucide-react';

const ShippingPage = () => {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>Shipping & Return Policy</h1>
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Truck, title: 'Free Shipping', text: 'Free standard shipping on all orders over $50. Available within the continental US.' },
            { icon: Clock, title: 'Processing Time', text: 'Custom products: 3-5 business days. Pet care products: 1-2 business days. Rush available.' },
            { icon: Globe, title: 'International', text: 'We ship to 45+ countries. International orders typically arrive within 7-14 business days.' },
            { icon: RotateCcw, title: '30-Day Returns', text: 'Not satisfied? Return within 30 days for a full refund or free replacement.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100">
              <Icon className="w-8 h-8 text-[#F97316] mb-3" />
              <h2 className="text-lg font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h2>
              <p className="text-sm text-[#4A4A68] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{text}</p>
            </div>
          ))}
        </div>
        <div className="space-y-8">
          <div className="bg-white rounded-2xl p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Shipping Rates</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                <thead><tr className="border-b border-gray-100"><th className="text-left py-3 text-[#4A4A68] font-semibold">Method</th><th className="text-left py-3 text-[#4A4A68] font-semibold">Delivery</th><th className="text-left py-3 text-[#4A4A68] font-semibold">Cost</th></tr></thead>
                <tbody className="text-[#4A4A68]">
                  <tr className="border-b border-gray-50"><td className="py-3">Standard</td><td className="py-3">5-7 business days</td><td className="py-3">Free over $50 / $4.99</td></tr>
                  <tr className="border-b border-gray-50"><td className="py-3">Express</td><td className="py-3">2-3 business days</td><td className="py-3">$9.99</td></tr>
                  <tr className="border-b border-gray-50"><td className="py-3">Overnight</td><td className="py-3">1 business day</td><td className="py-3">$19.99</td></tr>
                  <tr><td className="py-3">International</td><td className="py-3">7-14 business days</td><td className="py-3">$14.99</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Return Policy</h2>
            <ul className="space-y-3 text-sm text-[#4A4A68]" style={{ fontFamily: 'Inter, sans-serif' }}>
              <li>All physical products can be returned within 30 days of delivery for a full refund.</li>
              <li>Items must be in original condition and packaging.</li>
              <li>Custom/personalized products: we'll redo the order for free if you're unsatisfied.</li>
              <li>Digital products: 14-day satisfaction guarantee with full refund.</li>
              <li>Return shipping is free for US orders. International returns: customer pays shipping.</li>
              <li>Refunds are processed within 5-7 business days after receiving the return.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ShippingPage;
