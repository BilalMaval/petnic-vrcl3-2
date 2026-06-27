import { Suspense } from 'react';
import DigitalDownloadsPageClient from '@/components/views/DigitalDownloadsPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Digital Downloads - Pet Templates, Presets & eBooks | Petnic Studio',
  description: 'Instant download professional pet templates, Lightroom presets, pet care eBooks, courses & printables. Digital products for pet lovers.',
  alternates: {
    canonical: `${SITE_URL}/digital-downloads`,
  },
  openGraph: {
    title: 'Digital Downloads - Pet Templates, Presets & eBooks | Petnic Studio',
    description: 'Instant download professional pet templates, Lightroom presets, eBooks & printables.',
    url: `${SITE_URL}/digital-downloads`,
  },
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
    </div>
  );
}

export default function DigitalDownloadsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DigitalDownloadsPageClient />
    </Suspense>
  );
}
