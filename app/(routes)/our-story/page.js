import OurStoryPageClient from '@/components/views/OurStoryPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = { 
  title: 'Our Story - How Petnic Studio Started | Custom Pet Portraits',
  description: 'Learn the story behind Petnic Studio LLC, an online business established in 2026 creating custom pet portraits and personalized products.',
  alternates: { canonical: `${SITE_URL}/our-story` },
  openGraph: { title: 'Our Story | Petnic Studio', url: `${SITE_URL}/our-story` },
};

export default function OurStoryPage() { return <OurStoryPageClient />; }
