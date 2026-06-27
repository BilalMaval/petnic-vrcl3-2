"use client";
import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, BadgeCheck } from 'lucide-react';
import { testimonials } from '@/config/static-data';

const Testimonials = () => {
  const [current, setCurrent] = useState(0);
  const itemsPerView = 3;
  const maxStart = Math.max(0, testimonials.length - itemsPerView);

  const next = () => setCurrent((prev) => Math.min(prev + 1, maxStart));
  const prev = () => setCurrent((prev) => Math.max(prev - 1, 0));

  return (
    <section className="py-20 bg-[#FFF8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              What Pet Parents Say
            </h2>
            <p className="text-[#4A4A68] text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
              Real reviews from verified pet-loving customers
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={prev}
              disabled={current === 0}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#F97316] hover:border-[#F97316] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              disabled={current === maxStart}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#F97316] hover:border-[#F97316] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${current * (100 / itemsPerView + 2)}%)` }}
          >
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300"
              >
                <Quote className="w-8 h-8 text-orange-200 mb-3" />
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= t.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-[#4A4A68] text-sm leading-relaxed mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A2E]" style={{ fontFamily: 'Inter, sans-serif' }}>{t.name}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>{t.location}</p>
                  </div>
                  {t.verified && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-300 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Purchased: {t.product}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
