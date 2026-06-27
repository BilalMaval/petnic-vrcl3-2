import { Suspense } from 'react';
import PrintOnDemandPageClient from '@/components/views/PrintOnDemandPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Print on Demand Pet Portraits - Canvas, Framed Art & Posters | Petnic Studio',
  description: 'Create stunning custom pet portraits on premium canvas, framed art, posters & photo gifts. 50+ art styles with AI-powered enhancement. Free shipping over $50.',
  alternates: {
    canonical: `${SITE_URL}/print-on-demand`,
  },
  openGraph: {
    title: 'Print on Demand Pet Portraits - Canvas, Framed Art & Posters | Petnic Studio',
    description: 'Create stunning custom pet portraits on premium canvas, framed art & more. 50+ art styles.',
    url: `${SITE_URL}/print-on-demand`,
  },
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
    </div>
  );
}

export default function PrintOnDemandPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PrintOnDemandPageClient />
    </Suspense>
  );
}
