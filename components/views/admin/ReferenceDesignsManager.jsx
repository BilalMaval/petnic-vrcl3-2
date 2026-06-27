"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Upload, GripVertical, Image as ImageIcon, DollarSign } from 'lucide-react';

export default function ReferenceDesignsManager({ token }) {
  const [designs, setDesigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', image_url: '', style: '', price_addition: '0', sort_order: '0', active: true });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = () => {
    fetch('/api/admin/reference-designs', { headers }).then(r => r.json()).then(d => setDesigns(d.designs || []));
  };

  useEffect(load, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { ...form };
    if (editing) body.id = editing.id;

    const res = await fetch('/api/admin/reference-designs', { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(body) });
    if (res.ok) { setShowForm(false); setEditing(null); resetForm(); load(); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this reference design?')) return;
    await fetch(`/api/admin/reference-designs?id=${id}`, { method: 'DELETE', headers });
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

  const resetForm = () => setForm({ name: '', image_url: '', style: '', price_addition: '0', sort_order: '0', active: true });

  const startEdit = (d) => {
    setForm({
      name: d.name, image_url: d.image_url, style: d.style || '',
      price_addition: d.price_addition?.toString() || '0', sort_order: d.sort_order?.toString() || '0', active: d.active
    });
    setEditing(d);
    setShowForm(true);
  };

  const toggleActive = async (d) => {
    await fetch('/api/admin/reference-designs', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id: d.id, active: !d.active })
    });
    load();
  };

  return (
    <div data-testid="admin-reference-designs-manager">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Reference Designs</h2>
          <p className="text-sm text-gray-500 mt-1">Creative AI design templates for Print on Demand products. Customers can choose these as a base design.</p>
        </div>
        <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }} className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#EA6C10] transition-colors" data-testid="add-design-btn">
          <Plus className="w-4 h-4" />Add Design
        </button>
      </div>

      {/* Designs Grid - 2 rows of 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {designs.map((d, idx) => (
          <div key={d.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${d.active ? 'border-gray-100 hover:shadow-lg' : 'border-gray-200 opacity-50'}`}>
            <div className="relative h-40 bg-gray-100">
              {d.image_url ? (
                <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-300" /></div>
              )}
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-gray-600 flex items-center gap-1">
                <GripVertical className="w-3 h-3" />{idx + 1}
              </div>
              {d.price_addition > 0 && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center">
                  +${d.price_addition}
                </div>
              )}
              {!d.active && (
                <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Disabled</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-[#1A1A2E] text-sm">{d.name}</h3>
              {d.style && <p className="text-xs text-[#F97316]">{d.style}</p>}
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => toggleActive(d)}
                  className={`px-2 py-1 rounded text-[10px] font-medium ${d.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {d.active ? 'Active' : 'Inactive'}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(d)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(d.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Placeholder if less than 8 */}
        {designs.length < 8 && Array.from({ length: 8 - designs.length }).map((_, i) => (
          <button
            key={`empty-${i}`}
            onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}
            className="h-56 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#F97316] hover:text-[#F97316] transition-colors"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-xs font-medium">Add Design</span>
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1A1A2E]">{editing ? 'Edit' : 'Add'} Reference Design</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Royal Portrait" className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#F97316]" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Style</label><input value={form.style} onChange={e => setForm(f => ({...f, style: e.target.value}))} placeholder="e.g. Watercolor, Renaissance" className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Image *</label>
                <div className="flex gap-2">
                  <input required value={form.image_url} onChange={e => setForm(f => ({...f, image_url: e.target.value}))} placeholder="URL or upload" className="flex-1 p-3 border border-gray-200 rounded-lg outline-none text-sm" />
                  <label className="flex items-center gap-1 px-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 text-sm"><Upload className="w-4 h-4" /><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
                </div>
                {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Price Addition ($)</label><input type="number" step="0.01" value={form.price_addition} onChange={e => setForm(f => ({...f, price_addition: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Sort Order</label><input type="number" value={form.sort_order} onChange={e => setForm(f => ({...f, sort_order: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-lg outline-none" /></div>
              </div>
              <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))} className="rounded" />Active (visible to customers)</label></div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#F97316] text-white rounded-lg text-sm font-semibold hover:bg-[#EA6C10]">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
