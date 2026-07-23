import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&q=80"
          alt="Happy pets - Create custom pet portraits at Petnic Studio"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#1A1A2E]/80" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          Ready to Create Something Special?
        </h2>
        <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
          Join pet parents who've transformed their pet photos into beautiful, lasting keepsakes.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/customize"
            className="inline-flex items-center gap-2 bg-white text-[#F97316] px-8 py-4 rounded-xl font-semibold text-base hover:bg-orange-50 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Start Your Design Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-white hover:text-[#1A1A2E] transition-all hover:-translate-y-0.5"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Explore Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
