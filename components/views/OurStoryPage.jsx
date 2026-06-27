"use client";
import React from 'react';
import Link from 'next/link';

const OurStoryPage = () => {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Our Story</h1>
        <div className="space-y-6 text-[#4A4A68] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
          <p className="text-lg">Petnic Studio began in 2020 when our founder lost her beloved Labrador, Max. Searching for a meaningful way to honor his memory, she discovered the world of custom pet portraits — but found the existing options lacking in quality, personalization, and heart.</p>
          <p>That experience sparked a vision: to create a platform where every pet parent could transform their cherished photos into museum-quality art, personalized products, and lasting keepsakes — all with the care and attention that our pets deserve.</p>
          <h2 className="text-xl font-bold text-[#1A1A2E] pt-4" style={{ fontFamily: 'Playfair Display, serif' }}>From Garage to Global</h2>
          <p>Starting from a small studio, we partnered with master artists and invested in AI-powered photo enhancement technology. Within our first year, we'd fulfilled over 10,000 orders and built a community of passionate pet parents.</p>
          <h2 className="text-xl font-bold text-[#1A1A2E] pt-4" style={{ fontFamily: 'Playfair Display, serif' }}>Where We Are Today</h2>
          <p>Today, Petnic Studio serves over 150,000 customers in 45+ countries. We've expanded beyond portraits into pet care products, digital downloads, and an exclusive Pet Owner Club — all driven by our original mission: to celebrate the incredible bond between pets and their people.</p>
          <h2 className="text-xl font-bold text-[#1A1A2E] pt-4" style={{ fontFamily: 'Playfair Display, serif' }}>What Drives Us</h2>
          <p>Every product we create starts with love. We believe pets aren't just animals — they're family. And family deserves to be celebrated in the most beautiful, meaningful ways possible.</p>
        </div>
      </div>
    </main>
  );
};

export default OurStoryPage;
