"use client";
import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const pressItems = [
  { outlet: 'Forbes', title: 'How Petnic Studio Is Revolutionizing the Pet Portrait Industry', date: 'June 2025' },
  { outlet: 'TechCrunch', title: 'AI-Powered Pet Portraits: The Startup Turning Pet Photos Into Art', date: 'May 2025' },
  { outlet: 'Pet Business Magazine', title: 'Top 10 Pet E-Commerce Brands to Watch in 2025', date: 'April 2025' },
  { outlet: 'The Dodo', title: 'This Company Turns Your Pet Photos Into Museum-Quality Art', date: 'March 2025' },
  { outlet: 'Entrepreneur', title: 'From Passion Project to $10M: The Petnic Studio Story', date: 'February 2025' },
];

const PressPage = () => {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Press & Media</h1>
        <p className="text-[#4A4A68] text-lg mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>Petnic Studio in the news. For media inquiries, contact <a href="mailto:press@petnicstudio.com" className="text-[#F97316] font-semibold hover:underline">press@petnicstudio.com</a></p>
        <div className="space-y-4">
          {pressItems.map((item) => (
            <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-orange-100 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>{item.outlet}</span>
                  <h2 className="text-base font-bold text-[#1A1A2E] mt-1" style={{ fontFamily: 'Playfair Display, serif' }}>{item.title}</h2>
                  <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{item.date}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default PressPage;
