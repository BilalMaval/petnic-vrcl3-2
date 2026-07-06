import HeroSection from '@/components/sections/HeroSection';
import TrustBadges from '@/components/sections/TrustBadges';
import HowItWorks from '@/components/sections/HowItWorks';
import Categories from '@/components/sections/Categories';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import Testimonials from '@/components/sections/Testimonials';
import FAQSection from '@/components/sections/FAQSection';
import CTASection from '@/components/sections/CTASection';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Custom Pet Portraits - Personalized Art for Every Furry Friend | Petnic Studio',
  description: 'Create stunning custom pet portraits from your photos. Shop personalized canvas prints, framed art, mugs & more. 48,000+ 5-star reviews. Free shipping over $50. Transform your pet into art!',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'Custom Pet Portraits - Personalized Art for Every Furry Friend | Petnic Studio',
    description: 'Create stunning custom pet portraits from your photos. Shop personalized canvas prints, framed art & more. 48,000+ 5-star reviews.',
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'Petnic Studio - Custom Pet Portraits' }],
  },
};

// Organization Schema
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Petnic Studio',
  url: SITE_URL,
  logo: `${SITE_URL}/petnic-logo.png`,
  description: 'Create stunning custom pet portraits from your photos. Personalized canvas prints, framed art, and more.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hello@petnicstudio.com',
    contactType: 'customer service',
  },
  sameAs: [
    'https://facebook.com/petnicstudio',
    'https://instagram.com/petnicstudio',
    'https://twitter.com/petnicstudio',
    'https://pinterest.com/petnicstudio',
  ],
};

// WebSite Schema with SearchAction
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Petnic Studio',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/shop?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

// FAQ Schema
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How long does it take to receive my custom pet portrait?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Digital proofs are typically ready within 2-3 business days. Once approved, physical prints ship within 5-7 business days. Rush options are available for urgent orders.',
      },
    },
    {
      '@type': 'Question',
      name: 'What photo quality do I need for a good portrait?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We recommend clear, well-lit photos where your pet\'s face is visible. Phone photos work great! Our artists can work with most images, but higher resolution photos produce the best results.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I customize the art style of my pet portrait?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! We offer 50+ unique art styles including watercolor, oil painting, pop art, renaissance, and more. You can preview different styles before ordering.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer refunds if I\'m not satisfied?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely! We offer a 100% satisfaction guarantee. If you\'re not happy with your portrait, we\'ll revise it for free or provide a full refund.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I include multiple pets in one portrait?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Multi-pet portraits are one of our most popular options. You can include up to 5 pets in a single portrait. Each additional pet has a small fee.',
      },
    },
  ],
};

export default function HomePage() {
  return (
    <main>
      {/* Schema Markup */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <HeroSection />
      <TrustBadges />
      <HowItWorks />
      <Categories />
      <FeaturedProducts />
      <Testimonials />
      <FAQSection />
      <CTASection />
    </main>
  );
}
