"use client";
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { CartProvider } from '@/lib/cart-context';
import { captureAttribution } from '@/lib/analytics';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    // First-touch capture of utm_*/fbclid params for future marketing
    // attribution - no-ops if none are present or already captured.
    captureAttribution();
  }, [pathname]);

  if (isAdmin) return <>{children}</>;

  return (
    <CartProvider>
      <Navbar />
      {children}
      <Footer />
    </CartProvider>
  );
}
