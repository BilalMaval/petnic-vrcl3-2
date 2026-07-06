import BlogPageClient from '@/components/views/BlogPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const revalidate = 300;

export const metadata = {
  title: 'Pet Care Blog - Expert Tips & Advice | Petnic Studio',
  description: 'Expert pet care tips, portrait guides & personalization ideas. Grooming, health, training & photography advice from the Petnic Studio team.',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Pet Care Blog - Expert Tips & Advice | Petnic Studio',
    description: 'Expert pet care tips, portrait guides & personalization ideas from the Petnic Studio team.',
    url: `${SITE_URL}/blog`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'Petnic Studio Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pet Care Blog - Expert Tips & Advice | Petnic Studio',
    description: 'Expert pet care tips, portrait guides & personalization ideas from the Petnic Studio team.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
