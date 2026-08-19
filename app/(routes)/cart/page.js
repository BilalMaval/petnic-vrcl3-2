import CartPageClient from '@/components/views/CartPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Your Cart | Petnic Studio',
  description: 'Review the items in your cart before checkout.',
  alternates: { canonical: `${SITE_URL}/cart` },
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return <CartPageClient />;
}
