export const siteConfig = {
  name: 'PETNIC STUDIO',
  description: 'Premium personalized pet products, digital downloads, and pet care essentials',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://petnicstudio.com',
  ogImage: '/og-image.jpg',
  collections: {
    pod: { name: 'Print on Demand', slug: 'pod', description: 'Custom personalized pet products' },
    digital: { name: 'Digital Downloads', slug: 'digital', description: 'Premium digital pet resources' },
    petcare: { name: 'Pet Care', slug: 'petcare', description: 'Essential pet care products' },
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};
