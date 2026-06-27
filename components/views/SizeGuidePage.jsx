"use client";
import React from 'react';
import Link from 'next/link';

const sizes = {
  'Canvas Prints': [
    { size: '12" x 16"', cm: '30 x 40 cm', best: 'Small spaces, desks' },
    { size: '16" x 20"', cm: '40 x 50 cm', best: 'Bedrooms, hallways' },
    { size: '20" x 24"', cm: '50 x 60 cm', best: 'Living rooms' },
    { size: '24" x 36"', cm: '60 x 90 cm', best: 'Feature walls' },
  ],
  'Apparel': [
    { size: 'S', chest: '34-36"', length: '27"' },
    { size: 'M', chest: '38-40"', length: '28"' },
    { size: 'L', chest: '42-44"', length: '29"' },
    { size: 'XL', chest: '46-48"', length: '30"' },
    { size: '2XL', chest: '50-52"', length: '31"' },
  ],
  'Blankets': [
    { size: '50" x 60"', cm: '127 x 152 cm', best: 'Individual / throw' },
    { size: '60" x 80"', cm: '152 x 203 cm', best: 'Queen bed / sharing' },
  ],
  'Pillows': [
    { size: '16" x 16"', cm: '40 x 40 cm', best: 'Accent pillow' },
    { size: '18" x 18"', cm: '45 x 45 cm', best: 'Standard couch pillow' },
    { size: '20" x 20"', cm: '50 x 50 cm', best: 'Floor or large sofa' },
  ],
};

const SizeGuidePage = () => {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Size Guide</h1>
        <p className="text-[#4A4A68] text-lg mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>Find the perfect size for every product. All measurements are approximate.</p>
        <div className="space-y-8">
          {Object.entries(sizes).map(([category, items]) => (
            <div key={category} className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>{category}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <thead>
                    <tr className="border-b border-gray-100">
                      {Object.keys(items[0]).map((key) => (
                        <th key={key} className="text-left py-3 text-[#4A4A68] font-semibold capitalize">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-[#4A4A68]">
                    {items.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="py-3">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default SizeGuidePage;
