"use client";
import React, { useState } from 'react';
import { Search, Package, RefreshCw, Plus, Check, AlertCircle, ExternalLink, Loader2, Truck } from 'lucide-react';

export default function DropshippingManager({ token }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [message, setMessage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch categories on mount
  React.useEffect(() => {
    fetch('/api/collections')
      .then(r => r.json())
      .then(d => {
        const petcare = d.collections?.find(c => c.slug === 'petcare');
        if (petcare?.categories) setCategories(petcare.categories);
      })
      .catch(() => {});
  }, []);

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cj-dropshipping?action=search&keyword=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.result && data.data?.list) {
        setSearchResults(data.data.list);
      } else if (data.error) {
        setMessage({ type: 'error', text: data.error });
        setSearchResults([]);
      } else {
        setSearchResults([]);
        setMessage({ type: 'info', text: 'No products found. Try different keywords.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to search products. Check API configuration.' });
    } finally {
      setLoading(false);
    }
  };

  const syncProduct = async (product) => {
    if (!selectedCategory) {
      setMessage({ type: 'error', text: 'Please select a category first' });
      return;
    }

    setSyncing(product.pid);
    setMessage(null);

    try {
      const response = await fetch('/api/cj-dropshipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'syncProduct',
          cjProductId: product.pid,
          categoryId: selectedCategory,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `Product "${product.productNameEn}" synced successfully!` });
        // Remove from search results
        setSearchResults(prev => prev.filter(p => p.pid !== product.pid));
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to sync product' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync product' });
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="dropshipping-manager">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>CJ Dropshipping</h1>
          <p className="text-sm text-gray-500 mt-1">Search and import products from CJ Dropshipping catalog</p>
        </div>
        <a 
          href="https://cjdropshipping.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
        >
          <ExternalLink className="w-4 h-4" />
          Open CJ Dashboard
        </a>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-purple-600" />
          Search CJ Catalog
        </h2>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchProducts()}
              placeholder="Search pet products (e.g., pet shampoo, dog toys, cat treats)"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              data-testid="cj-search-input"
            />
          </div>
          <button
            onClick={searchProducts}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            data-testid="cj-search-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Category Selection */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Import to category:</label>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            data-testid="cj-category-select"
          >
            <option value="">Select a category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' :
          message.type === 'error' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`} data-testid="cj-message">
          {message.type === 'success' ? <Check className="w-5 h-5" /> :
           message.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
           <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Search Results ({searchResults.length})
          </h2>
          
          <div className="grid gap-4">
            {searchResults.map(product => (
              <div 
                key={product.pid} 
                className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:border-purple-200 transition-colors"
                data-testid={`cj-product-${product.pid}`}
              >
                <img 
                  src={product.productImage} 
                  alt={product.productNameEn}
                  className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1A1A2E] truncate">{product.productNameEn}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="text-purple-600 font-semibold">${product.sellPrice}</span>
                    <span>SKU: {product.pid}</span>
                    {product.categoryName && <span>{product.categoryName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://cjdropshipping.com/product/${product.pid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                    title="View on CJ"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => syncProduct(product)}
                    disabled={syncing === product.pid || !selectedCategory}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                    data-testid={`cj-sync-${product.pid}`}
                  >
                    {syncing === product.pid ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Syncing...</>
                    ) : (
                      <><Plus className="w-4 h-4" />Import</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-purple-50 rounded-xl p-6">
        <h3 className="font-semibold text-purple-800 flex items-center gap-2 mb-2">
          <Truck className="w-5 h-5" />
          How CJ Dropshipping Works
        </h3>
        <ul className="text-sm text-purple-700 space-y-2">
          <li>1. Search and import products from CJ&apos;s catalog to your Pet Care collection</li>
          <li>2. When a customer orders a dropship product, the order is automatically forwarded to CJ</li>
          <li>3. CJ ships the product directly to your customer with tracking</li>
          <li>4. You earn the markup difference between your price and CJ&apos;s wholesale price</li>
        </ul>
        <p className="mt-4 text-xs text-purple-600">
          Note: To enable automatic order forwarding, add your CJ_ACCESS_TOKEN to environment variables.
        </p>
      </div>
    </div>
  );
}
