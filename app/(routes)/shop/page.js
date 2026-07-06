import Script from 'next/script';
import ShopPageClient from '@/components/views/ShopPage';
import { fetchShopData } from '@/lib/shop';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Shop Custom Pet Portraits & Personalized Pet Products | Petnic Studio',
  description: 'Browse 200+ personalized pet portraits, canvas prints, wall art, mugs, blankets & more. Upload your photo, choose from 50+ art styles. Free shipping over $50.',
  alternates: {
    canonical: `${SITE_URL}/shop`,
  },
  openGraph: {
    title: 'Shop Custom Pet Portraits & Personalized Pet Products | Petnic Studio',
    description: 'Browse 200+ personalized pet portraits. Upload your photo, choose from 50+ styles. Free shipping over $50.',
    url: `${SITE_URL}/shop`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'Shop Custom Pet Products' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Custom Pet Portraits & Personalized Pet Products | Petnic Studio',
    description: 'Browse 200+ personalized pet portraits. Upload your photo, choose from 50+ styles. Free shipping over $50.',
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export const revalidate = 300;

export default async function ShopPage() {
  const { products, categories } = await fetchShopData();

  const itemListSchema = products?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Custom Pet Products',
    url: `${SITE_URL}/shop`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/product/${p.slug}`,
      name: p.name,
    })),
  } : null;

  return (
    <>
      {itemListSchema && (
        <Script
          id="shop-itemlist-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <ShopPageClient
        initialProducts={products}
        initialCategories={categories}
      />
    </>
  );
}
