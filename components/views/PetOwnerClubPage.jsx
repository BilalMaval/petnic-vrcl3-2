"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Percent, Download, Headphones, Users, Truck, Gift, Check, Crown, MessageSquare, ThumbsUp, Eye, Pin, ChevronRight, Plus, Send, ArrowLeft, User, Clock, Loader2 } from 'lucide-react';
import { clubBenefits } from '@/config/static-data';

const iconMap = { Percent, Download, Headphones, Users, Truck, Gift };

const plans = [
  {
    name: 'Free Member',
    price: 0,
    period: '',
    features: ['Access to community forums', 'Monthly pet tips newsletter', 'Birthday reminders', '5% member discount'],
    cta: 'Join Free',
    popular: false,
  },
  {
    name: 'Premium Member',
    price: 9.99,
    period: '/month',
    features: ['Everything in Free', '20% off every order', 'Free monthly digital download', 'Priority support (24/7)', 'Free shipping always', 'Exclusive early access to sales', 'Birthday surprise gift'],
    cta: 'Start Premium',
    popular: true,
  },
  {
    name: 'VIP Lifetime',
    price: 149.99,
    period: 'one-time',
    features: ['Everything in Premium, forever', '30% off every order', '2 free digital downloads/month', 'Personal pet art consultant', 'VIP event invitations', 'Annual custom portrait (free)', 'Lifetime priority support'],
    cta: 'Go VIP',
    popular: false,
  },
];

const forumCategories = [
  { id: 'portraits', name: 'Pet Portraits & Art', description: 'Share your custom portraits, get feedback, and show off your walls', icon: '🎨' },
  { id: 'health', name: 'Pet Health & Nutrition', description: 'Discuss diet, supplements, vet visits and wellness tips', icon: '🏥' },
  { id: 'training', name: 'Training & Behavior', description: 'Positive reinforcement techniques, puppy training, and behavioral advice', icon: '🐾' },
  { id: 'reviews', name: 'Product Reviews', description: 'Honest reviews of Petnic Studio products and pet care items', icon: '⭐' },
  { id: 'photography', name: 'Pet Photography Tips', description: 'Capture the perfect shot of your furry friend', icon: '📸' },
  { id: 'general', name: 'General Discussion', description: 'Off-topic chat, introductions, and community events', icon: '💬' },
];

