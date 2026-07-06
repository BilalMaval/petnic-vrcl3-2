import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/ProductDetail';
import { getSupabaseAdmin } from '@/lib/supabase';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const { data: product } = await supabase.from('products').select('name, description, price, image_url').eq('slug', slug).single();
  const name = product?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `${name} - Custom Pet Product | Petnic Studio`,
    description: product?.description?.slice(0, 155) || `Shop ${name} at Petnic Studio. Custom personalized pet products with free shipping over $50.`,
    alternates: {
      canonical: `${SITE_URL}/product/${slug}`,
    },
    openGraph: {
      title: `${name} | Petnic Studio`,
      description: product?.description?.slice(0, 155) || `Shop ${name} at Petnic Studio.`,
      url: `${SITE_URL}/product/${slug}`,
      images: product?.image_url ? [{ url: product.image_url, alt: name }] : [],
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { data: product } = await supabase
    .from('products')
    .select('*, collections(name, slug), categories(name, slug)')
    .eq('slug', slug)
    .single();

  let related = [];
  if (product) {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, original_price, image_url, badge, rating, review_count')
      .eq('collection_id', product.collection_id)
      .neq('slug', slug)
      .limit(4);
    related = data || [];
  }

  // Product Schema
  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image_url,
    url: `${SITE_URL}/product/${slug}`,
    brand: {
      '@type': 'Brand',
      name: 'Petnic Studio',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Petnic Studio',
      },
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.review_count || 1,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
  } : null;

  // BreadcrumbList Schema
  const breadcrumbSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      product.collections?.name && { '@type': 'ListItem', position: 3, name: product.collections.name, item: `${SITE_URL}/shop?collection=${product.collections.slug}` },
      { '@type': 'ListItem', position: 4, name: product.name, item: `${SITE_URL}/product/${slug}` },
    ].filter(Boolean),
  } : null;

  if (!product) notFound();

  return (
    <>
      {productSchema && (
        <Script
          id="product-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <ProductDetailClient product={product} related={related} />
    </>
  );
}
