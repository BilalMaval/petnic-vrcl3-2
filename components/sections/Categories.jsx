import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { categories } from '@/config/static-data';

const Categories = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            Shop by Category
          </h2>
          <p className="text-[#4A4A68] text-lg max-w-xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Explore our curated collections of custom pet products, care essentials & digital downloads
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.slug === 'digital-downloads' ? '/digital-downloads' : cat.slug === 'pet-care' ? '/pet-care' : `/shop/${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden h-72 block"
            >
              <img
                src={cat.image}
                alt={`${cat.name} - Browse ${cat.productCount}+ custom pet products`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-orange-300 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {cat.productCount} Products
                </span>
                <h3 className="text-xl font-bold text-white mt-1 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {cat.name}
                </h3>
                <p className="text-white/80 text-sm mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {cat.description}
                </p>
                <span className="inline-flex items-center gap-1 text-white text-sm font-semibold group-hover:text-[#F97316] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Shop Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
