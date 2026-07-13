"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Search, Eye, FileText, Image as ImageIcon, Grid, List, Code, FileCode, HelpCircle, Tag as TagIcon, Link2 } from 'lucide-react';

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '', image_url: '',
  author_name: '', author_role: '', category_id: '', featured: false, status: 'draft', read_time: '',
  full_html_page: '',
  meta_description: '', tags: '', related_category_id: '', related_product_id: '', faqs: [],
};

export default function BlogManager({ token }) {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [uploadMode, setUploadMode] = useState('standard'); // 'standard' or 'fullhtml'
  const [form, setForm] = useState(emptyForm);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = () => {
    fetch('/api/admin/blog', { headers }).then(r => r.json()).then(d => setPosts(d.posts || []));
    fetch('/api/admin/blog/categories', { headers }).then(r => r.json()).then(d => setCategories(d.categories || []));
    fetch('/api/admin/categories', { headers }).then(r => r.json()).then(d => setProductCategories(d.categories || []));
    fetch('/api/admin/products', { headers }).then(r => r.json()).then(d => setProducts(d.products || []));
  };

  useEffect(load, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { ...form };
    if (editing) body.id = editing.id;

    // If full HTML mode, clear content field (but keep image_url for blog card)
    if (uploadMode === 'fullhtml' && form.full_html_page) {
      body.content = '';
    }

    // Tags come in as a comma-separated string in the form; store as an array.
    body.tags = typeof form.tags === 'string'
      ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
      : (form.tags || []);

    try {
      const res = await fetch('/api/admin/blog', { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(body) });
      const data = await res.json();
      
      if (res.ok) { 
        setShowForm(false); 
        setEditing(null); 
        resetForm(); 
        load(); 
      } else {
        alert(`Error: ${data.error || 'Failed to save post'}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this blog post?')) return;
    await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE', headers });
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

  const handleHtmlFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const htmlContent = event.target?.result;
      if (typeof htmlContent === 'string') {
        setForm(f => ({ ...f, full_html_page: htmlContent }));
      }
    };
    reader.readAsText(file);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setUploadMode('standard');
  };

  const startEdit = (p) => {
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt || '', content: p.content || '',
      image_url: p.image_url || '', author_name: p.author_name || '', author_role: p.author_role || '',
      category_id: p.category_id || '', featured: p.featured, status: p.status, read_time: p.read_time || '',
      full_html_page: p.full_html_page || '',
      meta_description: p.meta_description || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      related_category_id: p.related_category_id || '',
      related_product_id: p.related_product_id || '',
      faqs: Array.isArray(p.faqs) ? p.faqs : [],
    });
    setUploadMode(p.full_html_page ? 'fullhtml' : 'standard');
    setEditing(p);
    setShowForm(true);
  };

  // FAQ repeater handlers
  const addFaq = () => setForm(f => ({ ...f, faqs: [...(f.faqs || []), { question: '', answer: '' }] }));
  const updateFaq = (index, key, value) => setForm(f => ({
    ...f,
    faqs: f.faqs.map((item, i) => i === index ? { ...item, [key]: value } : item),
  }));
  const removeFaq = (index) => setForm(f => ({ ...f, faqs: f.faqs.filter((_, i) => i !== index) }));

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const body = { ...categoryForm };
    if (editingCategory) body.id = editingCategory.id;

    const res = await fetch('/api/admin/blog/categories', { method: editingCategory ? 'PUT' : 'POST', headers, body: JSON.stringify(body) });
    if (res.ok) { setShowCategoryForm(false); setEditingCategory(null); setCategoryForm({ name: '', description: '' }); load(); }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    await fetch(`/api/admin/blog/categories?id=${id}`, { method: 'DELETE', headers });
    load();
  };

  const filteredPosts = posts.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="admin-blog-manager">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Blog Posts</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryForm(true)} className="flex items-center gap-2 bg-gray-100 text-[#4A4A68] px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors" data-testid="manage-categories-btn">
            <FileText className="w-4 h-4" />Categories
          </button>
          <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }} className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#EA6C10] transition-colors" data-testid="add-post-btn">
            <Plus className="w-4 h-4" />New Post
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#F97316]" />
        </div>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg ${viewMode === 'grid' ? 'bg-[#F97316] text-white' : 'bg-white text-gray-400'}`}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg ${viewMode === 'list' ? 'bg-[#F97316] text-white' : 'bg-white text-gray-400'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Posts Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-40 bg-gray-100">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-300" /></div>
                )}
                <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {p.status}
                </span>
                {p.featured && <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold bg-[#F97316] text-white">Featured</span>}
              </div>
              <div className="p-4">
                <p className="text-xs text-[#F97316] font-semibold mb-1">{p.blog_categories?.name || 'Uncategorized'}</p>
                <h3 className="font-bold text-[#1A1A2E] line-clamp-2 mb-2">{p.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{p.author_name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Post</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Author</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr></thead>
            <tbody>
              {filteredPosts.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {p.image_url ? <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>}
                      <div><p className="font-medium text-[#1A1A2E] line-clamp-1">{p.title}</p><p className="text-xs text-gray-400 line-clamp-1">{p.excerpt}</p></div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{p.blog_categories?.name || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{p.author_name || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                    {p.featured && <span className="ml-1 px-2 py-1 rounded-full text-xs font-medium bg-[#FFF0E0] text-[#F97316]">Featured</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => startEdit(p)} className="p-2 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPosts.length === 0 && <p className="text-center py-8 text-gray-500">No posts found</p>}
        </div>
      )}

      {/* Post Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1A1A2E]">{editing ? 'Edit Post' : 'New Post'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Upload Mode Toggle */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-3">Upload Mode</p>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setUploadMode('standard')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${uploadMode === 'standard' ? 'border-[#F97316] bg-orange-50 text-[#F97316]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Standard</p>
                    <p className="text-xs opacity-75">Fill title, image, content</p>
                  </div>
                </button>
                <button 
                  type="button"
                  onClick={() => setUploadMode('fullhtml')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${uploadMode === 'fullhtml' ? 'border-[#F97316] bg-orange-50 text-[#F97316]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <FileCode className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Full Page</p>
                    <p className="text-xs opacity-75">Upload a complete page</p>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common fields - Title and Slug always required */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label><input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F97316]" /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Slug (auto-generated)</label><input value={form.slug} onChange={e => setForm(f => ({...f, slug: e.target.value}))} placeholder="auto-generated from title" className="w-full p-3 border border-gray-200 rounded-lg outline-none text-sm" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none">
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Full Page Mode */}
              {uploadMode === 'fullhtml' ? (
                <div className="space-y-4 pt-4 border-t">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      <strong>Full Page Mode:</strong> Upload a complete page file. It will render exactly as-is, with only the site's universal header and footer. Title and image are used for the blog listing card only.
                    </p>
                  </div>
                  
                  {/* Required fields for blog card */}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-gray-700 mb-1 block">Featured Image (for blog card) *</label>
                      <div className="flex gap-2">
                        <input required value={form.image_url} onChange={e => setForm(f => ({...f, image_url: e.target.value}))} placeholder="URL or upload" className="flex-1 p-3 border border-gray-200 rounded-lg outline-none text-sm" />
                        <label className="flex items-center gap-1 px-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 text-sm"><Upload className="w-4 h-4" /><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
                      </div>
                    </div>
                    <div><label className="text-sm font-medium text-gray-700 mb-1 block">Excerpt (for blog listing)</label><textarea rows={2} value={form.excerpt} onChange={e => setForm(f => ({...f, excerpt: e.target.value}))} placeholder="Short description for blog listing page" className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                  </div>

                  {/* Page Upload */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Upload Page File *</label>
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#F97316] hover:bg-orange-50 transition-colors">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload file</span>
                        <input type="file" accept=".html,.htm" onChange={handleHtmlFileUpload} className="hidden" />
                      </label>
                    </div>
                    {form.full_html_page && (
                      <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                        <Code className="w-4 h-4" /> Page content loaded ({form.full_html_page.length.toLocaleString()} characters)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Or Paste Page Code</label>
                    <textarea
                      rows={12}
                      value={form.full_html_page}
                      onChange={e => setForm(f => ({...f, full_html_page: e.target.value}))}
                      placeholder="<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <!-- Your full page HTML here -->
</body>
</html>" 
                      className="w-full p-3 border border-gray-200 rounded-lg outline-none font-mono text-xs"
                    />
                  </div>
                </div>
              ) : (
                /* Standard Mode Fields */
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Excerpt</label><textarea rows={2} value={form.excerpt} onChange={e => setForm(f => ({...f, excerpt: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                  <div className="col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Content</label><textarea rows={8} value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="HTML content supported" className="w-full p-3 border border-gray-200 rounded-lg outline-none font-mono text-sm" /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Featured Image</label>
                    <div className="flex gap-2">
                      <input value={form.image_url} onChange={e => setForm(f => ({...f, image_url: e.target.value}))} placeholder="URL or upload" className="flex-1 p-3 border border-gray-200 rounded-lg outline-none text-sm" />
                      <label className="flex items-center gap-1 px-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 text-sm"><Upload className="w-4 h-4" /><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
                    </div>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Read Time</label><input value={form.read_time} onChange={e => setForm(f => ({...f, read_time: e.target.value}))} placeholder="e.g. 5 min read" className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Author Name</label><input value={form.author_name} onChange={e => setForm(f => ({...f, author_name: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Author Role</label><input value={form.author_role} onChange={e => setForm(f => ({...f, author_role: e.target.value}))} placeholder="e.g. Veterinarian" className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                </div>
              )}

              {/* SEO & Discovery */}
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2"><Search className="w-4 h-4 text-[#F97316]" />SEO & Discovery</p>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Meta Description</label>
                  <textarea
                    rows={2}
                    maxLength={160}
                    value={form.meta_description}
                    onChange={e => setForm(f => ({...f, meta_description: e.target.value}))}
                    placeholder="Shown in Google search results (max 160 characters). Falls back to excerpt if left blank."
                    className="w-full p-3 border border-gray-200 rounded-lg outline-none text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{(form.meta_description || '').length}/160</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><TagIcon className="w-3.5 h-3.5" />Tags</label>
                  <input
                    value={form.tags}
                    onChange={e => setForm(f => ({...f, tags: e.target.value}))}
                    placeholder="comma, separated, tags, e.g. pet-photography, grooming, gift-ideas"
                    className="w-full p-3 border border-gray-200 rounded-lg outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Link2 className="w-3.5 h-3.5" />Related Category</label>
                    <select
                      value={form.related_category_id}
                      onChange={e => setForm(f => ({...f, related_category_id: e.target.value, related_product_id: e.target.value ? '' : f.related_product_id}))}
                      className="w-full p-3 border border-gray-200 rounded-lg outline-none text-sm"
                    >
                      <option value="">None</option>
                      {productCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Link2 className="w-3.5 h-3.5" />Related Product</label>
                    <select
                      value={form.related_product_id}
                      onChange={e => setForm(f => ({...f, related_product_id: e.target.value, related_category_id: e.target.value ? '' : f.related_category_id}))}
                      className="w-full p-3 border border-gray-200 rounded-lg outline-none text-sm"
                    >
                      <option value="">None</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Choose either a related product or category — it's shown as a "Shop This" card at the end of the article.</p>
              </div>

              {/* FAQs */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2"><HelpCircle className="w-4 h-4 text-[#F97316]" />FAQs (shown after the article)</p>
                  <button type="button" onClick={addFaq} className="flex items-center gap-1 text-sm text-[#F97316] font-semibold hover:underline">
                    <Plus className="w-3.5 h-3.5" />Add FAQ
                  </button>
                </div>
                {(form.faqs || []).length === 0 && (
                  <p className="text-xs text-gray-400">No FAQs added yet. FAQs appear as an accordion under the article and are marked up for Google's FAQ rich results.</p>
                )}
                {(form.faqs || []).map((faq, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <input
                        value={faq.question}
                        onChange={e => updateFaq(i, 'question', e.target.value)}
                        placeholder="Question"
                        className="flex-1 p-2.5 border border-gray-200 rounded-lg outline-none text-sm"
                      />
                      <button type="button" onClick={() => removeFaq(i)} className="p-2.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={e => updateFaq(i, 'answer', e.target.value)}
                      placeholder="Answer"
                      className="w-full p-2.5 border border-gray-200 rounded-lg outline-none text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({...f, featured: e.target.checked}))} className="rounded" />Featured Post</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#F97316] text-white rounded-lg text-sm font-semibold hover:bg-[#EA6C10]">{editing ? 'Update' : 'Create'} Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1A1A2E]">Manage Categories</h3>
              <button onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Existing categories */}
            <div className="mb-6 space-y-2 max-h-48 overflow-y-auto">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-[#1A1A2E]">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setCategoryForm({ name: c.name, description: c.description || '' }); setEditingCategory(c); }} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Edit category form */}
            <form onSubmit={handleCategorySubmit} className="space-y-4 border-t pt-4">
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">{editingCategory ? 'Edit' : 'Add'} Category</label><input required value={categoryForm.name} onChange={e => setCategoryForm(f => ({...f, name: e.target.value}))} placeholder="Category name" className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
              <div><textarea value={categoryForm.description} onChange={e => setCategoryForm(f => ({...f, description: e.target.value}))} placeholder="Description (optional)" className="w-full p-3 border border-gray-200 rounded-lg outline-none" rows={2} /></div>
              <div className="flex justify-end gap-2">
                {editingCategory && <button type="button" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>}
                <button type="submit" className="px-4 py-2 bg-[#F97316] text-white rounded-lg text-sm font-semibold">{editingCategory ? 'Update' : 'Add'} Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
