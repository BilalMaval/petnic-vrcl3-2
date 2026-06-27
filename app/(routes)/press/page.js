import PressPageClient from '@/components/views/PressPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = { 
  title: 'Press & Media Coverage | Petnic Studio',
  description: 'Petnic Studio in the news - Forbes, TechCrunch, Pet Business Magazine and more. For media inquiries contact press@petnicstudio.com.',
  alternates: { canonical: `${SITE_URL}/press` },
  openGraph: { title: 'Press & Media | Petnic Studio', url: `${SITE_URL}/press` },
};

export default function PressPage() { return <PressPageClient />; }
