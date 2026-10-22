"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Ticket, Power, Wand2, AlertCircle, Loader2 } from 'lucide-react';
import {
  ZONES,
  PRESETS,
  DEFAULT_START_ZONE,
  DEFAULT_END_ZONE,
  DEFAULT_START_TIME,
  DEFAULT_END_TIME,
  zonedToUtcIso,
  utcIsoToZoned,
  formatInZone,
} from '@/lib/coupon-time';

const EMPTY_FORM = {
  code: '', description: '', discountType: 'PERCENT', discountValue: '',
  minOrderAmount: '', maxDiscountAmount: '', usageLimit: '', perCustomerLimit: '', isActive: true,
  startDate: '', startTime: DEFAULT_START_TIME, startTimezone: DEFAULT_START_ZONE,
  expiresDate: '', expiresTime: DEFAULT_END_TIME, endTimezone: DEFAULT_END_ZONE,
};

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomCode(length = 8) {
  const bytes = new Uint32Array(length);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

function couponStatus(c) {
  const now = Date.now();
  if (!c.is_active) return { label: 'Disabled', cls: 'bg-gray-100 text-gray-600' };
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return { label: 'Used up', cls: 'bg-red-100 text-red-700' };
  if (c.expires_at && new Date(c.expires_at).getTime() <= now) return { label: 'Expired', cls: 'bg-red-100 text-red-700' };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700' };
  return { label: 'Active', cls: 'bg-green-100 text-green-700' };
}

const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const discountLabel = (c) => (c.discount_type === 'PERCENT' ? `${Number(c.discount_value)}% off` : `${money(c.discount_value)} off`);

// Shows the exact moment being entered in several regions so a wrong region
// is obvious before saving.
function MomentPreview({ date, time, zone }) {
  if (!date) return null;
  let iso = '';
  try { iso = zonedToUtcIso(date, time, zone); } catch { return <p className="text-xs text-red-500 mt-1">Invalid date or time</p>; }
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const rows = [
    ['New York', 'America/New_York'],
    ['Los Angeles', 'America/Los_Angeles'],
    ['London', 'Europe/London'],
    ['Your local time', localZone],
  ];
  return (
    <ul className="mt-1 text-xs text-gray-500 space-y-0.5" data-testid="coupon-moment-preview">
      {rows.map(([label, z]) => <li key={label}><span className="text-gray-400">{label}:</span> {formatInZone(iso, z)}</li>)}
    </ul>
  );
}

function DateTimeZone({ label, date, time, zone, onChange, testid }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <input type="date" value={date} onChange={(e) => onChange({ date: e.target.value })} className="p-3 border border-gray-200 rounded-lg outline-none text-sm" data-testid={`${testid}-date`} />
        <input type="time" value={time} onChange={(e) => onChange({ time: e.target.value })} className="p-3 border border-gray-200 rounded-lg outline-none text-sm" data-testid={`${testid}-time`} />
      </div>
      <select value={zone} onChange={(e) => onChange({ zone: e.target.value })} className="w-full mt-2 p-3 border border-gray-200 rounded-lg outline-none text-sm bg-white" data-testid={`${testid}-zone`}>
        {ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
      </select>
      <MomentPreview date={date} time={time} zone={zone} />
    </div>
  );
}

export default function CouponsManager({ token }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/coupons', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setCoupons(d.coupons || []);
        setSetupRequired(!!d.setupRequired);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, code: randomCode() });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (c) => {
    const startZone = c.start_timezone || DEFAULT_START_ZONE;
    const endZone = c.end_timezone || DEFAULT_END_ZONE;
    const start = utcIsoToZoned(c.starts_at, startZone, DEFAULT_START_TIME);
    const end = utcIsoToZoned(c.expires_at, endZone, DEFAULT_END_TIME);
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discount_type,
      discountValue: String(c.discount_value ?? ''),
      minOrderAmount: Number(c.min_order_amount) > 0 ? String(c.min_order_amount) : '',
      maxDiscountAmount: c.max_discount_amount != null ? String(c.max_discount_amount) : '',
      usageLimit: c.usage_limit != null ? String(c.usage_limit) : '',
      perCustomerLimit: c.per_customer_limit != null ? String(c.per_customer_limit) : '',
      isActive: c.is_active,
      startDate: start.date, startTime: c.starts_at ? start.time : DEFAULT_START_TIME, startTimezone: startZone,
      expiresDate: end.date, expiresTime: c.expires_at ? end.time : DEFAULT_END_TIME, endTimezone: endZone,
    });
    setFormError('');
    setShowForm(true);
  };

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const applyPreset = (p) => set({ startTime: DEFAULT_START_TIME, expiresTime: DEFAULT_END_TIME, startTimezone: p.startZone, endTimezone: p.endZone });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const url = editing ? `/api/admin/coupons/${editing.id}` : '/api/admin/coupons';
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(form) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setFormError(data.error || 'Could not save the coupon'); return; }
    setShowForm(false);
    setEditing(null);
    setNotice(editing ? 'Coupon updated' : 'Coupon created');
    load();
  };

  const toggle = async (c) => {
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'PUT', headers, body: JSON.stringify({ toggleOnly: true, isActive: !c.is_active }) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setNotice(d.error || 'Could not update the coupon'); }
    load();
  };

  const remove = async (c) => {
    if (!confirm(`Delete coupon ${c.code}? A coupon that has been used cannot be deleted - disable it instead.`)) return;
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE', headers });
    const d = await res.json().catch(() => ({}));
    setNotice(res.ok ? 'Coupon deleted' : d.error || 'Could not delete the coupon');
    load();
  };

  return (
    <div data-testid="admin-coupons-manager">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Coupons</h2>
          <p className="text-sm text-gray-500 mt-1">{coupons.length} coupon{coupons.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={openNew} disabled={setupRequired} className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#EA6C10] disabled:opacity-50" data-testid="add-coupon-btn">
          <Plus className="w-4 h-4" />New Coupon
        </button>
      </div>

      {setupRequired && (
        <div className="flex gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 mb-6" data-testid="coupons-setup-notice">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">One-time setup needed</p>
            <p>The coupon tables don&apos;t exist yet. Run <code className="bg-yellow-100 px-1 rounded">coupons-migration.sql</code> in your database console, then reload this page.</p>
          </div>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between bg-gray-100 text-gray-700 rounded-lg px-4 py-2 mb-4 text-sm" data-testid="coupons-notice">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss"><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>
      ) : !setupRequired && coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          <Ticket className="w-10 h-10 mx-auto mb-3 text-gray-300" />No coupons yet. Create your first one.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="py-3 px-4 font-medium">Code</th>
              <th className="py-3 px-4 font-medium">Discount</th>
              <th className="py-3 px-4 font-medium">Rules</th>
              <th className="py-3 px-4 font-medium">Usage</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr></thead>
            <tbody>
              {coupons.map((c) => {
                const st = couponStatus(c);
                return (
                  <tr key={c.id} className="border-b border-gray-50 align-top" data-testid={`coupon-row-${c.code}`}>
                    <td className="py-3 px-4"><p className="font-mono font-semibold text-[#1A1A2E]">{c.code}</p>{c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}</td>
                    <td className="py-3 px-4 font-semibold">{discountLabel(c)}</td>
                    <td className="py-3 px-4 text-xs text-gray-600 space-y-0.5">
                      {Number(c.min_order_amount) > 0 && <p>Min order {money(c.min_order_amount)}</p>}
                      {c.max_discount_amount != null && <p>Max discount {money(c.max_discount_amount)}</p>}
                      {c.per_customer_limit != null && <p>{c.per_customer_limit} per customer</p>}
                      {c.starts_at && <p>From {formatInZone(c.starts_at, c.start_timezone || DEFAULT_START_ZONE)}</p>}
                      {c.expires_at && <p>Until {formatInZone(c.expires_at, c.end_timezone || DEFAULT_END_ZONE)}</p>}
                      {!c.starts_at && !c.expires_at && Number(c.min_order_amount) === 0 && c.max_discount_amount == null && c.per_customer_limit == null && <p className="text-gray-400">No restrictions</p>}
                    </td>
                    <td className="py-3 px-4 text-xs"><p className="font-semibold">{c.used_count} / {c.usage_limit ?? '∞'}</p><p className="text-gray-500">{money(c.total_discounted)} saved</p></td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-2 text-gray-500 hover:text-[#F97316]" title="Edit" aria-label={`Edit ${c.code}`}><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => toggle(c)} className="p-2 text-gray-500 hover:text-[#F97316]" title={c.is_active ? 'Disable' : 'Enable'} aria-label={`${c.is_active ? 'Disable' : 'Enable'} ${c.code}`}><Power className="w-4 h-4" /></button>
                        <button onClick={() => remove(c)} className="p-2 text-gray-500 hover:text-red-500" title="Delete" aria-label={`Delete ${c.code}`}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4" data-testid="coupon-form-modal">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-2xl my-8 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1A1A2E]">{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Code</label>
              <div className="flex gap-2 mt-1">
                <input required value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/\s+/g, '') })} maxLength={32} className="flex-1 p-3 border border-gray-200 rounded-lg outline-none font-mono" data-testid="coupon-code-input" />
                <button type="button" onClick={() => set({ code: randomCode() })} className="flex items-center gap-1 px-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"><Wand2 className="w-4 h-4" />Generate</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <select value={form.discountType} onChange={(e) => set({ discountType: e.target.value })} className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none bg-white" data-testid="coupon-type-select">
                  <option value="PERCENT">Percentage</option>
                  <option value="FIXED">Fixed amount</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Value {form.discountType === 'PERCENT' ? '(%)' : '($)'}</label>
                <input required type="number" step="0.01" min="0.01" max={form.discountType === 'PERCENT' ? 100 : undefined} value={form.discountValue} onChange={(e) => set({ discountValue: e.target.value })} className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none" data-testid="coupon-value-input" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description (shown to customers)</label>
              <input value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={200} className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Minimum order ($)</label>
                <input type="number" step="0.01" min="0" value={form.minOrderAmount} onChange={(e) => set({ minOrderAmount: e.target.value })} className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none" />
              </div>
              {form.discountType === 'PERCENT' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Maximum discount ($)</label>
                  <input type="number" step="0.01" min="0.01" value={form.maxDiscountAmount} onChange={(e) => set({ maxDiscountAmount: e.target.value })} placeholder="No cap" className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Total uses</label>
                <input type="number" step="1" min="1" value={form.usageLimit} onChange={(e) => set({ usageLimit: e.target.value })} placeholder="Unlimited" className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Uses per customer</label>
                <input type="number" step="1" min="1" value={form.perCustomerLimit} onChange={(e) => set({ perCustomerLimit: e.target.value })} placeholder="Unlimited" className="w-full mt-1 p-3 border border-gray-200 rounded-lg outline-none" />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Quick presets (set times 00:01 / 23:59 and the two regions)</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" onClick={() => applyPreset(p)} title={p.hint} className="px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-[#F97316] hover:text-[#F97316]" data-testid={`coupon-preset-${p.id}`}>{p.label}</button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <DateTimeZone label="Starts (empty date = starts now)" testid="coupon-start" date={form.startDate} time={form.startTime} zone={form.startTimezone}
                onChange={(p) => set({ ...(p.date !== undefined && { startDate: p.date }), ...(p.time !== undefined && { startTime: p.time }), ...(p.zone !== undefined && { startTimezone: p.zone }) })} />
              <DateTimeZone label="Expires (empty date = never)" testid="coupon-end" date={form.expiresDate} time={form.expiresTime} zone={form.endTimezone}
                onChange={(p) => set({ ...(p.date !== undefined && { expiresDate: p.date }), ...(p.time !== undefined && { expiresTime: p.time }), ...(p.zone !== undefined && { endTimezone: p.zone }) })} />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="w-4 h-4 accent-[#F97316]" />Active
            </label>

            {formError && <p className="text-sm text-red-600" data-testid="coupon-form-error">{formError}</p>}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#F97316] text-white rounded-lg text-sm font-semibold hover:bg-[#EA6C10] disabled:opacity-50" data-testid="coupon-save-btn">{saving ? 'Saving...' : editing ? 'Save changes' : 'Create coupon'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
