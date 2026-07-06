"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, ArrowRight, Heart } from 'lucide-react';
import { footerLinks } from '@/config/static-data';

const PinterestIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (email) {
      try {
        await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch (err) {}
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-[#1A1A2E] text-gray-300">
      <div className="bg-[#F97316]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>Join 150,000+ Happy Pet Parents</h3>
              <p className="text-white/90 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Get exclusive deals, pet care tips & 15% off your first order</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="flex-1 md:w-72 px-4 py-3 rounded-xl bg-white text-gray-800 placeholder-gray-400 outline-none text-sm" required />
              <button type="submit" className="px-6 py-3 bg-[#1A1A2E] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A4E] transition-colors flex items-center gap-2">
                {subscribed ? 'Subscribed!' : 'Subscribe'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/petnic-logo.png" alt="Petnic Studio - Custom Pet Portraits" width={48} height={48} className="h-12 w-auto" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">Personalize your pet's story with stunning, custom art & premium care products. Museum-grade quality with love in every detail.</p>
            <div className="space-y-2.5 text-sm">
              <a href="mailto:info@petnicstudio.com" className="flex items-center gap-2.5 text-gray-400 hover:text-[#F97316] transition-colors"><Mail className="w-4 h-4" /><span>info@petnicstudio.com</span></a>
              <a href="tel:+15818918811" className="flex items-center gap-2.5 text-gray-400 hover:text-[#F97316] transition-colors"><Phone className="w-4 h-4" /><span>+1 (581) 891-8811</span></a>
              <div className="flex items-start gap-2.5 text-gray-400"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /><span>1001 S Main St Ste 12362<br />Kalispell, MT 59901</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              {[{ icon: Facebook, label: 'Facebook' }, { icon: Instagram, label: 'Instagram' }, { icon: Twitter, label: 'Twitter' }, { icon: Youtube, label: 'YouTube' }].map(({ icon: Icon, label }) => (
                <a key={label} href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F97316] transition-colors" aria-label={label}><Icon className="w-4 h-4" /></a>
              ))}
              <a href="https://pinterest.com/petnicstudio" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F97316] transition-colors" aria-label="Pinterest"><PinterestIcon /></a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2.5">{footerLinks.shop.map((link) => (<li key={link.label}><Link href={link.href} className="text-gray-400 hover:text-[#F97316] transition-colors text-sm">{link.label}</Link></li>))}</ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5">{footerLinks.resources.map((link) => (<li key={link.label}><Link href={link.href} className="text-gray-400 hover:text-[#F97316] transition-colors text-sm">{link.label}</Link></li>))}</ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">{footerLinks.company.map((link) => (<li key={link.label}><Link href={link.href} className="text-gray-400 hover:text-[#F97316] transition-colors text-sm">{link.label}</Link></li>))}</ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-[#F97316] transition-colors"
                data-testid={`footer-legal-${link.href.slice(1)}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-white/5">
            <p className="text-gray-500 text-xs">© 2025 Petnic Studio. All rights reserved. Made with <Heart className="w-3 h-3 inline text-[#F97316]" /> for pet lovers.</p>
            <p className="text-gray-500 text-xs flex items-center gap-2">
              <Link href="/contact" className="hover:text-gray-300 transition-colors">Contact Us</Link>
              <span aria-hidden="true">·</span>
              <span>Secure payments by Stripe</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
