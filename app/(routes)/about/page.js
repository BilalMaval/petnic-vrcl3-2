import AboutPageClient from '@/components/views/AboutPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = { 
  title: 'About Petnic Studio - Our Story & Mission | Custom Pet Portraits',
  description: 'Learn about Petnic Studio - from a small passion project to serving 150,000+ customers worldwide. Our mission: celebrate the bond between pets and their people.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'About Petnic Studio - Our Story & Mission',
    description: 'From a small passion project to serving 150,000+ customers worldwide.',
    url: `${SITE_URL}/about`,
  },
};

export default function AboutPage() { return <AboutPageClient />; }
