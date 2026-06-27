import AffiliatePageClient from '@/components/views/AffiliatePage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = { 
  title: 'Affiliate Program - Earn Commission | Petnic Studio',
  description: 'Join the Petnic Studio affiliate program. Earn 15% commission on every sale. Perfect for pet bloggers, influencers, and pet care professionals.',
  alternates: { canonical: `${SITE_URL}/affiliate` },
  openGraph: { title: 'Affiliate Program | Petnic Studio', url: `${SITE_URL}/affiliate` },
};

export default function AffiliatePage() { return <AffiliatePageClient />; }
