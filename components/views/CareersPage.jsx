"use client";
import React from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, Clock } from 'lucide-react';

const openings = [
  { title: 'Senior Pet Portrait Artist', department: 'Creative', location: 'Remote', type: 'Full-time' },
  { title: 'Veterinary Content Writer', department: 'Content', location: 'Remote', type: 'Full-time' },
  { title: 'E-Commerce Product Manager', department: 'Product', location: 'Austin, TX', type: 'Full-time' },
  { title: 'Customer Success Specialist', department: 'Support', location: 'Remote', type: 'Full-time' },
  { title: 'Social Media Manager', department: 'Marketing', location: 'Remote', type: 'Full-time' },
];

const CareersPage = () => {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Join Our Pack</h1>
        <p className="text-[#4A4A68] text-lg mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>We're building the world's best platform for pet lovers. If you're passionate about pets and creating exceptional products, we'd love to hear from you.</p>
        <div className="space-y-4">
          {openings.map((job) => (
            <div key={job.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-orange-100 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>{job.title}</h2>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#4A4A68]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.department}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.type}</span>
                </div>
              </div>
              <button className="px-5 py-2.5 bg-[#F97316] text-white rounded-lg text-sm font-semibold hover:bg-[#EA6C10] transition-colors whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif' }}>Apply Now</button>
            </div>
          ))}
        </div>
        <div className="mt-12 bg-white rounded-xl p-8 border border-gray-100 text-center">
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Don't see the right role?</h2>
          <p className="text-sm text-[#4A4A68] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Send your resume to <a href="mailto:careers@petnicstudio.com" className="text-[#F97316] font-semibold hover:underline">careers@petnicstudio.com</a></p>
        </div>
      </div>
    </main>
  );
};

export default CareersPage;
