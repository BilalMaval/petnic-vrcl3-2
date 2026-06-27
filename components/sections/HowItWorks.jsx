import React from 'react';
import Link from 'next/link';
import { Upload, Palette, Package } from 'lucide-react';
import { howItWorksSteps } from '@/config/static-data';

const iconMap = { Upload, Palette, Package };

const HowItWorks = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            How It Works
          </h2>
          <p className="text-[#4A4A68] text-lg max-w-xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Three simple steps to create your perfect custom pet product
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {howItWorksSteps.map((step, idx) => {
            const Icon = iconMap[step.icon];
            return (
              <Link key={step.id} href="/customize" className="text-center group relative block no-underline">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-orange-100 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-[#FFF0E0] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#F97316] transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-orange-200">
                    <Icon className="w-10 h-10 text-[#F97316] group-hover:text-white transition-colors duration-500" />
                  </div>
                  <span className="text-xs font-bold text-[#F97316] uppercase tracking-widest mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>Step {step.step}</span>
                  <h3 className="text-xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {step.title}
                  </h3>
                  <p className="text-[#4A4A68] text-sm leading-relaxed max-w-xs mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {step.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
