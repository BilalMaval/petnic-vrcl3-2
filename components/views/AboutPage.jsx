"use client";
import React from 'react';
import Link from 'next/link';
import { Heart, Award, Sparkles, Lock } from 'lucide-react';
import { GRADIENTS, DEFAULT_GRADIENT, DEFAULT_AVATAR } from '@/lib/team-gradients';

// team: array of visible members from the database; null/empty keeps the
// original general "Our Team" text. Everything is rendered as plain text.
const AboutPage = ({ team = null }) => {
  const hasTeam = Array.isArray(team) && team.length > 0;
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>About Petnic Studio</h1>
        <p className="text-[#4A4A68] text-lg leading-relaxed mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          Petnic Studio LLC is an online customization and e-commerce business established in 2026. We transform customer-supplied pet photographs into personalized artwork that can be purchased digitally or printed on selected products through our production and fulfillment partners.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Heart, title: 'Our Mission', text: 'To help pet parents celebrate the bond with their companions through personalized, quality products.' },
            { icon: Award, title: 'Quality Promise', text: 'Every product is made to order and backed by our 30-day satisfaction guarantee.' },
            { icon: Sparkles, title: 'Made to Order', text: 'Each portrait and product is personalized to your pet — nothing is mass-produced or pre-made.' },
            { icon: Lock, title: 'Secure Checkout', text: 'Payments are processed securely through Stripe and PayPal, and your information is never shared.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100">
              <Icon className="w-8 h-8 text-[#F97316] mb-3" />
              <h2 className="text-lg font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h2>
              <p className="text-sm text-[#4A4A68] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{text}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>{hasTeam ? 'Meet the Team' : 'Our Team'}</h2>
          <p className="text-[#4A4A68] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            Our small team handles design, product development, and customer support, working with production and fulfillment partners to bring your pet's personality to life on every order.
          </p>
          {hasTeam && (
            <div className="grid sm:grid-cols-2 gap-6 mt-8" data-testid="team-grid">
              {team.map((m) => (
                <div key={m.id} className="flex gap-4 items-start border border-gray-100 rounded-xl p-5" data-testid={`team-card-${m.name}`}>
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.name} width={80} height={80} loading="lazy" className="w-20 h-20 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shrink-0 ${GRADIENTS[m.gradient] || GRADIENTS[DEFAULT_GRADIENT]}`} aria-hidden="true">{m.avatar || DEFAULT_AVATAR}</div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>{m.name}</h3>
                    <p className="text-sm text-[#F97316] font-medium">{m.role}</p>
                    {m.bio && <p className="text-sm text-[#4A4A68] leading-relaxed mt-2 whitespace-pre-line">{m.bio}</p>}
                    {m.badge && <span className="inline-block mt-3 text-xs font-medium bg-orange-50 text-[#F97316] rounded-full px-3 py-1">{m.badge}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default AboutPage;
