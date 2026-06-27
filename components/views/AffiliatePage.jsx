"use client";
import React from 'react';
import Link from 'next/link';
import { DollarSign, BarChart3, Users, Zap } from 'lucide-react';

const AffiliatePage = () => {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Affiliate Program</h1>
        <p className="text-[#4A4A68] text-lg mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>Earn commission by sharing Petnic Studio products with your audience. Perfect for pet bloggers, influencers, and pet care professionals.</p>
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            { icon: DollarSign, title: '15% Commission', text: 'Earn 15% on every sale you refer. No caps, no limits.' },
            { icon: BarChart3, title: 'Real-Time Dashboard', text: 'Track clicks, conversions, and earnings in your personal dashboard.' },
            { icon: Users, title: '90-Day Cookie', text: 'Extended 90-day cookie window ensures you get credit for your referrals.' },
            { icon: Zap, title: 'Monthly Payouts', text: 'Reliable monthly payments via PayPal or direct bank transfer.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100">
              <Icon className="w-8 h-8 text-[#F97316] mb-3" />
              <h2 className="text-lg font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h2>
              <p className="text-sm text-[#4A4A68]" style={{ fontFamily: 'Inter, sans-serif' }}>{text}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Ready to Start Earning?</h2>
          <p className="text-sm text-[#4A4A68] mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>Apply now and start earning within 24 hours.</p>
          <button className="px-8 py-3 bg-[#F97316] text-white rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>Apply to Affiliate Program</button>
        </div>
      </div>
    </main>
  );
};

export default AffiliatePage;
