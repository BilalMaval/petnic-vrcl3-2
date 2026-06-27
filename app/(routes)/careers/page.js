import CareersPageClient from '@/components/views/CareersPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = { 
  title: 'Careers at Petnic Studio - Join Our Team',
  description: 'Join the Petnic Studio team! We\'re hiring passionate pet lovers for roles in design, customer service, marketing and more. Remote-friendly positions available.',
  alternates: { canonical: `${SITE_URL}/careers` },
  openGraph: { title: 'Careers | Petnic Studio', url: `${SITE_URL}/careers` },
};

export default function CareersPage() { return <CareersPageClient />; }