const PetOwnerClubPage = () => {
  const [activeTab, setActiveTab] = useState('community');
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', category: 'general' });
  const [newReply, setNewReply] = useState('');
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Scroll to top when showing new thread form
  useEffect(() => {
    if (showNewThread || selectedThread) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showNewThread, selectedThread]);

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch {}
    }

    const handleAuthChange = () => {
      const updated = localStorage.getItem('user_data');
      setUser(updated ? JSON.parse(updated) : null);
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  useEffect(() => {
    if (activeTab === 'community') {
      fetchThreads();
    }
  }, [activeTab, selectedCategory]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const url = selectedCategory === 'all' 
        ? '/api/forum/threads' 
        : `/api/forum/threads?category=${selectedCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreadDetail = async (threadId) => {
    try {
      const res = await fetch(`/api/forum/threads/${threadId}`);
      const data = await res.json();
      setSelectedThread(data.thread);
      setThreadReplies(data.replies || []);
    } catch (error) {
      console.error('Failed to fetch thread:', error);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/auth'); return; }
    if (!newThread.title.trim() || !newThread.content.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newThread),
      });

      if (res.ok) {
        setNewThread({ title: '', content: '', category: 'general' });
        setShowNewThread(false);
        fetchThreads();
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/auth'); return; }
    if (!newReply.trim() || !selectedThread) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch(`/api/forum/threads/${selectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newReply }),
      });

      if (res.ok) {
        const data = await res.json();
        setThreadReplies([...threadReplies, data.reply]);
        setNewReply('');
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA]" data-testid="pet-owner-club-page">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF0E0] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 bg-orange-100 text-[#F97316] px-4 py-2 rounded-full text-sm font-semibold mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Crown className="w-4 h-4" /> Join 50,000+ Pet Loving Members
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            The Pet Owner Club
          </h1>
          <p className="text-[#4A4A68] text-lg max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Exclusive perks, premium discounts, free downloads & a thriving community of pet lovers.
          </p>
          {!user && (
            <Link href="/auth" className="inline-flex items-center gap-2 mt-6 bg-[#F97316] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors" data-testid="join-club-btn">
              Join the Club <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-[72px] z-40" id="club-tabs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {[
              { id: 'community', label: 'Community Forum' },
              { id: 'benefits', label: 'Member Benefits' },
              { id: 'pricing', label: 'Membership Plans' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { 
                  setActiveTab(tab.id); 
                  setSelectedThread(null);
                  // Scroll to content section
                  setTimeout(() => {
                    const content = document.getElementById('club-content');
                    if (content) {
                      content.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? 'border-[#F97316] text-[#F97316]' : 'border-transparent text-[#4A4A68] hover:text-[#F97316]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id="club-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Community Forum Tab */}
        {activeTab === 'community' && (
          <div className="space-y-8">
            {selectedThread ? (
              /* Thread Detail View */
              <div className="space-y-6" data-testid="thread-detail">
                <button 
                  onClick={() => setSelectedThread(null)} 
                  className="flex items-center gap-2 text-[#F97316] font-semibold hover:underline"
                  data-testid="back-to-threads-btn"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Threads
                </button>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {selectedThread.users?.name?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{selectedThread.title}</h2>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                        <span className="font-medium text-[#4A4A68]">{selectedThread.users?.name || 'Anonymous'}</span>
                        <span className="px-2 py-0.5 bg-orange-100 text-[#F97316] rounded">{selectedThread.category}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(selectedThread.created_at)}</span>
                      </div>
                      <p className="text-[#4A4A68] whitespace-pre-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>{selectedThread.content}</p>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1A1A2E]">{threadReplies.length} Replies</h3>
                  {threadReplies.map((reply) => (
                    <div key={reply.id} className="bg-white rounded-xl border border-gray-100 p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {reply.users?.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-[#1A1A2E] text-sm">{reply.users?.name || 'Anonymous'}</span>
                            <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
                          </div>
                          <p className="text-[#4A4A68] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleReply} className="bg-white rounded-xl border border-gray-100 p-5">
                  {user ? (
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.name?.[0] || 'U'}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          placeholder="Write your reply..."
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] outline-none resize-none h-24 text-sm"
                          data-testid="reply-input"
                        />
                        <button 
                          type="submit" 
                          disabled={submitting || !newReply.trim()}
                          className="mt-3 flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#EA6C10] transition-colors disabled:opacity-50"
                          data-testid="submit-reply-btn"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Post Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-3">Sign in to join the conversation</p>
                      <Link href="/auth" className="inline-flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#EA6C10]">
                        <User className="w-4 h-4" /> Sign In
                      </Link>
                    </div>
                  )}
                </form>
              </div>
            ) : showNewThread ? (
              /* New Thread Form */
              <div className="bg-white rounded-xl border border-gray-100 p-6" data-testid="new-thread-form">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Create New Thread</h2>
                  <button onClick={() => setShowNewThread(false)} className="text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateThread} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Category</label>
                    <select
                      value={newThread.category}
                      onChange={(e) => setNewThread({ ...newThread, category: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] outline-none"
                      data-testid="thread-category-select"
                    >
                      {forumCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Title</label>
                    <input
                      type="text"
                      value={newThread.title}
                      onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                      placeholder="What's your thread about?"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] outline-none"
                      data-testid="thread-title-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-1">Content</label>
                    <textarea
                      value={newThread.content}
                      onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                      placeholder="Share your thoughts, questions, or experiences..."
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F97316] outline-none resize-none h-40"
                      data-testid="thread-content-input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !newThread.title.trim() || !newThread.content.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-[#F97316] text-white py-3 rounded-lg font-semibold hover:bg-[#EA6C10] transition-colors disabled:opacity-50"
                    data-testid="submit-thread-btn"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Post Thread
                  </button>
                </form>
              </div>
            ) : (
              /* Forum List View */
              <>
                {/* Forum Categories */}
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Forum Categories</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`bg-white rounded-xl p-5 border text-left hover:shadow-md transition-all ${selectedCategory === 'all' ? 'border-[#F97316] bg-orange-50' : 'border-gray-100 hover:border-orange-100'}`}
                      data-testid="category-all-btn"
                    >
                      <span className="text-2xl">🌟</span>
                      <h3 className="text-sm font-bold text-[#1A1A2E] mt-2">All Discussions</h3>
                      <p className="text-xs text-gray-400 mt-1">Browse all forum threads</p>
                    </button>
                    {forumCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`bg-white rounded-xl p-5 border text-left hover:shadow-md transition-all ${selectedCategory === cat.id ? 'border-[#F97316] bg-orange-50' : 'border-gray-100 hover:border-orange-100'}`}
                        data-testid={`category-${cat.id}-btn`}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <h3 className="text-sm font-bold text-[#1A1A2E] mt-2">{cat.name}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{cat.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Threads */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {selectedCategory === 'all' ? 'Recent Threads' : forumCategories.find(c => c.id === selectedCategory)?.name || 'Threads'}
                    </h2>
                    <button 
                      onClick={() => user ? setShowNewThread(true) : router.push('/auth')}
                      className="flex items-center gap-2 text-sm bg-[#F97316] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#EA6C10] transition-colors"
                      data-testid="new-thread-btn"
                    >
                      <Plus className="w-4 h-4" /> New Thread
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No threads yet in this category</p>
                      <button 
                        onClick={() => user ? setShowNewThread(true) : router.push('/auth')}
                        className="text-[#F97316] font-semibold hover:underline"
                      >
                        Be the first to start a discussion!
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                      {threads.map((thread) => (
                        <button
                          key={thread.id}
                          onClick={() => fetchThreadDetail(thread.id)}
                          className="w-full p-5 hover:bg-orange-50/30 transition-colors text-left"
                          data-testid={`thread-${thread.id}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {thread.users?.name?.[0] || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-[#1A1A2E] hover:text-[#F97316] transition-colors truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{thread.title}</h3>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{thread.content}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                                <span className="font-medium text-[#4A4A68]">{thread.users?.name || 'Anonymous'}</span>
                                <span className="px-2 py-0.5 bg-gray-100 rounded">{thread.category}</span>
                                <span>{formatDate(thread.created_at)}</span>
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {thread.forum_replies?.[0]?.count || 0}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Benefits Tab */}
        {activeTab === 'benefits' && (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E] mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>Member Benefits</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubBenefits.map((b) => {
                const Icon = iconMap[b.icon];
                return (
                  <div key={b.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-orange-100 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-[#FFF0E0] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#F97316] transition-colors">
                      <Icon className="w-6 h-6 text-[#F97316] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{b.title}</h3>
                    <p className="text-sm text-[#4A4A68]" style={{ fontFamily: 'Inter, sans-serif' }}>{b.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E] text-center mb-10" style={{ fontFamily: 'Playfair Display, serif' }}>Choose Your Membership</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-6 border-2 transition-all hover:-translate-y-1 ${
                    plan.popular ? 'border-[#F97316] bg-[#FFF8F0] shadow-xl relative' : 'border-gray-100 bg-white hover:border-orange-200'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-xs font-bold px-4 py-1 rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-[#F97316]" style={{ fontFamily: 'Inter, sans-serif' }}>${plan.price}</span>
                    <span className="text-sm text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[#4A4A68]" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => user ? null : router.push('/auth')}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      plan.popular ? 'bg-[#F97316] text-white hover:bg-[#EA6C10]' : 'bg-gray-100 text-[#1A1A2E] hover:bg-[#F97316] hover:text-white'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    data-testid={`plan-${plan.name.toLowerCase().replace(' ', '-')}-btn`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default PetOwnerClubPage;
