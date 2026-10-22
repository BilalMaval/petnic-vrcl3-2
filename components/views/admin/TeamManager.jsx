"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, ArrowUp, ArrowDown, AlertCircle, Loader2, Upload, Users } from 'lucide-react';
import { GRADIENTS, GRADIENT_KEYS, DEFAULT_GRADIENT, DEFAULT_AVATAR } from '@/lib/team-gradients';

const EMPTY_FORM = { name: '', role: '', bio: '', badge: '', avatar: DEFAULT_AVATAR, gradient: DEFAULT_GRADIENT, photoUrl: '', isVisible: true };
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const GRADIENT_LABELS = { purple: 'Purple', blue: 'Blue', green: 'Green', orange: 'Orange', pink: 'Pink', indigo: 'Indigo' };

function Avatar({ member, size = 'w-12 h-12', text = 'text-2xl' }) {
  if (member.photo_url || member.photoUrl) {
    return <img src={member.photo_url || member.photoUrl} alt="" className={`${size} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full flex items-center justify-center shrink-0 ${text} ${GRADIENTS[member.gradient] || GRADIENTS[DEFAULT_GRADIENT]}`}>
      {member.avatar || DEFAULT_AVATAR}
    </div>
  );
}

export default function TeamManager({ token }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/team', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setMembers(d.members || []);
        setSetupRequired(!!d.setupRequired);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true); };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name, role: m.role, bio: m.bio || '', badge: m.badge || '', avatar: m.avatar || DEFAULT_AVATAR,
      gradient: m.gradient || DEFAULT_GRADIENT, photoUrl: m.photo_url || '', isVisible: m.is_visible,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const url = editing ? `/api/admin/team/${editing.id}` : '/api/admin/team';
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(form) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setFormError(data.error || 'Could not save the team member'); return; }
    setShowForm(false);
    setEditing(null);
    setNotice(editing ? 'Team member updated' : 'Team member added');
    load();
  };

  const toggle = async (m) => {
    const res = await fetch(`/api/admin/team/${m.id}`, { method: 'PUT', headers, body: JSON.stringify({ toggleOnly: true, isVisible: !m.is_visible }) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setNotice(d.error || 'Could not update the team member'); }
    load();
  };

  const remove = async (m) => {
    if (!confirm(`Remove ${m.name} from the team? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/team/${m.id}`, { method: 'DELETE', headers });
    const d = await res.json().catch(() => ({}));
    setNotice(res.ok ? 'Team member removed' : d.error || 'Could not remove the team member');
    load();
  };

  // Optimistic reorder: update the list immediately, reload if the save fails.
  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= members.length) return;
    const next = [...members];
    [next[index], next[target]] = [next[target], next[index]];
    setMembers(next);
    const res = await fetch('/api/admin/team', { method: 'PUT', headers, body: JSON.stringify({ ids: next.map((m) => m.id) }) });
    if (!res.ok) { setNotice('Could not save the new order'); load(); }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) { setFormError('Photo must be a JPG, PNG or WebP image'); return; }
    if (file.size > PHOTO_MAX_BYTES) { setFormError('Photo must be 5 MB or smaller'); return; }
    setFormError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('purpose', 'team-photo');
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) setFormError(data.error || 'Upload failed (the file may be too large for the server)');
      else set({ photoUrl: data.url });
    } catch {
      setFormError('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  return (
    <div data-testid="admin-team-manager">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Team</h2>
          <p className="text-sm text-gray-500 mt-1">{members.length} member{members.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={openNew} disabled={setupRequired} className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#EA6C10] disabled:opacity-50" data-testid="add-team-btn">
          <Plus className="w-4 h-4" />Add Team Member
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">These profiles appear in the &ldquo;Meet the Team&rdquo; section of the About page. If you hide or remove everyone, the whole section disappears.</p>

      {setupRequired && (
        <div className="flex gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 mb-6" data-testid="team-setup-notice">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">One-time setup needed</p>
            <p>The team table doesn&apos;t exist yet. Run <code className="bg-yellow-100 px-1 rounded">team-migration.sql</code> in your database console, then reload this page.</p>
          </div>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between bg-gray-100 text-gray-700 rounded-lg px-4 py-2 mb-4 text-sm" data-testid="team-notice">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss"><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>
      ) : !setupRequired && members.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />No team members yet. The About page keeps its general &ldquo;Our Team&rdquo; text until you add one.
        </div>
      ) : (
        <ul className="space-y-3">
          {members.map((m, i) => (
            <li key={m.id} className={`flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 ${m.is_visible ? '' : 'opacity-60'}`} data-testid={`team-row-${m.name}`}>
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-[#F97316] disabled:opacity-30" aria-label={`Move ${m.name} up`}><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === members.length - 1} className="p-1 text-gray-400 hover:text-[#F97316] disabled:opacity-30" aria-label={`Move ${m.name} down`}><ArrowDown className="w-4 h-4" /></button>
              </div>
              <Avatar member={m} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#1A1A2E] truncate">{m.name}</p>
                <p className="text-sm text-gray-500 truncate">{m.role}</p>
                {m.bio && <p className="text-xs text-gray-400 truncate">{m.bio}</p>}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${m.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{m.is_visible ? 'Visible' : 'Hidden'}</span>
              <div className="flex shrink-0">
                <button onClick={() => openEdit(m)} className="p-2 text-gray-500 hover:text-[#F97316]" title="Edit" aria-label={`Edit ${m.name}`}><Pencil className="w-4 h-4" /></button>
                <button onClick={() => toggle(m)} className="p-2 text-gray-500 hover:text-[#F97316]" title={m.is_visible ? 'Hide' : 'Show'} aria-label={`${m.is_visible ? 'Hide' : 'Show'} ${m.name}`}>{m.is_visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                <button onClick={() => remove(m)} className="p-2 text-gray-500 hover:text-red-500" title="Remove" aria-label={`Remove ${m.name}`}><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4" data-testid="team-form-modal">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-xl my-8 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1A1A2E]">{editing ? 'Edit Team Member' : 'Add Team Member'}</h3>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name *</label>
                <input required maxLength={80} value={form.name} onChange={(e) => set({ name: e.target.value })} className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none" data-testid="team-name-input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role / title *</label>
                <input required maxLength={100} value={form.role} onChange={(e) => set({ role: e.target.value })} className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none" data-testid="team-role-input" />
              </div>
            </div>

            <div>
              <div className="flex justify-between"><label className="text-sm font-medium text-gray-700">Short bio</label><span className="text-xs text-gray-400" data-testid="team-bio-counter">{form.bio.length}/500</span></div>
              <textarea rows={3} maxLength={500} value={form.bio} onChange={(e) => set({ bio: e.target.value })} className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none text-sm" data-testid="team-bio-input" />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Badge</label>
                <input maxLength={40} value={form.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="🖌️ Art & Design" className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Emoji avatar</label>
                <input value={form.avatar} onChange={(e) => set({ avatar: e.target.value })} className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none text-center text-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Avatar colour</label>
                <select value={form.gradient} onChange={(e) => set({ gradient: e.target.value })} className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none bg-white text-sm">
                  {GRADIENT_KEYS.map((k) => <option key={k} value={k}>{GRADIENT_LABELS[k]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Photo (optional)</label>
              <div className="flex items-center gap-4 mt-2">
                <Avatar member={{ photoUrl: form.photoUrl, avatar: form.avatar, gradient: form.gradient }} size="w-16 h-16" />
                <div className="flex flex-wrap gap-2">
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="hidden" data-testid="team-photo-input" />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{form.photoUrl ? 'Replace photo' : 'Upload photo'}
                  </button>
                  {form.photoUrl && <button type="button" onClick={() => set({ photoUrl: '' })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-red-600 hover:bg-red-50">Remove photo</button>}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP, up to 5 MB. Without a photo the emoji and colour are used.</p>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isVisible} onChange={(e) => set({ isVisible: e.target.checked })} className="w-4 h-4 accent-[#F97316]" />Show on the About page
            </label>

            {formError && <p className="text-sm text-red-600" data-testid="team-form-error">{formError}</p>}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving || uploading} className="px-5 py-2.5 bg-[#F97316] text-white rounded-lg text-sm font-semibold hover:bg-[#EA6C10] disabled:opacity-50" data-testid="team-save-btn">{saving ? 'Saving...' : editing ? 'Save changes' : 'Add member'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
