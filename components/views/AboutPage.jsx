"use client";
import React from 'react';
import Link from 'next/link';
import { Heart, Award, Users, Globe } from 'lucide-react';

const AboutPage = () => {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>About Petnic Studio</h1>
        <p className="text-[#4A4A68] text-lg leading-relaxed mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          Petnic Studio was founded by a team of passionate pet lovers, artists, and veterinarians who believe every pet deserves to be celebrated. We combine cutting-edge technology with artisan craftsmanship to create personalized products that capture the unique personality of your furry family member.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Heart, title: 'Our Mission', text: 'To help pet parents celebrate the bond with their companions through personalized, premium-quality products and expert pet care.' },
            { icon: Award, title: 'Quality Promise', text: 'Every product is crafted with museum-grade materials and backed by our 30-day satisfaction guarantee.' },
            { icon: Users, title: '150,000+ Customers', text: 'Trusted by pet parents in 45+ countries. Over 500,000 custom portraits created and counting.' },
            { icon: Globe, title: 'Sustainability', text: 'We use eco-friendly materials and packaging. Carbon-neutral shipping on every order.' },
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
            Our team includes professional pet portrait artists, certified veterinarians, experienced product designers, and dedicated customer support specialists. Together, we bring over 50 years of combined experience in pet care and custom product creation.
          </p>
        </div>
      </div>
    </main>
  );
};

export default AboutPage;
