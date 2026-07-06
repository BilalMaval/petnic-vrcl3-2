"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Star, ShoppingCart, Download, FileText, Search, Loader2 } from 'lucide-react';

const DigitalDownloadsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) setActiveCategory(categoryParam);
  }, [searchParams]);

  useEffect(() => {
    // Fetch categories for digital downloads
    fetch('/api/collections')
      .then(r => r.json())
      .then(d => {
        const digital = d.collections?.find(c => c.slug === 'digital');
        if (digital?.categories) {
          setCategories(digital.categories);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('collection', 'digital');
    if (activeCategory && activeCategory !== 'all') params.set('category', activeCategory);
    if (search) params.set('search', search);

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeCategory, search]);

  const discount = (p) => p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#FAFAFA]" data-testid="digital-downloads-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Digital Downloads</h1>
          <p className="text-lg text-[#4A4A68] max-w-2xl mx-auto">Premium digital resources for pet lovers — instant access after purchase</p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search downloads..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" 
              data-testid="search-input" 
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button 
            onClick={() => setActiveCategory('all')} 
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === 'all' ? 'bg-[#F97316] text-white' : 'bg-white text-[#4A4A68] border border-gray-200 hover:border-[#F97316]'}`}
            data-testid="category-all"
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.slug)} 
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === cat.slug ? 'bg-[#F97316] text-white' : 'bg-white text-[#4A4A68] border border-gray-200 hover:border-[#F97316]'}`}
              data-testid={`category-${cat.slug}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[#4A4A68]">No products found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(p => (
              <Link key={p.id} href={`/product/${p.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block" data-testid={`digital-card-${p.slug}`}>
                <div className="relative overflow-hidden h-56">
                  <Image src={p.image_url} alt={p.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.badge && <span className="absolute top-3 left-3 bg-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>}
                  {discount(p) > 0 && <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discount(p)}%</span>}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-[#F97316]" />
                    <span className="text-xs font-semibold">{p.is_free ? 'Free Download' : 'Instant Download'}</span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-2">{p.categories?.name || 'Digital'}</p>
                  <h3 className="text-lg font-bold text-[#1A1A2E] mb-2 line-clamp-1" style={{ fontFamily: 'Playfair Display, serif' }}>{p.name}</h3>
                  <p className="text-sm text-[#4A4A68] mb-4 line-clamp-2">{p.description}</p>
                  {(p.file_format || p.file_size) && (
                    <div className="flex gap-3 mb-4 text-xs text-gray-500">
                      {p.file_format && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{p.file_format}</span>}
                      {p.file_size && <span>{p.file_size}</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      {p.is_free ? (
                        <span className="text-2xl font-bold text-green-600">FREE</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-[#F97316]">${p.price}</span>
                          {p.original_price && <span className="text-sm text-gray-400 line-through">${p.original_price}</span>}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(p.rating) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />)}</div>
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

export default DigitalDownloadsPage;
