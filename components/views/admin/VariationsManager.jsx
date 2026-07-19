"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Search, Layers, Tag, FolderTree, Package, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

const INPUT_TYPE_LABELS = {
  select: 'Dropdown',
  swatch: 'Color Swatch',
  button: 'Button Style',
};

const emptyOption = () => ({ label: '', value: '', price_addition: '0', swatch_color: '#F97316', image_url: '', is_default: false });

const emptyForm = () => ({
  name: '',
  input_type: 'select',
  scope: 'global',
  category_ids: [],
  is_required: false,
  is_active: true,
  sort_order: '0',
  options: [emptyOption()],
  product_ids: [],
});

export default function VariationsManager({ token }) {
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [form, setForm] = useState(emptyForm());
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = () => {
    fetch('/api/admin/variations', { headers }).then(r => r.json()).then(d => setGroups(d.groups || []));
    fetch('/api/admin/categories', { headers }).then(r => r.json()).then(d => setCategories(d.categories || []));
    fetch('/api/admin/products', { headers }).then(r => r.json()).then(d => setProducts(d.products || []));
  };

  useEffect(load, [token]);

  const filteredGroups = useMemo(() => {
    let list = [...groups];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(q));
    }
    if (scopeFilter !== 'all') list = list.filter(g => g.scope === scopeFilter);
    return list;
  }, [groups, search, scopeFilter]);

  const productsInFilter = useMemo(() => {
    let list = [...products];
    if (productCategoryFilter !== 'all') list = list.filter(p => p.category_id === productCategoryFilter);
    if (productSearch) {
      const q = productSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, productCategoryFilter, productSearch]);

  const openCreate = () => {
    setForm(emptyForm());
    setEditing(null);
    setError('');
    setProductSearch('');
    setProductCategoryFilter('all');
    setShowForm(true);
  };

  const openEdit = (g) => {
    setForm({
      name: g.name,
      input_type: g.input_type,
      scope: g.scope,
      category_ids: (g.category_ids && g.category_ids.length ? g.category_ids : (g.category_id ? [g.category_id] : [])),
      is_required: !!g.is_required,
      is_active: g.is_active !== false,
      sort_order: String(g.sort_order ?? 0),
      options: (g.variation_options || []).length
        ? g.variation_options.map(o => ({
            label: o.label,
            value: o.value || o.label,
            price_addition: String(o.price_addition ?? 0),
            swatch_color: o.swatch_color || '#F97316',
            image_url: o.image_url || '',
            is_default: !!o.is_default,
          }))
        : [emptyOption()],
      product_ids: (g.products || []).map(p => p.id),
    });
    setEditing(g);
    setError('');
    setProductSearch('');
    setProductCategoryFilter('all');
    setShowForm(true);
  };

  const updateOption = (idx, field, value) => {
    setForm(f => ({
      ...f,
      options: f.options.map((o, i) => (i === idx ? { ...o, [field]: value } : o)),
    }));
  };

  const setDefaultOption = (idx) => {
    setForm(f => ({
      ...f,
      options: f.options.map((o, i) => ({ ...o, is_default: i === idx })),
    }));
  };

  const addOption = () => setForm(f => ({ ...f, options: [...f.options, emptyOption()] }));
  const removeOption = (idx) => setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  const moveOption = (idx, dir) => {
    setForm(f => {
      const next = [...f.options];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return f;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...f, options: next };
    });
  };

  const toggleProduct = (id) => {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(id)
        ? f.product_ids.filter(pid => pid !== id)
        : [...f.product_ids, id],
    }));
  };

  const toggleCategory = (id) => {
    setForm(f => ({
      ...f,
      category_ids: f.category_ids.includes(id)
        ? f.category_ids.filter(cid => cid !== id)
        : [...f.category_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOptions = form.options
      .map(o => ({ ...o, label: o.label.trim() }))
      .filter(o => o.label);
    if (cleanOptions.length === 0) {
      setError('Add at least one option (e.g. "Small", "Red", "Canvas Frame").');
      return;
    }
    if (form.scope === 'category' && form.category_ids.length === 0) {
      setError('Choose at least one category for a category-scoped variation.');
      return;
    }
    if (form.scope === 'product' && form.product_ids.length === 0) {
      setError('Select at least one product for a product-scoped variation.');
      return;
    }

    const body = {
      name: form.name.trim(),
      input_type: form.input_type,
      scope: form.scope,
      is_required: form.is_required,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order || '0'),
      options: cleanOptions,
      product_ids: form.scope === 'product' ? form.product_ids : [],
      category_ids: form.scope === 'category' ? form.category_ids : [],
    };
    if (editing) body.id = editing.id;

    setSaving(true);
    const res = await fetch('/api/admin/variations', {
      method: editing ? 'PUT' : 'POST',
      headers,
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      setShowForm(false);
      setEditing(null);
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to save variation group.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this variation group? This removes it from every product it is assigned to.')) return;
    const res = await fetch(`/api/admin/variations?id=${id}`, { method: 'DELETE', headers });
    if (res.ok) load();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to delete variation group.');
    }
  };

  const scopeBadge = (g) => {
    if (g.scope === 'global') {
      return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700"><Sparkles className="w-3 h-3" />All Categories</span>;
    }
    if (g.scope === 'category') {
      const names = (g.categories || []).map(c => c.name);
      const label = names.length === 0 ? 'Category' : names.length === 1 ? names[0] : `${names.length} categories`;
      return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700" title={names.join(', ')}><FolderTree className="w-3 h-3" />{label}</span>;
    }
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700"><Package className="w-3 h-3" />{(g.products || []).length} product{(g.products || []).length === 1 ? '' : 's'}</span>;
  };

  return (
    <div data-testid="admin-variations-manager">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Product Variations</h2>
          <p className="text-sm text-gray-500 mt-1">{filteredGroups.length} of {groups.length} variation group{groups.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#EA6C10]" data-testid="add-variation-btn">
          <Plus className="w-4 h-4" />Add Variation Group
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
            placeholder="Search variation groups..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none"
            data-testid="variation-search-input"
          />
        </div>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl outline-none min-w-[180px]"
          data-testid="variation-scope-filter"
        >
          <option value="all">All Scopes</option>
          <option value="global">All Categories</option>
          <option value="category">Specific Category</option>
          <option value="product">Specific Products</option>
        </select>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Layers className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No variation groups found</p>
          {search && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map(g => (
            <div key={g.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-[#1A1A2E] flex items-center gap-2">
                    {g.name}
                    {!g.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Inactive</span>}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {scopeBadge(g)}
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      <Tag className="w-3 h-3" />{INPUT_TYPE_LABELS[g.input_type] || g.input_type}
                    </span>
                    {g.is_required && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">Required</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(g)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(g.variation_options || []).map(o => (
                  <span key={o.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-100">
                    {g.input_type === 'swatch' && o.swatch_color && (
                      <span className="w-2.5 h-2.5 rounded-full border border-gray-300" style={{ backgroundColor: o.swatch_color }} />
                    )}
                    {o.label}
                    {parseFloat(o.price_addition) > 0 && <span className="text-green-600">+${parseFloat(o.price_addition).toFixed(2)}</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>{editing ? 'Edit' : 'Add'} Variation Group</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">{error}</div>}

              {/* Basics */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Group Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Size, Frame Style, Color" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F97316]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Display As</label>
                  <select value={form.input_type} onChange={e => setForm(f => ({ ...f, input_type: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-lg outline-none">
                    <option value="select">Dropdown</option>
                    <option value="swatch">Color Swatch</option>
                    <option value="button">Button Style</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-lg outline-none" />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.is_required} onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))} className="w-4 h-4 accent-[#F97316]" />
                  Customer must select an option
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-[#F97316]" />
                  Active (visible on storefront)
                </label>
              </div>

              {/* Scope */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Assign To</label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { value: 'global', label: 'All Categories', desc: 'Every product, sitewide', icon: Sparkles },
                    { value: 'category', label: 'Specific Category', desc: 'Every product in one category', icon: FolderTree },
                    { value: 'product', label: 'Specific Products', desc: 'Hand-picked products only', icon: Package },
                  ].map(opt => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, scope: opt.value }))}
                      className={`text-left p-3 rounded-xl border-2 transition-colors ${form.scope === opt.value ? 'border-[#F97316] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <opt.icon className={`w-4 h-4 mb-1.5 ${form.scope === opt.value ? 'text-[#F97316]' : 'text-gray-400'}`} />
                      <p className="text-sm font-semibold text-[#1A1A2E]">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {form.scope === 'category' && (
                  <div className="mt-3 border border-gray-200 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-2">{form.category_ids.length} categor{form.category_ids.length === 1 ? 'y' : 'ies'} selected</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {categories.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No categories found</p>}
                      {categories.map(c => (
                        <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={form.category_ids.includes(c.id)} onChange={() => toggleCategory(c.id)} className="w-4 h-4 accent-[#F97316]" />
                          <span className="text-sm text-[#1A1A2E]">{c.name}</span>
                          {c.collections?.name && <span className="text-xs text-gray-400 ml-auto">{c.collections.name}</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {form.scope === 'product' && (
                  <div className="mt-3 border border-gray-200 rounded-xl p-3">
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <input
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Search products..."
                        className="flex-1 p-2.5 border border-gray-200 rounded-lg outline-none text-sm"
                      />
                      <select value={productCategoryFilter} onChange={e => setProductCategoryFilter(e.target.value)} className="p-2.5 border border-gray-200 rounded-lg outline-none text-sm">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{form.product_ids.length} product{form.product_ids.length === 1 ? '' : 's'} selected</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {productsInFilter.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No products match</p>}
                      {productsInFilter.map(p => (
                        <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={form.product_ids.includes(p.id)} onChange={() => toggleProduct(p.id)} className="w-4 h-4 accent-[#F97316]" />
                          {p.image_url && <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded object-cover" />}
                          <span className="text-sm text-[#1A1A2E]">{p.name}</span>
                          {p.categories?.name && <span className="text-xs text-gray-400 ml-auto">{p.categories.name}</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Options *</label>
                  <button type="button" onClick={addOption} className="text-sm text-[#F97316] font-semibold flex items-center gap-1 hover:text-[#EA6C10]"><Plus className="w-3.5 h-3.5" />Add Option</button>
                </div>
                <div className="space-y-2">
                  {form.options.map((o, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col mt-2.5 text-gray-300">
                          <button type="button" onClick={() => moveOption(idx, -1)} disabled={idx === 0} className="disabled:opacity-30 hover:text-gray-500"><ChevronUp className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => moveOption(idx, 1)} disabled={idx === form.options.length - 1} className="disabled:opacity-30 hover:text-gray-500"><ChevronDown className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <input value={o.label} onChange={e => updateOption(idx, 'label', e.target.value)} placeholder="Label (e.g. Large)" className="col-span-2 sm:col-span-1 p-2 border border-gray-200 rounded-lg outline-none text-sm" />
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+$</span>
                            <input type="number" step="0.01" value={o.price_addition} onChange={e => updateOption(idx, 'price_addition', e.target.value)} placeholder="0.00" className="w-full pl-7 p-2 border border-gray-200 rounded-lg outline-none text-sm" />
                          </div>
                          {form.input_type === 'swatch' && (
                            <input type="color" value={o.swatch_color} onChange={e => updateOption(idx, 'swatch_color', e.target.value)} className="w-full h-9 border border-gray-200 rounded-lg cursor-pointer" />
                          )}
                          <input value={o.image_url} onChange={e => updateOption(idx, 'image_url', e.target.value)} placeholder="Image URL (optional)" className="p-2 border border-gray-200 rounded-lg outline-none text-sm" />
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 px-1">
                            <input type="radio" name="default-option" checked={o.is_default} onChange={() => setDefaultOption(idx)} className="accent-[#F97316]" />
                            Default
                          </label>
                        </div>
                        <button type="button" onClick={() => removeOption(idx)} disabled={form.options.length === 1} className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#F97316] text-white rounded-lg text-sm font-semibold hover:bg-[#EA6C10] disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Update Variation Group' : 'Create Variation Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
