"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Search, Filter, FolderTree } from 'lucide-react';

export default function CategoriesManager({ token }) {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [form, setForm] = useState({ name: '', description: '', collection_id: '', image_url: '', sort_order: '0' });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = () => {
    fetch('/api/admin/categories', { headers }).then(r => r.json()).then(d => setCategories(d.categories || []));
    fetch('/api/collections').then(r => r.json()).then(d => setCollections(d.collections || []));
  };

  useEffect(load, [token]);

  // Apply filters
  useEffect(() => {
    let filtered = [...categories];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (collectionFilter !== 'all') {
      filtered = filtered.filter(c => c.collection_id === collectionFilter);
    }
    
    setFilteredCategories(filtered);
  }, [categories, search, collectionFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { ...form, sort_order: parseInt(form.sort_order || '0') };
    if (editing) body.id = editing.id;
    const res = await fetch('/api/admin/categories', { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(body) });
    if (res.ok) { setShowForm(false); setEditing(null); setForm({ name: '', description: '', collection_id: '', image_url: '', sort_order: '0' }); load(); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Products in it will be uncategorized.')) return;
    await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE', headers });
    load();
  };

  const getCollectionColor = (collectionSlug) => {
    switch(collectionSlug) {
      case 'pod': return 'bg-orange-100 text-orange-700';
      case 'digital': return 'bg-blue-100 text-blue-700';
      case 'petcare': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div data-testid="admin-categories-manager">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Categories</h2>
          <p className="text-sm text-gray-500 mt-1">{filteredCategories.length} of {categories.length} categories</p>
        </div>
        <button onClick={() => { setForm({ name: '', description: '', collection_id: '', image_url: '', sort_order: '0' }); setEditing(null); setShowForm(true); }} className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#EA6C10]" data-testid="add-category-btn">
          <Plus className="w-4 h-4" />Add Category
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none"
            data-testid="category-search-input"
          />
        </div>
        <select
          value={collectionFilter}
          onChange={(e) => setCollectionFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl outline-none min-w-[180px]"
          data-testid="collection-filter"
        >
          <option value="all">All Collections</option>
          {collections.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <FolderTree className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No categories found</p>
          {search && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-[#1A1A2E]">{c.name}</h3>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${getCollectionColor(c.collections?.slug)}`}>
                    {c.collections?.name || 'Uncategorized'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setForm({ name: c.name, description: c.description || '', collection_id: c.collection_id, image_url: c.image_url || '', sort_order: c.sort_order?.toString() || '0' }); setEditing(c); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {c.description && <p className="text-sm text-gray-500 line-clamp-2">{c.description}</p>}
              {c.sort_order > 0 && <p className="text-xs text-gray-400 mt-2">Sort order: {c.sort_order}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editing ? 'Edit' : 'Add'} Category</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F97316]" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Collection *</label>
                <select required value={form.collection_id} onChange={e => setForm(f => ({...f, collection_id: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none">
                  <option value="">Select...</option>
                  {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Description</label><textarea rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Sort Order</label><input type="number" value={form.sort_order} onChange={e => setForm(f => ({...f, sort_order: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#F97316] text-white rounded-lg text-sm font-semibold">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
