import PetOwnerClubPageClient from '@/components/views/PetOwnerClubPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Pet Owner Club - Community & Membership | Petnic Studio',
  description: 'Join our pet-loving community. Get member discounts, free downloads, access our community forum & premium perks. Free and Premium tiers available.',
  alternates: {
    canonical: `${SITE_URL}/pet-owner-club`,
  },
  openGraph: {
    title: 'Pet Owner Club - Community & Membership | Petnic Studio',
    description: 'Join our pet-loving community. Member discounts, free downloads & more.',
    url: `${SITE_URL}/pet-owner-club`,
  },
};

export default function PetOwnerClubPage() {
  return <PetOwnerClubPageClient />;
}
