// Static content that doesn't change frequently

export const heroImages = {
  main: '/hero-pet-portrait.webp',
  secondary: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80',
};

export const trustBadges = [
  { id: 1, title: 'Free Shipping', subtitle: 'On Orders Over $50', icon: 'Truck' },
  { id: 2, title: '30-Day Guarantee', subtitle: 'Money Back Promise', icon: 'ShieldCheck' },
  { id: 3, title: 'Premium Quality', subtitle: 'Made-to-Order Prints', icon: 'Award' },
  { id: 4, title: 'Secure Checkout', subtitle: '256-bit SSL Encrypted', icon: 'Lock' },
];

export const howItWorksSteps = [
  { id: 1, step: '01', title: 'Upload Your Pet Photo', description: 'Simply upload your favorite pet photo. Our AI-powered tool enhances any image — even blurry ones work beautifully!', icon: 'Upload' },
  { id: 2, step: '02', title: 'Choose Your Style & Product', description: 'Select an artistic style and a product. Preview your custom creation in real-time before ordering.', icon: 'Palette' },
  { id: 3, step: '03', title: 'We Craft & Deliver', description: 'Each piece is carefully produced to order and quality-checked before it ships straight to your doorstep.', icon: 'Package' },
];

export const categories = [
  { id: 1, name: 'Custom Wall Art', slug: 'wall-art', description: 'Canvas prints, framed portraits & poster art featuring your pet', image: 'https://images.unsplash.com/photo-1602935236192-6079fcde06f5?w=500&q=80' },
  { id: 2, name: 'Pet Apparel & Accessories', slug: 'apparel', description: 'Custom t-shirts, hoodies, tote bags & phone cases', image: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=500&q=80' },
  { id: 3, name: 'Home & Living', slug: 'home-living', description: 'Personalized mugs, blankets, pillows & coasters', image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=500&q=80' },
  { id: 4, name: 'Digital Downloads', slug: 'digital-downloads', description: 'Templates, presets, eBooks & printable art', image: 'https://images.unsplash.com/photo-1609992556760-d3884bb23eca?w=500&q=80' },
];

// Real customer testimonials will appear here once we have verified reviews
// from completed orders. Intentionally left empty rather than showing
// placeholder/fabricated reviews.
export const testimonials = [];

export const clubBenefits = [
  { id: 1, title: 'Exclusive Discounts', description: 'Members save 20% on every order, plus early access to seasonal sales', icon: 'Percent' },
  { id: 2, title: 'Free Monthly Digital Downloads', description: 'Get a free premium template, preset, or printable every month', icon: 'Download' },
  { id: 3, title: 'Priority Support', description: 'A dedicated support line to help with any question about your order', icon: 'Headphones' },
  { id: 4, title: 'Community Access', description: 'Connect with fellow pet lovers sharing tips, photos & stories', icon: 'Users' },
  { id: 5, title: 'Free Shipping Always', description: 'No minimum order required — every order ships free', icon: 'Truck' },
  { id: 6, title: 'Birthday Surprises', description: 'Special gift for your pet on their birthday + your birthday too!', icon: 'Gift' },
];

export const faqData = [
  { question: 'How long does it take to receive my custom pet portrait?', answer: 'Standard orders are completed within 3-5 business days before shipping. Shipping typically takes an additional 5-7 business days within the US.' },
  { question: 'What photo quality do I need for a good portrait?', answer: "Any clear photo works! Our AI enhancement technology can improve low-resolution images. For best results, use a well-lit photo where your pet's face is clearly visible." },
  { question: 'Can I customize the artistic style of my portrait?', answer: 'Yes! We offer a range of artistic styles including watercolor, oil painting, pop art, Renaissance, minimalist, and more. You can preview each style with your photo before ordering.' },
  { question: 'What is your return and refund policy?', answer: "We offer a 30-day satisfaction guarantee for items that arrive damaged, defective, or different from the design you approved. Because custom items are made specifically for you, correctly produced personalized products are not returnable for a change of mind — see our Refund Policy for full details." },
  { question: 'How do digital downloads work?', answer: "After purchase, you'll receive instant access to download your files. Digital products include lifetime access and free updates. Compatible formats are clearly listed on each product page." },
];

// Founded in 2026 - these are honest, verifiable facts about a new business
// rather than sales/customer-count figures.
export const stats = [
  { label: 'Founded', value: '2026' },
  { label: 'Based In', value: 'Montana, USA' },
  { label: 'Production', value: 'Made to Order' },
  { label: 'Guarantee', value: '30-Day' },
];

export const blogPosts = [
  { id: 'b1', title: '15 Creative Ways to Display Pet Portraits in Your Home', slug: '15-creative-ways-display-pet-portraits', excerpt: 'Discover stunning interior design ideas for showcasing your custom pet artwork.', author: { name: 'Sarah Mitchell', role: 'Pet Art Writer' }, date: 'March 10, 2026', readTime: '8 min read', category: 'Home Decor', image: 'https://images.unsplash.com/photo-1602935236192-6079fcde06f5?w=600&q=80', featured: true },
  { id: 'b2', title: 'How to Create a Pet Memorial: Honoring Your Beloved Companion', slug: 'create-pet-memorial-guide', excerpt: 'Learn meaningful ways to create lasting memorials.', author: { name: 'Emily Rodriguez', role: 'Pet Grief Counselor' }, date: 'February 28, 2026', readTime: '10 min read', category: 'Pet Care', image: 'https://images.unsplash.com/photo-1559932199-d6da2ce8fa4e?w=600&q=80', featured: false },
  { id: 'b3', title: 'Top 10 Pet Photography Tips for Stunning Portraits', slug: 'pet-photography-tips-stunning-portraits', excerpt: 'Photography tips for capturing the perfect pet photo to turn into custom art.', author: { name: 'James Carter', role: 'Pet Photographer' }, date: 'February 20, 2026', readTime: '7 min read', category: 'Photography', image: 'https://images.unsplash.com/photo-1560743641-3914f2c45636?w=600&q=80', featured: false },
];

export const navItems = [
  { label: 'Shop', href: '/shop', children: [
    { label: 'Custom Wall Art', href: '/shop?category=wall-art' },
    { label: 'Apparel & Accessories', href: '/shop?category=apparel' },
    { label: 'Home & Living', href: '/shop?category=home-living' },
    { label: 'All Products', href: '/shop' },
  ]},
  { label: 'Print on Demand', href: '/print-on-demand', children: [
    { label: 'Wall Art', href: '/print-on-demand?category=wall-art' },
    { label: 'Home & Living', href: '/print-on-demand?category=home-living' },
    { label: 'Accessories', href: '/print-on-demand?category=accessories' },
    { label: 'Apparel', href: '/print-on-demand?category=apparel' },
  ]},
  { label: 'Digital Downloads', href: '/digital-downloads', children: [
    { label: 'Templates & Presets', href: '/digital-downloads?category=templates' },
    { label: 'eBooks & Guides', href: '/digital-downloads?category=ebooks' },
    { label: 'Printables', href: '/digital-downloads?category=printables' },
  ]},
  { label: 'Customize', href: '/customize' },
  { label: 'Pet Owner Club', href: '/pet-owner-club' },
  { label: 'Blog', href: '/blog' },
];

export const footerLinks = {
  shop: [
    { label: 'Custom Wall Art', href: '/shop/wall-art' },
    { label: 'Apparel', href: '/shop/apparel' },
    { label: 'Home & Living', href: '/shop/home-living' },
    { label: 'Digital Downloads', href: '/digital-downloads' },
  ],
  resources: [
    { label: 'How to Customize', href: '/customize' },
    { label: 'Pet Owner Club', href: '/pet-owner-club' },
    { label: 'Shipping & Delivery', href: '/shipping' },
    { label: 'Refund & Returns', href: '/refund' },
    { label: 'Size Guide', href: '/size-guide' },
    { label: 'Contact Us', href: '/contact' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Story', href: '/our-story' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};
