"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Star, ArrowRight, Sparkles, Palette, Frame, Image as ImageIcon, Home, Shirt, Package } from 'lucide-react';

const categories = [
  { id: 'all', name: 'All', slug: 'all', icon: Sparkles },
  { id: 'wall-art', name: 'Wall Art', slug: 'wall-art', icon: Frame },
  { id: 'home-living', name: 'Home & Living', slug: 'home-living', icon: Home },
  { id: 'accessories', name: 'Accessories', slug: 'accessories', icon: Package },
  { id: 'apparel', name: 'Apparel', slug: 'apparel', icon: Shirt },
];

const PrintOnDemandPage = () => {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Get category from URL params - reactive to URL changes
  const categoryFromUrl = searchParams.get('category') || 'all';

  // Fetch products when category changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('collection', 'pod');
    if (categoryFromUrl && categoryFromUrl !== 'all') params.set('category', categoryFromUrl);
    if (search) params.set('search', search);

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [categoryFromUrl, search]);

  const discount = (p) => p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#FAFAFA]" data-testid="print-on-demand-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Print on Demand</h1>
          <p className="text-lg text-[#4A4A68] max-w-2xl mx-auto">Custom pet portraits printed on premium materials — canvas, framed art, posters & more</p>
        </div>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-sm text-[#4A4A68]">
            <Sparkles className="w-4 h-4 text-[#F97316]" />
            <span>AI-Enhanced Portraits</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#4A4A68]">
            <Frame className="w-4 h-4 text-[#F97316]" />
            <span>Museum-Quality Materials</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#4A4A68]">
            <Palette className="w-4 h-4 text-[#F97316]" />
            <span>50+ Art Styles</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 outline-none"
              data-testid="pod-search-input"
            />
          </div>
        </div>

        {/* Category Tabs - Use Link for proper navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = categoryFromUrl === cat.id || (categoryFromUrl === null && cat.id === 'all');
            const href = cat.id === 'all' ? '/print-on-demand' : `/print-on-demand?category=${cat.id}`;
            return (
              <Link
                key={cat.id}
                href={href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#F97316] text-white' 
                    : 'bg-white text-[#4A4A68] hover:bg-orange-50 hover:text-[#F97316] border border-gray-200'
                }`}
                data-testid={`category-${cat.id}`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </Link>
            );
          })}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link 
                key={product.id} 
                href={`/product/${product.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                data-testid={`product-card-${product.slug}`}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={product.image_url || '/placeholder-product.jpg'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {product.badge}
                    </span>
                  )}
                  {discount(product) > 0 && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{discount(product)}%
                    </span>
                  )}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-medium">
                    <Palette className="w-3 h-3 text-[#F97316]" />
                    Customizable
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-1">
                    {product.categories?.name || 'Print on Demand'}
                  </p>
                  <h3 className="font-bold text-[#1A1A2E] mb-2 group-hover:text-[#F97316] transition-colors line-clamp-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {product.name}
                  </h3>
                  <p className="text-sm text-[#4A4A68] mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-[#1A1A2E]">${product.price?.toFixed(2)}</span>
                      {product.original_price && (
                        <span className="text-sm text-gray-400 line-through">${product.original_price?.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating?.toFixed(1) || '4.8'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or category filter</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Create Your Custom Portrait</h2>
          <p className="text-orange-100 mb-6 max-w-xl mx-auto">Upload your pet photo and choose from 50+ artistic styles. AI-powered enhancement ensures stunning results every time.</p>
          <Link 
            href="/customize" 
            className="inline-flex items-center gap-2 bg-white text-[#F97316] px-8 py-3 rounded-xl font-bold hover:bg-orange-50 transition-colors"
            data-testid="customize-cta-btn"
          >
            Start Creating <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PrintOnDemandPage;
