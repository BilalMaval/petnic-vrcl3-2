"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Shared layout for legal/policy pages.
 * Renders a sticky table-of-contents sidebar and well-spaced sections.
 *
 * Props:
 *  - title:     string
 *  - intro:     string | ReactNode
 *  - effective: string (ISO date or formatted string)
 *  - sections:  Array<{ id: string, heading: string, body: ReactNode }>
 */
const LegalPage = ({ title, intro, effective, sections = [] }) => {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const handler = () => {
      const positions = sections
        .map((s) => {
          const el = typeof document !== 'undefined' ? document.getElementById(s.id) : null;
          if (!el) return null;
          return { id: s.id, top: el.getBoundingClientRect().top };
        })
        .filter(Boolean);
      const current = positions
        .filter((p) => p.top < 160)
        .sort((a, b) => b.top - a.top)[0];
      if (current) setActive(current.id);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [sections]);

  return (
    <main className="min-h-screen bg-[#FAFAFA]" data-testid="legal-page">
      <div className="bg-gradient-to-b from-orange-50/60 to-transparent border-b border-orange-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <nav className="text-xs text-[#4A4A68] mb-3 flex items-center gap-1.5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#F97316]">Home</Link>
            <span>/</span>
            <span className="text-[#1A1A2E] font-medium">{title}</span>
          </nav>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A2E] mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
            data-testid="legal-page-title"
          >
            {title}
          </h1>
          {effective && (
            <p className="text-sm text-[#4A4A68]">
              Effective date: <span className="font-medium text-[#1A1A2E]">{effective}</span>
            </p>
          )}
          {intro && (
            <p className="text-base text-[#4A4A68] mt-4 max-w-3xl leading-relaxed">
              {intro}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-[240px_1fr] gap-10">
        {/* TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-[11px] uppercase tracking-wider text-[#4A4A68] font-semibold mb-3">
              On this page
            </p>
            <ul className="space-y-1.5 border-l border-gray-200">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`block pl-4 -ml-px py-1 text-sm transition-colors border-l-2 ${
                      active === s.id
                        ? 'border-[#F97316] text-[#1A1A2E] font-medium'
                        : 'border-transparent text-[#4A4A68] hover:text-[#1A1A2E]'
                    }`}
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 sm:px-10 py-10 space-y-10">
            {sections.map((s, idx) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2
                  className="text-xl sm:text-2xl font-bold text-[#1A1A2E] mb-3"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  <span className="text-[#F97316] mr-2">{String(idx + 1).padStart(2, '0')}.</span>
                  {s.heading}
                </h2>
                <div
                  className="prose prose-sm sm:prose-base max-w-none text-[#4A4A68] [&_a]:text-[#F97316] [&_a]:no-underline hover:[&_a]:underline [&_strong]:text-[#1A1A2E] [&_h3]:text-[#1A1A2E] [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {s.body}
                </div>
              </section>
            ))}

            <div className="border-t border-gray-100 pt-6 text-sm text-[#4A4A68]">
              Questions? Reach us at{' '}
              <a href="mailto:info@petnicstudio.com" className="text-[#F97316] hover:underline">
                info@petnicstudio.com
              </a>
              .
            </div>
          </div>
        </article>
      </div>
    </main>
  );
};

export default LegalPage;
