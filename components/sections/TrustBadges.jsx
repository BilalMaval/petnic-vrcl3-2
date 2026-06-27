import React from 'react';
import { Truck, ShieldCheck, Award, Lock } from 'lucide-react';
import { trustBadges } from '@/config/static-data';

const iconMap = {
  Truck,
  ShieldCheck,
  Award,
  Lock,
};

const TrustBadges = () => {
  return (
    <section className="bg-white border-y border-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustBadges.map((badge) => {
            const Icon = iconMap[badge.icon];
            return (
              <div key={badge.id} className="flex items-center gap-3 justify-center group">
                <div className="w-11 h-11 bg-[#FFF0E0] rounded-full flex items-center justify-center group-hover:bg-[#F97316] transition-colors duration-300">
                  <Icon className="w-5 h-5 text-[#F97316] group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A2E]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {badge.title}
                  </p>
                  <p className="text-xs text-[#4A4A68]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {badge.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
