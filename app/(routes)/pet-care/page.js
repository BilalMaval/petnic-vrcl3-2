import { Suspense } from 'react';
import PetCarePageClient from '@/components/views/PetCarePage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Premium Pet Care Products - Grooming, Nutrition & Health | Petnic Studio',
  description: 'Vet-approved grooming, nutrition, health & wellness products for dogs and cats. All-natural, cruelty-free pet care essentials.',
  alternates: {
    canonical: `${SITE_URL}/pet-care`,
  },
  openGraph: {
    title: 'Premium Pet Care Products - Grooming, Nutrition & Health | Petnic Studio',
    description: 'Vet-approved grooming, nutrition, health & wellness products for dogs and cats.',
    url: `${SITE_URL}/pet-care`,
  },
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
    </div>
  );
}

export default function PetCarePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PetCarePageClient />
    </Suspense>
  );
}
