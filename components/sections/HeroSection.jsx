import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, Play } from 'lucide-react';
import { heroImages, stats } from '@/config/static-data';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF0E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-12 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-100 text-[#F97316] px-4 py-2 rounded-full text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
              <Star className="w-4 h-4 fill-current" />
              Rated #1 Custom Pet Portrait Studio — 48,000+ 5-Star Reviews
            </div>

            {/* Heading - H1 with primary keyword */}
            <h1 className="text-[#1A1A2E] leading-[1.1]" style={{ fontFamily: 'Playfair Display, serif' }}>
              <span className="text-4xl sm:text-5xl lg:text-6xl font-bold block">
                Custom Pet Portraits
              </span>
              <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F97316] block mt-2 italic">
                — Personalized Art for Every Furry Friend
              </span>
            </h1>

            {/* Description */}
            <p className="text-[#4A4A68] text-lg leading-relaxed max-w-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
              Create personalized, museum-quality products featuring your furry friend.
              From custom canvas prints to pet care essentials — celebrate your pet in style
              with <strong>50+ artistic styles</strong> and <strong>200+ premium products</strong>.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/customize"
                className="inline-flex items-center gap-2 bg-[#F97316] text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-[#EA6C10] transition-all hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Start Creating Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 border-2 border-[#F97316] text-[#F97316] px-8 py-4 rounded-xl font-semibold text-base hover:bg-[#F97316] hover:text-white transition-all hover:-translate-y-0.5"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Browse Gallery
              </Link>
            </div>

            {/* E-E-A-T Trust Signals */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex -space-x-3">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    {['JW','MR','AK','DL','SM'][i-1]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-sm font-semibold text-[#1A1A2E] ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>4.9/5</span>
                </div>
                <p className="text-xs text-[#4A4A68]" style={{ fontFamily: 'Inter, sans-serif' }}>From 48,000+ verified reviews</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[500px] lg:h-[580px]">
              <Image
                src={heroImages.main}
                alt="Custom pet portrait - adorable dogs transformed into stunning personalized artwork by Petnic Studio"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600 fill-current" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]" style={{ fontFamily: 'Inter, sans-serif' }}>See it in action</p>
                <p className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>Watch 60-sec demo</p>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-2 -right-2 bg-white rounded-2xl shadow-xl px-4 py-3">
              <p className="text-2xl font-bold text-[#F97316]" style={{ fontFamily: 'Playfair Display, serif' }}>500K+</p>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Portraits Created</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-orange-100">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>{stat.value}</p>
              <p className="text-sm text-[#4A4A68] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
