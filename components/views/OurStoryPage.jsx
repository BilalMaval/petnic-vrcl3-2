"use client";
import React from 'react';
import Link from 'next/link';

const OurStoryPage = () => {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Our Story</h1>
        <div className="space-y-6 text-[#4A4A68] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
          <p className="text-lg">Petnic Studio LLC was established in 2026 as an online creative and e-commerce business specializing in customized pet artwork and personalized pet products. Customers can upload a photograph of their pet, select an artistic style, and order the resulting design as a digital file or printed product.</p>
          <p>We're just getting started, and every order helps us grow. Our mission is simple: help pet parents celebrate the special bond they share with their pets through meaningful, personalized keepsakes.</p>
          <h2 className="text-xl font-bold text-[#1A1A2E] pt-4" style={{ fontFamily: 'Playfair Display, serif' }}>What Drives Us</h2>
          <p>Every product we create starts with love. We believe pets aren't just animals — they're family. And family deserves to be celebrated in the most beautiful, meaningful ways possible.</p>
        </div>
      </div>
    </main>
  );
};

export default OurStoryPage;
