import LegalPage from '@/components/views/LegalPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Privacy Policy | Petnic Studio',
  description: 'How Petnic Studio collects, uses, stores and protects your personal information when you shop custom pet portraits and pet care products.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};

const sections = [
  {
    id: 'information-we-collect',
    heading: 'Information We Collect',
    body: (
      <>
        <p>We collect information you provide directly to us when you create an account, place an order, upload a pet photo for customisation, subscribe to our newsletter, or contact customer support. This may include:</p>
        <ul>
          <li><strong>Contact details</strong> — name, email address, shipping address, billing address, phone number.</li>
          <li><strong>Order details</strong> — products purchased, customisation choices, uploaded pet photos, gift messages.</li>
          <li><strong>Payment information</strong> — handled entirely by our payment processor (Stripe). We never see or store your full card number; we only receive a transaction reference and the last 4 digits.</li>
          <li><strong>Account credentials</strong> — email and a hashed password (we never store passwords in plain text).</li>
        </ul>
        <p>We also collect information automatically, including IP address, browser and device type, pages viewed, referring URL, and timestamps, via cookies and similar technologies (see our <a href="/cookies">Cookie Policy</a>).</p>
      </>
    ),
  },
  {
    id: 'how-we-use-information',
    heading: 'How We Use Your Information',
    body: (
      <>
        <ul>
          <li>To process and fulfil your orders, including print-on-demand customisation and shipping.</li>
          <li>To send order confirmations, shipping updates, and customer-service responses.</li>
          <li>To improve our website, products and user experience.</li>
          <li>To send marketing emails about new products, promotions and pet-care tips — only if you have opted in. You can unsubscribe at any time.</li>
          <li>To prevent fraud and comply with legal obligations.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-share',
    heading: 'How We Share Your Information',
    body: (
      <>
        <p>We do not sell your personal information. We share it only with trusted service providers who help us run our business, under contractual confidentiality obligations:</p>
        <ul>
          <li><strong>Stripe</strong> — payment processing.</li>
          <li><strong>Supabase</strong> — secure database hosting.</li>
          <li><strong>Brevo</strong> — transactional and marketing emails.</li>
          <li><strong>Print partners &amp; carriers</strong> — to fulfil and ship your physical orders (e.g., shipping name and address only).</li>
          <li><strong>Google Analytics</strong> — anonymised usage analytics.</li>
        </ul>
        <p>We may also disclose information if required by law, court order, or to protect our legal rights.</p>
      </>
    ),
  },
  {
    id: 'data-retention',
    heading: 'Data Retention',
    body: (
      <p>We retain personal information only as long as needed to provide our services and meet our legal, accounting and reporting obligations — typically up to seven (7) years for order and tax records. Pet photo uploads tied to an order are retained for production, customer service, and re-order purposes; you can request deletion at any time.</p>
    ),
  },
  {
    id: 'your-rights',
    heading: 'Your Rights & Choices',
    body: (
      <>
        <p>Depending on where you live (e.g., EU/UK GDPR, California CCPA), you may have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you.</li>
          <li>Request correction or deletion of your information.</li>
          <li>Object to or restrict processing.</li>
          <li>Request a copy of your data in a portable format.</li>
          <li>Withdraw consent (e.g., marketing emails) at any time.</li>
        </ul>
        <p>To exercise any of these rights, email us at <a href="mailto:hello@petnicstudio.com">hello@petnicstudio.com</a>. We will respond within 30 days.</p>
      </>
    ),
  },
  {
    id: 'security',
    heading: 'Security',
    body: (
      <p>We use industry-standard safeguards — TLS/SSL encryption in transit, encrypted database storage, hashed passwords, and PCI-DSS-compliant payment processing — to protect your information. No method of transmission over the internet is 100% secure, but we work hard to keep your data safe.</p>
    ),
  },
  {
    id: 'children',
    heading: 'Children Under 16',
    body: (
      <p>Petnic Studio is not directed to children under 16, and we do not knowingly collect personal information from them. If you believe a child has provided us information, please contact us and we will delete it.</p>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes to This Policy',
    body: (
      <p>We may update this Privacy Policy from time to time. We will post the new version on this page and update the “Effective date” at the top. Material changes will also be announced via email or a banner on our site.</p>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact Us',
    body: (
      <p>For any privacy-related questions, contact our Data Protection lead at <a href="mailto:hello@petnicstudio.com">hello@petnicstudio.com</a>.</p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effective="May 31, 2026"
      intro="At Petnic Studio (“we”, “us”, “our”) we take your privacy seriously. This Privacy Policy explains what information we collect, how we use it, and the rights you have over your data when you use petnicstudio.com or purchase our products."
      sections={sections}
    />
  );
}
