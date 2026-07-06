"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from 'lucide-react';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send message');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Contact Us</h1>
        <p className="text-[#4A4A68] text-lg mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>Have a question? We'd love to hear from you. Our team typically responds within 2 hours.</p>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            {[
              { icon: Mail, label: 'Email', value: 'info@petnicstudio.com', href: 'mailto:info@petnicstudio.com' },
              { icon: Phone, label: 'Phone', value: '+1 (581) 891-8811', href: 'tel:+15818918811' },
              { icon: Clock, label: 'Hours', value: 'Mon–Fri 9AM–6PM EST', href: null },
              { icon: MapPin, label: 'Address', value: '1001 S Main St Ste 12362, Kalispell, MT 59901', href: null },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#F97316]" />
                  <div>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</p>
                    {href ? (
                      <a href={href} className="text-sm font-semibold text-[#1A1A2E] hover:text-[#F97316] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</a>
                    ) : (
                      <p className="text-sm font-semibold text-[#1A1A2E]" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-gray-100">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Message Sent!</h2>
                <p className="text-sm text-[#4A4A68]" style={{ fontFamily: 'Inter, sans-serif' }}>We'll get back to you within 2 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" data-testid="contact-form">
                {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg" data-testid="contact-error">{error}</div>}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Name</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100" placeholder="Your name" style={{ fontFamily: 'Inter, sans-serif' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Email</label>
                    <input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100" placeholder="your@email.com" style={{ fontFamily: 'Inter, sans-serif' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Subject</label>
                  <input type="text" required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100" placeholder="How can we help?" style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>Message</label>
                  <textarea required rows={5} value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 resize-none" placeholder="Tell us more..." style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
                <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-3 bg-[#F97316] text-white rounded-xl font-semibold text-sm hover:bg-[#EA6C10] transition-colors flex items-center gap-2 disabled:opacity-50" style={{ fontFamily: 'Inter, sans-serif' }} data-testid="contact-submit-btn">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;
