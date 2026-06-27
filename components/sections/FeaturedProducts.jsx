"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ShoppingCart, Heart } from 'lucide-react';

const ProductCard = ({ product }) => {
  const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;

  return (
    <Link href={`/product/${product.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-orange-100 transition-all duration-300 hover:-translate-y-1 block no-underline" data-testid={`product-card-${product.slug}`}>
      <div className="relative overflow-hidden">
        <img src={product.image_url} alt={product.name} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        {product.badge && <span className="absolute top-3 left-3 bg-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full">{product.badge}</span>}
        {discount > 0 && <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discount}%</span>}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        <button className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#F97316] hover:text-white text-gray-600" onClick={(e) => e.preventDefault()}><Heart className="w-4 h-4" /></button>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-1">{product.categories?.name || product.collections?.name || ''}</p>
        <h3 className="text-base font-bold text-[#1A1A2E] mb-2 line-clamp-1" style={{ fontFamily: 'Playfair Display, serif' }}>{product.name}</h3>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />)}</div>
          <span className="text-xs text-gray-500">({(product.review_count || 0).toLocaleString()})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#F97316]">${product.price}</span>
            {product.original_price && <span className="text-sm text-gray-400 line-through">${product.original_price}</span>}
          </div>
          <span className="flex items-center gap-1.5 bg-[#1A1A2E] text-white px-4 py-2 rounded-lg text-xs font-semibold"><ShoppingCart className="w-3.5 h-3.5" />View</span>
        </div>
      </div>
    </Link>
  );
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products?featured=true')
      .then(r => r.json())
      .then(d => setProducts(d.products?.slice(0, 8) || []))
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 bg-[#FAFAFA]" data-testid="featured-products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Bestselling Pet Products</h2>
            <p className="text-[#4A4A68] text-lg">Our most loved custom pet portraits & care essentials</p>
          </div>
          <Link href="/shop" className="mt-4 md:mt-0 text-[#F97316] font-semibold text-sm hover:underline flex items-center gap-1">View All Products <span className="ml-1">&rarr;</span></Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
