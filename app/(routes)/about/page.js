import AboutPageClient from '@/components/views/AboutPage';
import { getVisibleTeam } from '@/lib/team';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = { 
  title: 'About Petnic Studio - Our Story & Mission | Custom Pet Portraits',
  description: 'Learn about Petnic Studio LLC, an online business established in 2026 creating personalized pet artwork and custom products.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'About Petnic Studio - Our Story & Mission',
    description: 'Petnic Studio LLC, established in 2026 - personalized pet artwork and custom products.',
    url: `${SITE_URL}/about`,
  },
};

// Edits in the admin refresh this page immediately; the timer is a safety net.
export const revalidate = 300;

export default async function AboutPage() {
  const team = await getVisibleTeam();
  return <AboutPageClient team={team} />;
}
