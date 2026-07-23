import LegalPage from '@/components/views/LegalPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Refund & Return Policy | Petnic Studio',
  description: 'Our 30-day satisfaction guarantee, return process, refund timelines and exceptions for custom, digital and pet care products at Petnic Studio.',
  alternates: { canonical: `${SITE_URL}/refund` },
  robots: { index: true, follow: true },
};

const sections = [
  {
    id: 'overview',
    heading: 'Our 30-Day Satisfaction Guarantee',
    body: (
      <p>We stand behind every order. If an item arrives damaged, defective, or materially different from the design you approved, we will reprint, replace, or refund it — your choice — within <strong>30 days</strong> of delivery. Because personalized products are made specifically for each customer, correctly produced custom items are not eligible for a refund simply due to a change of mind. Full details and exceptions are below.</p>
    ),
  },
  {
    id: 'eligibility',
    heading: 'What’s Eligible',
    body: (
      <>
        <h3>Eligible for refund or replacement</h3>
        <ul>
          <li>Item arrives <strong>damaged, defective, or materially different</strong> from what you ordered.</li>
          <li><strong>Pet care products</strong> returned unopened and in original packaging within 30 days.</li>
          <li>An order we shipped to the wrong address or never delivered (carrier-confirmed lost).</li>
        </ul>
        <h3>Not eligible</h3>
        <ul>
          <li><strong>Custom / personalised products</strong> that were made correctly from the design and photo you approved (we cannot resell items featuring your pet).</li>
          <li><strong>Digital downloads</strong> once the file has been accessed/downloaded, except where required by law.</li>
          <li>Items returned more than 30 days after delivery.</li>
          <li>Items returned in used, washed, or significantly altered condition.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-to',
    heading: 'How to Request a Refund or Return',
    body: (
      <>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Email <a href="mailto:info@petnicstudio.com">info@petnicstudio.com</a> within 30 days of delivery with your order number and (for damaged items) clear photos of the issue.</li>
          <li>Our team will review and reply within 2 business days with next steps and, where applicable, a prepaid return label.</li>
          <li>Pack the item securely in its original packaging and ship it back within 14 days of receiving the return label.</li>
        </ol>
        <p>Do not return items without first contacting us — unauthorised returns may not be processed.</p>
      </>
    ),
  },
  {
    id: 'refund-timing',
    heading: 'Refund Processing & Timing',
    body: (
      <>
        <p>Once we receive and inspect your return (or approve a no-return refund for damaged items), we will process your refund within <strong>3-5 business days</strong> to your original payment method via Stripe. Depending on your bank, the refund may take a further 5-10 business days to appear on your statement.</p>
        <p>Original shipping fees are non-refundable except where the return is due to our error.</p>
      </>
    ),
  },
  {
    id: 'damaged',
    heading: 'Damaged or Defective Items',
    body: (
      <p>If your item arrives damaged or defective, please email us within <strong>7 days</strong> of delivery with photos. We will reprint or replace the item at no cost to you — no need to return the damaged item in most cases.</p>
    ),
  },
  {
    id: 'order-changes',
    heading: 'Order Changes & Cancellations',
    body: (
      <p>Custom products enter production quickly. To change or cancel an order, contact us within <strong>4 hours</strong> of placing it. After that, production may have started and we may not be able to alter the order. Pet care product orders can be cancelled until they ship.</p>
    ),
  },
  {
    id: 'exchanges',
    heading: 'Exchanges',
    body: (
      <p>For size or product-type exchanges on apparel and pet care products, follow the same process as a return. Once we receive the original item, we’ll ship the replacement at no additional cost (one exchange per order).</p>
    ),
  },
  {
    id: 'late-missing',
    heading: 'Late or Missing Refunds',
    body: (
      <p>If you haven’t received a refund within 15 business days of our confirmation, please check with your bank, then contact us at <a href="mailto:info@petnicstudio.com">info@petnicstudio.com</a> and we will investigate immediately.</p>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact Us',
    body: (
      <p>For any return, refund or exchange question, email <a href="mailto:info@petnicstudio.com">info@petnicstudio.com</a>. We aim to respond within one business day.</p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Return Policy"
      effective="May 31, 2026"
      intro="We want you to love your Petnic Studio purchase. This policy explains how returns, refunds, exchanges, and our 30-day satisfaction guarantee work."
      sections={sections}
    />
  );
}
