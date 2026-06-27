import BlogPageClient from '@/components/views/BlogPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Pet Care Blog - Expert Tips & Advice | Petnic Studio',
  description: 'Expert advice from veterinarians, pet photographers & certified trainers. Pet health tips, training guides, grooming advice & photography techniques.',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Pet Care Blog - Expert Tips & Advice | Petnic Studio',
    description: 'Expert advice from veterinarians, pet photographers & certified trainers.',
    url: `${SITE_URL}/blog`,
  },
};

export default function BlogPage() {
  return <BlogPageClient />;
}
