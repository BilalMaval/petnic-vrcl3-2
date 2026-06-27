import ShopPageClient from '@/components/views/ShopPage';
import { fetchShopData } from '@/lib/shop';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Shop Custom Pet Portraits & Personalized Pet Products | Petnic Studio',
  description: 'Browse 200+ personalized pet portraits, canvas prints, wall art, mugs, blankets & more. Upload your photo, choose from 50+ styles. Free shipping over $50. 48,000+ 5-star reviews.',
  alternates: {
    canonical: `${SITE_URL}/shop`,
  },
  openGraph: {
    title: 'Shop Custom Pet Portraits & Personalized Pet Products | Petnic Studio',
    description: 'Browse 200+ personalized pet portraits. Upload your photo, choose from 50+ styles. Free shipping over $50.',
    url: `${SITE_URL}/shop`,
  },
};

export const revalidate = 300;

export default async function ShopPage() {
  const { products, categories } = await fetchShopData();
  return (
    <ShopPageClient
      initialProducts={products}
      initialCategories={categories}
    />
  );
}
