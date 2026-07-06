"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, User, ShoppingCart, Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { navItems } from '@/config/static-data';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [cartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Check for user on mount
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch {}
    }

    // Listen for auth changes
    const handleAuthChange = () => {
      const updated = localStorage.getItem('user_data');
      setUser(updated ? JSON.parse(updated) : null);
    };
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setUserMenuOpen(false);
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-[#1A1A2E] text-white text-center py-2 text-sm font-medium tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
        Free Shipping on Orders Over $50 | Use Code <span className="text-orange-400 font-bold">PETNIC25</span> for 25% Off
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Image src="/petnic-logo.png" alt="Petnic Studio - Custom Pet Portraits" width={44} height={44} priority className="h-11 w-auto transition-transform group-hover:scale-105" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`px-3.5 py-2 text-[15px] font-medium rounded-lg transition-colors flex items-center gap-1 ${
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'text-[#F97316]'
                        : 'text-[#4A4A68] hover:text-[#F97316] hover:bg-orange-50'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {item.label}
                    {item.children && <ChevronDown className="w-3.5 h-3.5" />}
                  </Link>

                  {/* Dropdown */}
                  {item.children && activeDropdown === item.label && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(null);
                          }}
                          className="block px-4 py-2.5 text-sm text-[#4A4A68] hover:text-[#F97316] hover:bg-orange-50 transition-colors"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2.5 rounded-full hover:bg-gray-100 transition-colors text-[#4A4A68] hover:text-[#F97316]" aria-label="Search" data-testid="search-btn">
                <Search className="w-5 h-5" />
              </button>
              
              {/* User Menu */}
              <div className="relative">
                {user ? (
                  <>
                    <button 
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      data-testid="user-menu-btn"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-white text-sm font-bold">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </button>
                    
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50" data-testid="user-dropdown">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-[#1A1A2E] text-sm truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/account"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#4A4A68] hover:text-[#F97316] hover:bg-orange-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="my-account-link"
                        >
                          <User className="w-4 h-4" /> My Account
                        </Link>
                        <Link
                          href="/pet-owner-club"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#4A4A68] hover:text-[#F97316] hover:bg-orange-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ShoppingCart className="w-4 h-4" /> Pet Owner Club
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          data-testid="logout-btn"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link 
                    href="/auth" 
                    className="p-2.5 rounded-full hover:bg-gray-100 transition-colors text-[#4A4A68] hover:text-[#F97316]" 
                    aria-label="Account"
                    data-testid="login-btn"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>

              <button className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-[#4A4A68] hover:text-[#F97316]" aria-label="Cart" data-testid="cart-btn">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#F97316] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>
                )}
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2.5 rounded-full hover:bg-gray-100 transition-colors text-[#4A4A68]" aria-label="Menu" data-testid="mobile-menu-btn">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-gray-100 bg-white py-4 px-4 sm:px-6 lg:px-8 animate-in">
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search for pet portraits, care products, digital downloads..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 outline-none text-sm" style={{ fontFamily: 'Inter, sans-serif' }} autoFocus data-testid="search-input" />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white shadow-xl">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {user && (
                <div className="px-4 py-3 mb-2 bg-orange-50 rounded-lg">
                  <p className="font-semibold text-[#1A1A2E] text-sm">Welcome, {user.name}</p>
                  <div className="flex gap-3 mt-2">
                    <Link href="/account" className="text-xs text-[#F97316] font-medium">My Account</Link>
                    <button onClick={handleLogout} className="text-xs text-red-500 font-medium">Sign Out</button>
                  </div>
                </div>
              )}
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                      pathname === item.href ? 'text-[#F97316] bg-orange-50' : 'text-[#4A4A68] hover:text-[#F97316] hover:bg-orange-50'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="pl-6 space-y-1 mt-1">
                      {item.children.map((child) => (
                        <Link key={child.label} href={child.href} className="block px-4 py-2 text-sm text-gray-500 hover:text-[#F97316] rounded-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {!user && (
                <Link
                  href="/auth"
                  className="block px-4 py-3 mt-2 rounded-lg text-[15px] font-medium bg-[#F97316] text-white text-center"
                >
                  Sign In / Register
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
