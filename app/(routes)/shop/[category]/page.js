import Script from 'next/script';
import ShopPageClient from '@/components/views/ShopPage';
import { fetchShopData } from '@/lib/shop';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

// Category-specific SEO metadata
const categoryMeta = {
  'wall-art': {
    title: 'Custom Pet Wall Art & Canvas Prints | Petnic Studio',
    description: 'Shop custom pet canvas prints, framed portraits & poster art. 45+ art styles from watercolor to oil painting. Museum-quality prints. Free shipping over $50.',
  },
  'apparel': {
    title: 'Custom Pet Apparel & Accessories | Petnic Studio', 
    description: 'Personalized pet t-shirts, hoodies, hats & accessories featuring your pet\'s portrait. Premium quality, unique designs. Free shipping over $50.',
  },
  'home-living': {
    title: 'Personalized Pet Home & Living Products | Petnic Studio',
    description: 'Custom pet mugs, blankets, pillows & home decor. Make your home a tribute to your beloved pet. Free shipping over $50.',
  },
  'accessories': {
    title: 'Custom Pet Accessories & Gifts | Petnic Studio',
    description: 'Unique pet-themed phone cases, keychains, jewelry & more. Perfect gifts for pet lovers. Free shipping over $50.',
  },
};

export async function generateMetadata({ params }) {
  const { category } = await params;
  const meta = categoryMeta[category] || {
    title: `${category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - Custom Pet Products | Petnic Studio`,
    description: `Shop ${category.replace(/-/g, ' ')} - Personalized pet portraits and custom products. Free shipping over $50.`,
  };
  
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/shop/${category}`,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/shop/${category}`,
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: meta.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [`${SITE_URL}/og-image.jpg`],
    },
  };
}

export const revalidate = 300;

export default async function ShopCategoryPage({ params }) {
  const { category } = await params;
  const { products, categories } = await fetchShopData({ category });
  const meta = categoryMeta[category];
  const categoryName = meta
    ? meta.title.split('|')[0].trim()
    : category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const itemListSchema = products?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: categoryName,
    url: `${SITE_URL}/shop/${category}`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/product/${p.slug}`,
      name: p.name,
    })),
  } : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: categoryName, item: `${SITE_URL}/shop/${category}` },
    ],
  };

  return (
    <>
      {itemListSchema && (
        <Script
          id="shop-category-itemlist-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <Script
        id="shop-category-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ShopPageClient
        initialCategory={category}
        initialProducts={products}
        initialCategories={categories}
      />
    </>
  );
}
