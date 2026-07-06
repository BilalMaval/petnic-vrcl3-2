"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, Calendar, ArrowLeft, Tag, Share2, Loader2 } from 'lucide-react';
import { blogPosts as fallbackPosts } from '@/config/static-data';

export default function BlogPostClient({ slug, initialPost = null }) {
  const [post, setPost] = useState(initialPost);
  const [loading, setLoading] = useState(!initialPost);

  useEffect(() => {
    if (initialPost) return; // Already hydrated server-side
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blog?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.post) {
          setPost(data.post);
        } else {
          const fallback = fallbackPosts.find((p) => p.slug === slug);
          if (fallback) {
            setPost({
              ...fallback,
              blog_categories: { name: fallback.category },
              content: `<p>${fallback.excerpt}</p>`,
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch post:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Legacy fetchPost removed; inline fetcher in the effect above is the source of truth.

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] py-20 text-center">
        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-4">Article Not Found</h1>
        <Link href="/blog" className="text-[#F97316] font-semibold hover:underline">
          ← Back to Blog
        </Link>
      </main>
    );
  }

  // If full_html_page is provided, render ONLY the HTML content (header/footer come from layout)
  if (post.full_html_page) {
    return (
      <main className="min-h-screen" data-testid="blog-post-page">
        <div 
          className="blog-full-page w-full"
          dangerouslySetInnerHTML={{ __html: post.full_html_page }}
        />
      </main>
    );
  }

  // Standard blog post layout
  return (
    <main className="min-h-screen bg-[#FAFAFA]" data-testid="blog-post-page">
      <article className="w-full py-10">
        {/* Back link */}
        <div className="px-4 sm:px-6 lg:px-12 xl:px-20">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[#F97316] font-semibold mb-6 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <span className="inline-flex items-center gap-1 text-[#F97316] text-xs font-bold uppercase tracking-wider mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              <Tag className="w-3 h-3" /> {post.blog_categories?.name || post.category}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> {post.author_name || post.author?.name}</span>
              {(post.author_role || post.author?.role) && (
                <span className="text-gray-400">• {post.author_role || post.author?.role}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(post.published_at) || post.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {post.read_time || post.readTime}</span>
            </div>
          </header>
        </div>

        {/* Featured Image - Half screen height */}
        {(post.image_url || post.image) && (
          <div className="relative w-full h-[50vh] mb-8">
            <Image
              src={post.image_url || post.image}
              alt={post.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}

        {/* Content - Full width HTML content from admin */}
        <div 
          className="blog-content w-full mb-12"
          style={{ fontFamily: 'Inter, sans-serif' }}
          dangerouslySetInnerHTML={{ __html: post.content || `<p>${post.excerpt}</p>` }}
        />

        {/* Share */}
        <div className="px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="flex items-center gap-4 pt-8 border-t border-gray-200">
            <span className="font-semibold text-[#1A1A2E]">Share this article:</span>
            <button className="p-2 bg-gray-100 rounded-lg hover:bg-[#F97316] hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </article>
    </main>
  );
}
