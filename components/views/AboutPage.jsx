"use client";
import React from 'react';
import Link from 'next/link';
import { Heart, Award, Sparkles, Lock } from 'lucide-react';

const AboutPage = () => {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>About Petnic Studio</h1>
        <p className="text-[#4A4A68] text-lg leading-relaxed mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          Petnic Studio LLC is an online customization and e-commerce business established in 2026. We transform customer-supplied pet photographs into personalized artwork that can be purchased digitally or printed on selected products through our production and fulfillment partners.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Heart, title: 'Our Mission', text: 'To help pet parents celebrate the bond with their companions through personalized, quality products.' },
            { icon: Award, title: 'Quality Promise', text: 'Every product is made to order and backed by our 30-day satisfaction guarantee.' },
            { icon: Sparkles, title: 'Made to Order', text: 'Each portrait and product is personalized to your pet — nothing is mass-produced or pre-made.' },
            { icon: Lock, title: 'Secure Checkout', text: 'Payments are processed securely through Stripe, and your information is never shared.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100">
              <Icon className="w-8 h-8 text-[#F97316] mb-3" />
              <h2 className="text-lg font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h2>
              <p className="text-sm text-[#4A4A68] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{text}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Our Team</h2>
          <p className="text-[#4A4A68] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            Our small team handles design, product development, and customer support, working with production and fulfillment partners to bring your pet's personality to life on every order.
          </p>
        </div>
      </div>
    </main>
  );
};

export default AboutPage;
