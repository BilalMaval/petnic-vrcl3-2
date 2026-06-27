import OurStoryPageClient from '@/components/views/OurStoryPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = { 
  title: 'Our Story - How Petnic Studio Started | Custom Pet Portraits',
  description: 'Learn the story behind Petnic Studio - from a passion project honoring a beloved pet to serving 150,000+ customers worldwide with custom pet portraits.',
  alternates: { canonical: `${SITE_URL}/our-story` },
  openGraph: { title: 'Our Story | Petnic Studio', url: `${SITE_URL}/our-story` },
};

export default function OurStoryPage() { return <OurStoryPageClient />; }
