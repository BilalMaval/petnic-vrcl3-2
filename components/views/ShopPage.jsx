"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, SlidersHorizontal, Star, ShoppingCart, Heart, X } from 'lucide-react';

// Category-specific SEO content
const categoryContent = {
  'all': {
    h1: 'Shop All Custom Pet Products',
    description: 'Discover our full collection of custom pet portraits, personalized products, digital downloads, and premium pet care essentials. Free shipping over $50.',
    intro: 'Browse over 200 personalized pet products crafted with love. From museum-quality canvas prints and framed art to custom mugs, blankets, and apparel — every piece is made to celebrate the unique bond between you and your furry friend. All products feature your pet\'s photo transformed into stunning artwork using our AI-enhanced portrait technology.'
  },
  'wall-art': {
    h1: 'Custom Pet Wall Art & Canvas Prints',
    description: 'Shop custom pet canvas prints, framed portraits & poster art. 45+ art styles from watercolor to oil painting. Free shipping over $50.',
    intro: 'Transform your pet\'s photo into museum-quality wall art. Choose from 45+ stunning art styles including watercolor, oil painting, pop art, royal portraits, and more. Each piece is printed on premium archival canvas with fade-resistant inks, stretched on solid wood frames, and ready to hang. Available in 8 sizes from 8x10" to 36x48".'
  },
  'apparel': {
    h1: 'Custom Pet Apparel & Accessories',
    description: 'Personalized pet t-shirts, hoodies, hats & accessories featuring your pet\'s portrait. Premium quality, unique designs.',
    intro: 'Wear your love for your pet with our custom apparel collection. Premium cotton t-shirts, cozy hoodies, embroidered hats, and stylish tote bags — all featuring your pet\'s custom portrait. Perfect for pet parents who want to show off their furry friends everywhere they go. Machine washable, pre-shrunk fabrics ensure lasting quality.'
  },
  'home-living': {
    h1: 'Personalized Pet Home & Living Products',
    description: 'Custom pet mugs, blankets, pillows & home decor. Make your home a tribute to your beloved pet.',
    intro: 'Fill your home with personalized pet products that celebrate your furry family member. From cozy fleece blankets and throw pillows to ceramic mugs and ornaments — each item features your pet\'s portrait in your chosen art style. Perfect for gifting or treating yourself to everyday items that bring joy.'
  },
  'accessories': {
    h1: 'Custom Pet Accessories & Gifts',
    description: 'Unique pet-themed accessories including phone cases, keychains, jewelry & more. Perfect gifts for pet lovers.',
    intro: 'Discover unique accessories that let you carry your pet\'s memory everywhere. Phone cases, keychains, jewelry, and car accessories featuring your pet\'s custom portrait. These make perfect gifts for pet lovers, memorial keepsakes, or everyday items that bring a smile to your face.'
  },
};

const ShopPage = ({ initialCategory, initialProducts, initialCategories }) => {
  const [products, setProducts] = useState(initialProducts || []);
  const [categories, setCategories] = useState(initialCategories || []);
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(false);
  const isFirstRun = useRef(true);

  // Get content for current category
  const content = categoryContent[activeCategory] || categoryContent['all'];

  // Hydrate categories list if not provided server-side.
  useEffect(() => {
    if ((initialCategories || []).length > 0) return;
    fetch('/api/collections')
      .then(r => r.json())
      .then(d => {
        const allCats = d.collections?.flatMap(c => c.categories?.map(cat => ({ ...cat, collectionName: c.name })) || []) || [];
        setCategories(allCats);
      })
      .catch(() => {});
  }, [initialCategories]);

  // Re-fetch products only when the user changes filters (skip the first run so
  // the SSR'd HTML stays intact for crawlers).
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== 'all') params.set('category', activeCategory);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeCategory, search, sort]);

  const discount = (p) => p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#FAFAFA] py-12" data-testid="shop-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dynamic H1 and intro based on category */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>{content.h1}</h1>
          <p className="text-lg text-[#4A4A68] max-w-3xl mx-auto mb-6">{content.description}</p>
        </div>
        
        {/* Category intro text for SEO */}
        <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-100">
          <p className="text-[#4A4A68] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{content.intro}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" data-testid="search-input" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" data-testid="sort-select">
            <option value="">Sort by</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setActiveCategory('all')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === 'all' ? 'bg-[#F97316] text-white' : 'bg-white text-[#4A4A68] border border-gray-200 hover:border-[#F97316]'}`}>All Products</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.slug)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === cat.slug ? 'bg-[#F97316] text-white' : 'bg-white text-[#4A4A68] border border-gray-200 hover:border-[#F97316]'}`}>{cat.name}</button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[#4A4A68]">No products found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(p => (
              <Link key={p.id} href={`/product/${p.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-orange-100 transition-all duration-300 hover:-translate-y-1 block" data-testid={`product-card-${p.slug}`}>
                <div className="relative overflow-hidden h-56">
                  <Image src={p.image_url} alt={p.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.badge && <span className="absolute top-3 left-3 bg-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>}
                  {discount(p) > 0 && <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discount(p)}%</span>}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-1">{p.categories?.name || ''}</p>
                  <h3 className="text-base font-bold text-[#1A1A2E] mb-2 line-clamp-1" style={{ fontFamily: 'Playfair Display, serif' }}>{p.name}</h3>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(p.rating) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />)}</div>
                    <span className="text-xs text-gray-500">({(p.review_count||0).toLocaleString()})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-[#F97316]">${p.price}</span>
                      {p.original_price && <span className="text-sm text-gray-400 line-through">${p.original_price}</span>}
                    </div>
                    <span className="flex items-center gap-1.5 bg-[#1A1A2E] text-white px-4 py-2 rounded-lg text-xs font-semibold"><ShoppingCart className="w-3.5 h-3.5" />View</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default ShopPage;
