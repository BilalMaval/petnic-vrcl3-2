import LegalPage from '@/components/views/LegalPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Terms & Conditions | Petnic Studio',
  description: 'The terms and conditions that govern your use of Petnic Studio’s website and your purchase of custom pet portraits, print-on-demand products, digital downloads and pet care goods.',
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
};

const sections = [
  {
    id: 'acceptance',
    heading: 'Acceptance of Terms',
    body: (
      <p>By accessing or using petnicstudio.com (the “Site”), operated by Petnic Studio LLC, or placing an order, you agree to be bound by these Terms &amp; Conditions, our <a href="/privacy">Privacy Policy</a>, <a href="/refund">Refund &amp; Return Policy</a>, <a href="/shipping">Shipping &amp; Delivery Policy</a> and <a href="/cookies">Cookie Policy</a>. If you do not agree, please do not use the Site.</p>
    ),
  },
  {
    id: 'eligibility',
    heading: 'Eligibility',
    body: (
      <p>You must be at least 16 years old (or the age of majority in your jurisdiction) to place an order. By creating an account or completing checkout, you represent that you meet this requirement and that the payment method belongs to you.</p>
    ),
  },
  {
    id: 'account',
    heading: 'Your Account',
    body: (
      <>
        <p>You are responsible for keeping your account credentials confidential and for all activity that occurs under your account. Notify us immediately at <a href="mailto:info@petnicstudio.com">info@petnicstudio.com</a> if you suspect unauthorised use.</p>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraud, or harm other users.</p>
      </>
    ),
  },
  {
    id: 'orders-pricing',
    heading: 'Orders, Pricing & Payment',
    body: (
      <>
        <ul>
          <li>All prices are displayed in US dollars (USD) unless stated otherwise and exclude applicable taxes and shipping fees, which are calculated at checkout.</li>
          <li>Placing an order constitutes an <strong>offer</strong> to purchase. We accept your offer when we send you an order confirmation email. We may decline an order at our discretion (e.g., suspected fraud, product unavailability, pricing error).</li>
          <li>Payment is processed securely by <strong>Stripe</strong>. We accept major credit and debit cards. Payment is captured at checkout.</li>
          <li>If a product is mispriced due to a typographical error, we may cancel the order and refund any payment.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'custom-products',
    heading: 'Custom Pet Portraits & Print-on-Demand Products',
    body: (
      <>
        <p>Custom and personalised products (including portraits made from a photo you upload) are made to order and tailored to you. By submitting a photo or other customisation, you:</p>
        <ul>
          <li>Confirm you own or have all necessary rights to the photo and content you upload.</li>
          <li>Grant Petnic Studio a non-exclusive, royalty-free, worldwide licence to reproduce, modify and print the content solely to fulfil your order and provide customer support.</li>
          <li>Acknowledge that custom items are <strong>final sale</strong> unless they arrive damaged, defective, or materially different from the design you approved (see our <a href="/refund">Refund Policy</a>).</li>
        </ul>
      </>
    ),
  },
  {
    id: 'digital-downloads',
    heading: 'Digital Downloads',
    body: (
      <p>Digital products (templates, presets, eBooks, printables) are licensed for personal, non-commercial use only. You may not resell, redistribute, or share the files. Access is provided immediately after payment and is non-refundable once downloaded, except where required by law.</p>
    ),
  },
  {
    id: 'shipping-returns',
    heading: 'Shipping & Returns',
    body: (
      <p>Shipping times, costs and return eligibility are governed by our <a href="/shipping">Shipping &amp; Delivery Policy</a> and <a href="/refund">Refund &amp; Return Policy</a>. Please review them before purchasing.</p>
    ),
  },
  {
    id: 'intellectual-property',
    heading: 'Intellectual Property',
    body: (
      <p>All Site content (logos, designs, AI-generated styles, copy, imagery) is owned by Petnic Studio LLC or our licensors and is protected by copyright, trademark and other laws. You may not copy, modify, distribute or commercially exploit any content without our written permission.</p>
    ),
  },
  {
    id: 'prohibited',
    heading: 'Prohibited Uses',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Site for any unlawful purpose or in violation of these Terms.</li>
          <li>Upload content that infringes on intellectual property, is obscene, defamatory or violates anyone’s privacy.</li>
          <li>Attempt to disrupt, reverse-engineer, scrape, or gain unauthorised access to the Site.</li>
          <li>Submit false, misleading or fraudulent information at checkout.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'disclaimers',
    heading: 'Disclaimers',
    body: (
      <p>The Site and our products are provided “as is” and “as available.” To the maximum extent permitted by law, we disclaim all warranties — express or implied — including merchantability, fitness for a particular purpose and non-infringement. Slight variations in colour, texture, or finish between the on-screen preview and the printed product can occur and are not considered defects.</p>
    ),
  },
  {
    id: 'liability',
    heading: 'Limitation of Liability',
    body: (
      <p>To the fullest extent permitted by law, Petnic Studio LLC shall not be liable for any indirect, incidental, special or consequential damages arising from your use of the Site or our products. Our total liability for any claim relating to a product is limited to the amount you paid for that product.</p>
    ),
  },
  {
    id: 'governing-law',
    heading: 'Governing Law & Disputes',
    body: (
      <p>These Terms are governed by the laws of the United States and the State of Montana, without regard to conflict-of-law principles. Any dispute will be resolved in the state or federal courts located in Montana, unless otherwise required by your local consumer protection laws.</p>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes to These Terms',
    body: (
      <p>We may update these Terms from time to time. The most current version will always be posted on this page with a revised “Effective date.” Continued use of the Site after a change means you accept the updated Terms.</p>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact Us',
    body: (
      <p>Questions about these Terms? Email us at <a href="mailto:info@petnicstudio.com">info@petnicstudio.com</a>.</p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      effective="May 31, 2026"
      intro="Please read these Terms & Conditions carefully before using petnicstudio.com or purchasing any of our products. They form a legally binding agreement between you and Petnic Studio LLC."
      sections={sections}
    />
  );
}
