import PetOwnerClubPageClient from '@/components/views/PetOwnerClubPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Pet Owner Club - Community & Membership | Petnic Studio',
  description: 'Join 50,000+ pet lovers in our exclusive community. Get member discounts, free downloads, access our community forum & premium perks. Free and Premium tiers available.',
  alternates: {
    canonical: `${SITE_URL}/pet-owner-club`,
  },
  openGraph: {
    title: 'Pet Owner Club - Community & Membership | Petnic Studio',
    description: 'Join 50,000+ pet lovers in our exclusive community. Member discounts, free downloads & more.',
    url: `${SITE_URL}/pet-owner-club`,
  },
};

export default function PetOwnerClubPage() {
  return <PetOwnerClubPageClient />;
}
