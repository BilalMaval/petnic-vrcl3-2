import LegalPage from '@/components/views/LegalPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Shipping & Delivery Policy | Petnic Studio',
  description: 'Processing times, shipping rates, delivery estimates, international shipping, customs and tracking information for Petnic Studio orders.',
  alternates: { canonical: `${SITE_URL}/shipping` },
  robots: { index: true, follow: true },
};

const sections = [
  {
    id: 'processing-times',
    heading: 'Processing Times',
    body: (
      <>
        <p>Once your order is placed and paid, here’s how long we take to make it before it ships:</p>
        <ul>
          <li><strong>Custom &amp; print-on-demand products</strong> (canvases, framed art, apparel, mugs, blankets): <strong>3-5 business days</strong>.</li>
          <li><strong>Pet care products</strong> (grooming, nutrition, wellness): <strong>1-2 business days</strong>.</li>
          <li><strong>Digital downloads</strong>: instant delivery via email after payment confirmation.</li>
          <li><strong>Rush production</strong> (24-48 hours) is available at checkout for an additional fee on most custom products.</li>
        </ul>
        <p>Processing time is added to the shipping time below.</p>
      </>
    ),
  },
  {
    id: 'rates',
    heading: 'Shipping Rates & Delivery Estimates',
    body: (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-semibold text-[#1A1A2E]">Method</th>
              <th className="text-left py-2 font-semibold text-[#1A1A2E]">Delivery (after processing)</th>
              <th className="text-left py-2 font-semibold text-[#1A1A2E]">Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2">Standard (US)</td>
              <td className="py-2">5-7 business days</td>
              <td className="py-2">Free over $50 / $4.99</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2">Express (US)</td>
              <td className="py-2">2-3 business days</td>
              <td className="py-2">$9.99</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2">Overnight (US)</td>
              <td className="py-2">1 business day</td>
              <td className="py-2">$19.99</td>
            </tr>
            <tr>
              <td className="py-2">International</td>
              <td className="py-2">7-14 business days</td>
              <td className="py-2">From $14.99</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'destinations',
    heading: 'Where We Ship',
    body: (
      <p>We ship to all 50 US states (including PO boxes, APO/FPO) and to <strong>45+ countries</strong> worldwide. Restricted destinations may appear at checkout based on carrier limitations or local regulations.</p>
    ),
  },
  {
    id: 'tracking',
    heading: 'Tracking Your Order',
    body: (
      <p>You will receive a shipping confirmation email with a tracking number as soon as your order leaves our facility. You can also track it from your account page under <strong>My Orders</strong>.</p>
    ),
  },
  {
    id: 'international',
    heading: 'International Customs, Duties & Taxes',
    body: (
      <p>International customers may be charged import duties, taxes, or customs fees by their country’s authorities. These are <strong>not included</strong> in our shipping rates and are the responsibility of the customer. Refusing delivery to avoid customs fees does not entitle you to a refund.</p>
    ),
  },
  {
    id: 'address',
    heading: 'Address Accuracy',
    body: (
      <p>Please double-check your shipping address at checkout. We are not responsible for orders shipped to an incorrect address provided by the customer. If you spot a mistake, email us within <strong>4 hours</strong> of placing the order and we will try to update it.</p>
    ),
  },
  {
    id: 'lost-damaged',
    heading: 'Lost, Stolen or Damaged Packages',
    body: (
      <>
        <ul>
          <li><strong>Damaged in transit:</strong> email us within 7 days with photos and we will reprint or refund — see our <a href="/refund">Refund &amp; Return Policy</a>.</li>
          <li><strong>Marked “delivered” but missing:</strong> please check with neighbours and your local carrier office first. If still missing, contact us and we will open a carrier investigation.</li>
          <li><strong>Lost in transit:</strong> if tracking shows no movement for 10 business days (US) or 21 days (international), contact us and we will reship or refund.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'returns',
    heading: 'Returns',
    body: (
      <p>For return eligibility and the step-by-step return process, please see our <a href="/refund">Refund &amp; Return Policy</a>.</p>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact Us',
    body: (
      <p>Shipping questions? Email <a href="mailto:info@petnicstudio.com">info@petnicstudio.com</a> with your order number and we’ll respond within one business day.</p>
    ),
  },
];

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping & Delivery Policy"
      effective="May 31, 2026"
      intro="Everything you need to know about how we ship your Petnic Studio order — processing times, rates, tracking, international delivery, and what to do if something goes wrong."
      sections={sections}
    />
  );
}
