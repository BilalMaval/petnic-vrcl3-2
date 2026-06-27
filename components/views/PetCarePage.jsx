"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Star, ShoppingCart, Leaf, Shield, Search, Loader2, Truck, ExternalLink } from 'lucide-react';

const PetCarePage = () => {
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
    // Fetch categories for pet care
    fetch('/api/collections')
      .then(r => r.json())
      .then(d => {
        const petcare = d.collections?.find(c => c.slug === 'petcare');
        if (petcare?.categories) {
          setCategories(petcare.categories);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('collection', 'petcare');
    if (activeCategory && activeCategory !== 'all') params.set('category', activeCategory);
    if (search) params.set('search', search);

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeCategory, search]);

  const discount = (p) => p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#FAFAFA]" data-testid="pet-care-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Pet Care Products</h1>
          <p className="text-lg text-[#4A4A68] max-w-2xl mx-auto">Veterinarian-approved grooming, health, wellness & nutrition products</p>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold"><Leaf className="w-4 h-4" /><span>Natural Ingredients</span></div>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold"><Shield className="w-4 h-4" /><span>Vet Approved</span></div>
          <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold"><Truck className="w-4 h-4" /><span>Fast Dropshipping</span></div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search pet care products..." 
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
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === 'all' ? 'bg-green-600 text-white' : 'bg-white text-[#4A4A68] border border-gray-200 hover:border-green-600'}`}
            data-testid="category-all"
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.slug)} 
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === cat.slug ? 'bg-green-600 text-white' : 'bg-white text-[#4A4A68] border border-gray-200 hover:border-green-600'}`}
              data-testid={`category-${cat.slug}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[#4A4A68]">No products found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(p => (
              <Link key={p.id} href={`/product/${p.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block" data-testid={`petcare-card-${p.slug}`}>
                <div className="relative overflow-hidden">
                  <img src={p.image_url} alt={p.name} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  {p.badge && <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>}
                  {discount(p) > 0 && <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discount(p)}%</span>}
                  {p.supplier_name && (
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-600">Dropship</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">{p.categories?.name || 'Pet Care'}</p>
                  <h3 className="text-lg font-bold text-[#1A1A2E] mb-2 line-clamp-1" style={{ fontFamily: 'Playfair Display, serif' }}>{p.name}</h3>
                  <p className="text-sm text-[#4A4A68] mb-4 line-clamp-2">{p.description}</p>
                  {p.ingredients && <p className="text-xs text-gray-500 mb-3 line-clamp-1"><strong>Key:</strong> {p.ingredients}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#F97316]">${p.price}</span>
                      {p.original_price && <span className="text-sm text-gray-400 line-through">${p.original_price}</span>}
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

export default PetCarePage;
