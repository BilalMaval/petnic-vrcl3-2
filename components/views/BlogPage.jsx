"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, User, Calendar, ArrowRight, Search, Tag, Loader2 } from 'lucide-react';
import { blogPosts as fallbackPosts } from '@/config/static-data';

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [activeCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/blog/categories');
      const data = await res.json();
      if (data.categories?.length > 0) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = activeCategory === 'all' 
        ? '/api/blog' 
        : `/api/blog?category=${activeCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.posts?.length > 0) {
        setPosts(data.posts);
      } else {
        // Use fallback static data if no posts in DB
        setPosts(fallbackPosts.map(p => ({
          ...p,
          blog_categories: { name: p.category, slug: p.category.toLowerCase().replace(/\s+/g, '-') }
        })));
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setPosts(fallbackPosts.map(p => ({
        ...p,
        blog_categories: { name: p.category, slug: p.category.toLowerCase().replace(/\s+/g, '-') }
      })));
    } finally {
      setLoading(false);
    }
  };

  const filtered = posts.filter((p) => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredPost = posts.find((p) => p.featured);
  const regularPosts = filtered.filter((p) => p.id !== featuredPost?.id);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const allCategories = categories.length > 0 
    ? [{ slug: 'all', name: 'All' }, ...categories]
    : [{ slug: 'all', name: 'All' }, { slug: 'home-decor', name: 'Home Decor' }, { slug: 'pet-health', name: 'Pet Health' }, { slug: 'pet-care', name: 'Pet Care' }, { slug: 'photography', name: 'Photography' }];

  return (
    <main className="min-h-screen bg-[#FAFAFA]" data-testid="blog-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            Pet Care Blog & Expert Tips
          </h1>
          <p className="text-[#4A4A68] text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
            Expert advice from veterinarians, pet photographers & certified trainers
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-[#F97316] text-white'
                    : 'bg-white text-[#4A4A68] border border-gray-200 hover:border-[#F97316] hover:text-[#F97316]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
                data-testid={`blog-category-${cat.slug}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:border-[#F97316] focus:ring-1 focus:ring-orange-100 outline-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
              data-testid="blog-search"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && activeCategory === 'all' && (
              <div className="mb-12 group">
                <Link href={`/blog/${featuredPost.slug}`} className="block">
                  <div className="grid md:grid-cols-2 gap-6 bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="overflow-hidden">
                      <img
                        src={featuredPost.image_url || featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-full min-h-[300px] object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <span className="inline-flex items-center gap-1 text-[#F97316] text-xs font-bold uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <Tag className="w-3 h-3" /> {featuredPost.blog_categories?.name || featuredPost.category} • Featured
                      </span>
                      <h2 className="text-2xl font-bold text-[#1A1A2E] mb-3 group-hover:text-[#F97316] transition-colors" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {featuredPost.title}
                      </h2>
                      <p className="text-[#4A4A68] text-sm leading-relaxed mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {featuredPost.author_name || featuredPost.author?.name}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(featuredPost.published_at) || featuredPost.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featuredPost.read_time || featuredPost.readTime}</span>
                      </div>
                      <span className="text-[#F97316] font-semibold text-sm flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Read Full Article <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Blog Grid */}
            {regularPosts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-[#4A4A68]">No articles found</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block">
                    <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-orange-100 transition-all duration-300 group h-full">
                      <div className="overflow-hidden">
                        <img
                          src={post.image_url || post.image}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5">
                        <span className="text-xs font-semibold text-[#F97316] uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {post.blog_categories?.name || post.category}
                        </span>
                        <h3 className="text-lg font-bold text-[#1A1A2E] mt-1 mb-2 line-clamp-2 group-hover:text-[#F97316] transition-colors" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {post.title}
                        </h3>
                        <p className="text-[#4A4A68] text-sm leading-relaxed line-clamp-2 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author_name || post.author?.name}</span>
                          </div>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.read_time || post.readTime}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Stay Updated */}
        <div className="mt-16 bg-[#F97316] rounded-2xl p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Stay Updated
          </h2>
          <p className="text-white/85 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Get the latest pet care tips, expert guides & stories delivered to your inbox
          </p>
          <div className="flex max-w-lg mx-auto gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl outline-none text-sm"
              style={{ fontFamily: 'Inter, sans-serif' }}
              data-testid="newsletter-email"
            />
            <button className="px-6 py-3 bg-[#1A1A2E] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A4E] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }} data-testid="newsletter-submit">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BlogPage;
