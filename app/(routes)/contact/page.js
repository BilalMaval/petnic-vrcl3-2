import ContactPageClient from '@/components/views/ContactPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = { 
  title: 'Contact Petnic Studio - Customer Support & Inquiries',
  description: 'Get in touch with Petnic Studio. Questions about custom pet portraits, orders, or partnerships? We\'re here to help. Fast response guaranteed.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: 'Contact Petnic Studio - Customer Support',
    description: 'Questions about custom pet portraits or orders? We\'re here to help.',
    url: `${SITE_URL}/contact`,
  },
};

export default function ContactPage() { return <ContactPageClient />; }
