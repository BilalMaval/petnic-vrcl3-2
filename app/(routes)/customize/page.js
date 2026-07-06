import CustomizePageClient from '@/components/views/CustomizePage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Create Custom Pet Portrait - AI-Powered Design Tool | Petnic Studio',
  description: 'Upload your pet photo, choose from 50+ art styles, preview on 200+ products. Real-time AI-powered customization. Create your unique masterpiece today!',
  alternates: {
    canonical: `${SITE_URL}/customize`,
  },
  openGraph: {
    title: 'Create Custom Pet Portrait - AI-Powered Design Tool | Petnic Studio',
    description: 'Upload your pet photo, choose from 50+ art styles, preview on 200+ products instantly.',
    url: `${SITE_URL}/customize`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'Create Custom Pet Portrait' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Custom Pet Portrait - AI-Powered Design Tool | Petnic Studio',
    description: 'Upload your pet photo, choose from 50+ art styles, preview on 200+ products instantly.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default function CustomizePage() {
  return <CustomizePageClient />;
}
