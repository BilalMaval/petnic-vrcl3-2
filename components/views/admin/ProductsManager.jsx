"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Search, Grid, List, Package, Download, Truck, Star, Eye, Image as ImageIcon } from 'lucide-react';

const COLLECTIONS = [
  { slug: 'pod', name: 'Print on Demand' },
  { slug: 'digital', name: 'Digital Downloads' },
  { slug: 'petcare', name: 'Pet Care' },
];

export default function ProductsManager({ token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [form, setForm] = useState({
    name: '', description: '', price: '', original_price: '', image_url: '', badge: '',
    rating: '0', review_count: '0', collection_id: '', category_id: '', in_stock: true,
    featured: false, customizable: false, file_format: '', file_size: '', ingredients: '',
    weight: '', download_file_url: '', is_free: false, supplier_sku: '', supplier_name: '', supplier_url: '',
    gallery_urls: []
  });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = () => {
    fetch('/api/admin/products' + (filter ? `?collection=${filter}` : ''), { headers }).then(r => r.json()).then(d => setProducts(d.products || []));
    fetch('/api/admin/categories', { headers }).then(r => r.json()).then(d => setCategories(d.categories || []));
    fetch('/api/collections').then(r => r.json()).then(d => setCollections(d.collections || []));
  };

  useEffect(load, [token, filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      ...form,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      rating: parseFloat(form.rating || '0'),
      review_count: parseInt(form.review_count || '0')
    };
    if (editing) body.id = editing.id;

    const res = await fetch('/api/admin/products', { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(body) });
    if (res.ok) { setShowForm(false); setEditing(null); resetForm(); load(); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE', headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to delete product.');
      return;
    }
    load();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    const data = await res.json();
    if (data.url) setForm(f => ({ ...f, image_url: data.url }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    const data = await res.json();
    if (data.url) setForm(f => ({ ...f, download_file_url: data.url }));
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    const data = await res.json();
    if (data.url) setForm(f => ({ ...f, gallery_urls: [...(f.gallery_urls || []), data.url] }));
  };

  const removeGalleryImage = (index) => {
    setForm(f => ({ ...f, gallery_urls: f.gallery_urls.filter((_, i) => i !== index) }));
  };

  const resetForm = () => setForm({
    name: '', description: '', price: '', original_price: '', image_url: '', badge: '',
    rating: '0', review_count: '0', collection_id: '', category_id: '', in_stock: true,
    featured: false, customizable: false, file_format: '', file_size: '', ingredients: '',
    weight: '', download_file_url: '', is_free: false, supplier_sku: '', supplier_name: '', supplier_url: '',
    gallery_urls: []
  });

  const startEdit = (p) => {
    setForm({
      name: p.name, description: p.description || '', price: p.price.toString(),
      original_price: p.original_price?.toString() || '', image_url: p.image_url || '',
      badge: p.badge || '', rating: p.rating?.toString() || '0', review_count: p.review_count?.toString() || '0',
      collection_id: p.collection_id, category_id: p.category_id || '', in_stock: p.in_stock,
      featured: p.featured, customizable: p.customizable, file_format: p.file_format || '',
      file_size: p.file_size || '', ingredients: p.ingredients || '', weight: p.weight || '',
      download_file_url: p.download_file_url || '', is_free: p.is_free || false,
      supplier_sku: p.supplier_sku || '', supplier_name: p.supplier_name || '', supplier_url: p.supplier_url || '',
      gallery_urls: p.gallery_urls || []
    });
    setEditing(p);
    setShowForm(true);
  };

  const currentCollection = collections.find(c => c.id === form.collection_id);
  const filteredProducts = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));
  const discount = (p) => p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0;

  return (
    <div data-testid="admin-products-manager">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Products</h2>
        <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }} className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#EA6C10] transition-colors" data-testid="add-product-btn">
          <Plus className="w-4 h-4" />Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#F97316]" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none">
          <option value="">All Collections</option>
          {COLLECTIONS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg ${viewMode === 'grid' ? 'bg-[#F97316] text-white' : 'bg-white text-gray-400 border border-gray-200'}`}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg ${viewMode === 'list' ? 'bg-[#F97316] text-white' : 'bg-white text-gray-400 border border-gray-200'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative h-44 bg-gray-100">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-300" /></div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {p.badge && <span className="bg-[#F97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{p.badge}</span>}
                  {p.featured && <span className="bg-yellow-400 text-[#1A1A2E] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" />Featured</span>}
                </div>
                {discount(p) > 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount(p)}%</span>}
                {/* Collection indicator */}
                <div className="absolute bottom-2 left-2">
                  {p.collections?.slug === 'digital' && <span className="bg-blue-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Download className="w-3 h-3" />Digital</span>}
                  {p.collections?.slug === 'petcare' && p.supplier_name && <span className="bg-purple-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Truck className="w-3 h-3" />Dropship</span>}
                  {p.collections?.slug === 'pod' && <span className="bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Package className="w-3 h-3" />POD</span>}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-[10px] text-[#F97316] font-semibold uppercase">{p.collections?.name}</p>
                    <p className="text-[10px] text-gray-400">{p.categories?.name}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.in_stock ? 'In Stock' : 'Out'}
                  </span>
                </div>
                <h3 className="font-bold text-[#1A1A2E] text-sm line-clamp-2 mb-2">{p.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= Math.round(p.rating) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />)}
                  <span className="text-[10px] text-gray-400">({p.review_count || 0})</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-[#F97316]">${p.price}</span>
                    {p.original_price && <span className="text-xs text-gray-400 line-through">${p.original_price}</span>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(p)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Collection</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr></thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>}
                        <div><p className="font-medium text-[#1A1A2E] line-clamp-1">{p.name}</p>{p.badge && <span className="text-xs text-[#F97316]">{p.badge}</span>}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{p.collections?.name || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{p.categories?.name || '-'}</td>
                    <td className="py-3 px-4 font-semibold">${p.price}{p.original_price && <span className="text-xs text-gray-400 line-through ml-1">${p.original_price}</span>}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.in_stock ? 'In Stock' : 'Out of Stock'}</span>
                      {p.featured && <span className="ml-1 px-2 py-1 rounded-full text-xs font-medium bg-[#FFF0E0] text-[#F97316]">Featured</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => startEdit(p)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && <p className="text-center py-8 text-gray-500">No products found</p>}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1A1A2E]">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F97316]" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Collection *</label>
                  <select required value={form.collection_id} onChange={e => setForm(f => ({...f, collection_id: e.target.value, category_id: ''}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none">
                    <option value="">Select...</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none">
                    <option value="">Select...</option>
                    {categories.filter(c => !form.collection_id || c.collection_id === form.collection_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Price *</label><input required type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F97316]" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Original Price</label><input type="number" step="0.01" value={form.original_price} onChange={e => setForm(f => ({...f, original_price: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Description</label><textarea rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F97316]" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Badge</label><input value={form.badge} onChange={e => setForm(f => ({...f, badge: e.target.value}))} placeholder="e.g. Best Seller, New" className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Product Image</label>
                  <div className="flex gap-2">
                    <input value={form.image_url} onChange={e => setForm(f => ({...f, image_url: e.target.value}))} placeholder="URL or upload" className="flex-1 p-3 border border-gray-200 rounded-lg outline-none text-sm" />
                    <label className="flex items-center gap-1 px-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 text-sm"><Upload className="w-4 h-4" /><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
                  </div>
                </div>

                {/* Digital Downloads fields */}
                {currentCollection?.slug === 'digital' && (
                  <>
                    <div><label className="text-sm font-medium text-gray-700 mb-1 block">File Format</label><input value={form.file_format} onChange={e => setForm(f => ({...f, file_format: e.target.value}))} placeholder="PSD, PDF, ZIP" className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                    <div><label className="text-sm font-medium text-gray-700 mb-1 block">File Size</label><input value={form.file_size} onChange={e => setForm(f => ({...f, file_size: e.target.value}))} placeholder="2.4 GB" className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                    <div className="col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Downloadable File</label>
                      <div className="flex gap-2">
                        <input value={form.download_file_url} onChange={e => setForm(f => ({...f, download_file_url: e.target.value}))} placeholder="Upload or paste URL" className="flex-1 p-3 border border-gray-200 rounded-lg outline-none text-sm" />
                        <label className="flex items-center gap-1 px-3 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 text-sm"><Upload className="w-4 h-4" /><span>Upload</span><input type="file" onChange={handleFileUpload} className="hidden" /></label>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_free} onChange={e => setForm(f => ({...f, is_free: e.target.checked}))} className="rounded" />Free Download (no payment required)</label>
                    </div>
                    {/* Gallery Images for Digital Downloads */}
                    <div className="col-span-2 bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" />Product Gallery Images</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(form.gallery_urls || []).map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`Gallery ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border-2 border-blue-200" />
                            <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <label className="w-20 h-20 border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-100 transition-colors">
                          <Plus className="w-5 h-5 text-blue-500" />
                          <span className="text-[10px] text-blue-500 mt-1">Add</span>
                          <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                        </label>
                      </div>
                      <p className="text-xs text-blue-600">Add multiple images to showcase your digital product from different angles</p>
                    </div>
                  </>
                )}

                {/* Print on Demand fields - Gallery */}
                {currentCollection?.slug === 'pod' && (
                  <div className="col-span-2 bg-orange-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" />Product Gallery Images</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(form.gallery_urls || []).map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img src={url} alt={`Gallery ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border-2 border-orange-200" />
                          <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                      <label className="w-20 h-20 border-2 border-dashed border-orange-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-100 transition-colors">
                        <Plus className="w-5 h-5 text-orange-500" />
                        <span className="text-[10px] text-orange-500 mt-1">Add</span>
                        <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                      </label>
                    </div>
                    <p className="text-xs text-orange-600">Add multiple images showing different angles, sizes, or variations of your print product</p>
                  </div>
                )}

                {/* Pet Care / Dropshipping fields */}
                {currentCollection?.slug === 'petcare' && (
                  <>
                    <div><label className="text-sm font-medium text-gray-700 mb-1 block">Ingredients</label><input value={form.ingredients} onChange={e => setForm(f => ({...f, ingredients: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                    <div><label className="text-sm font-medium text-gray-700 mb-1 block">Weight/Size</label><input value={form.weight} onChange={e => setForm(f => ({...f, weight: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                    {/* Gallery Images for Pet Care */}
                    <div className="col-span-2 bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" />Product Gallery Images</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(form.gallery_urls || []).map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`Gallery ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border-2 border-green-200" />
                            <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <label className="w-20 h-20 border-2 border-dashed border-green-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-100 transition-colors">
                          <Plus className="w-5 h-5 text-green-500" />
                          <span className="text-[10px] text-green-500 mt-1">Add</span>
                          <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                        </label>
                      </div>
                      <p className="text-xs text-green-600">Add multiple images to showcase your pet care product</p>
                    </div>
                    <div className="col-span-2 bg-purple-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2"><Truck className="w-4 h-4" />Dropshipping (CJ Dropshipping)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-medium text-purple-700 mb-1 block">Supplier SKU</label><input value={form.supplier_sku} onChange={e => setForm(f => ({...f, supplier_sku: e.target.value}))} placeholder="CJ SKU code" className="w-full p-2 border border-purple-200 rounded-lg outline-none text-sm bg-white" /></div>
                        <div><label className="text-xs font-medium text-purple-700 mb-1 block">Supplier Name</label><input value={form.supplier_name} onChange={e => setForm(f => ({...f, supplier_name: e.target.value}))} placeholder="CJ Dropshipping" className="w-full p-2 border border-purple-200 rounded-lg outline-none text-sm bg-white" /></div>
                        <div className="col-span-2"><label className="text-xs font-medium text-purple-700 mb-1 block">Supplier URL</label><input value={form.supplier_url} onChange={e => setForm(f => ({...f, supplier_url: e.target.value}))} placeholder="https://cjdropshipping.com/product/..." className="w-full p-2 border border-purple-200 rounded-lg outline-none text-sm bg-white" /></div>
                      </div>
                    </div>
                  </>
                )}

                {/* POD fields */}
                {currentCollection?.slug === 'pod' && (
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.customizable} onChange={e => setForm(f => ({...f, customizable: e.target.checked}))} className="rounded" />Customizable (Allow customer uploads)</label>
                  </div>
                )}

                <div className="col-span-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.in_stock} onChange={e => setForm(f => ({...f, in_stock: e.target.checked}))} className="rounded" />In Stock</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({...f, featured: e.target.checked}))} className="rounded" />Featured</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#F97316] text-white rounded-lg text-sm font-semibold hover:bg-[#EA6C10]">{editing ? 'Update' : 'Create'} Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
