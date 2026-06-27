import LegalPage from '@/components/views/LegalPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Cookie Policy | Petnic Studio',
  description: 'How Petnic Studio uses cookies and similar technologies on petnicstudio.com, what each cookie type does, and how to manage your preferences.',
  alternates: { canonical: `${SITE_URL}/cookies` },
  robots: { index: true, follow: true },
};

const sections = [
  {
    id: 'what-are-cookies',
    heading: 'What Are Cookies?',
    body: (
      <p>Cookies are small text files placed on your device when you visit a website. They help the site recognise you on return visits, remember your preferences, and understand how the site is used.</p>
    ),
  },
  {
    id: 'how-we-use',
    heading: 'How We Use Cookies',
    body: (
      <>
        <p>We use cookies and similar technologies (pixels, local storage) to:</p>
        <ul>
          <li>Keep you signed in and remember your shopping cart.</li>
          <li>Run secure payment sessions with Stripe.</li>
          <li>Measure traffic and improve our website via Google Analytics.</li>
          <li>Show you relevant marketing on partner platforms (only if you opt in).</li>
        </ul>
      </>
    ),
  },
  {
    id: 'types',
    heading: 'Types of Cookies We Use',
    body: (
      <>
        <h3>Strictly Necessary</h3>
        <p>Required for the Site to function — e.g., authentication tokens, cart contents, CSRF protection, Stripe checkout sessions. These cannot be turned off.</p>
        <h3>Performance &amp; Analytics</h3>
        <p>Help us understand how visitors use the Site so we can improve it. We use <strong>Google Analytics</strong> with IP anonymisation. Data is aggregated and pseudonymised.</p>
        <h3>Functional</h3>
        <p>Remember preferences such as your selected art style, recently viewed products and language.</p>
        <h3>Marketing</h3>
        <p>Set only with your consent, used to show relevant ads on third-party sites (e.g., Meta, Pinterest).</p>
      </>
    ),
  },
  {
    id: 'third-party',
    heading: 'Third-Party Cookies',
    body: (
      <>
        <p>Some cookies are set by third-party services we use:</p>
        <ul>
          <li><strong>Stripe</strong> — payment processing and fraud prevention.</li>
          <li><strong>Google Analytics</strong> — anonymised website analytics.</li>
          <li><strong>Supabase</strong> — secure session management.</li>
          <li><strong>Meta / Pinterest pixels</strong> — only when marketing cookies are accepted.</li>
        </ul>
        <p>These third parties have their own privacy and cookie policies, which we recommend reviewing.</p>
      </>
    ),
  },
  {
    id: 'manage',
    heading: 'How to Manage Cookies',
    body: (
      <>
        <p>You can control cookies in several ways:</p>
        <ul>
          <li>Use the cookie banner on first visit to accept or decline non-essential cookies.</li>
          <li>Adjust your browser settings to block or delete cookies. Most browsers also support “Do Not Track” signals.</li>
          <li>Opt out of Google Analytics via the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-Out add-on</a>.</li>
        </ul>
        <p>Disabling strictly necessary cookies will prevent parts of the Site (such as checkout) from working.</p>
      </>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes to This Policy',
    body: (
      <p>We may update this Cookie Policy as we add or change features. The latest version will always be available on this page with an updated “Effective date.”</p>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact Us',
    body: (
      <p>Questions about our use of cookies? Email <a href="mailto:hello@petnicstudio.com">hello@petnicstudio.com</a>.</p>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      effective="May 31, 2026"
      intro="This Cookie Policy explains how Petnic Studio uses cookies and similar tracking technologies on petnicstudio.com, and how you can manage your preferences."
      sections={sections}
    />
  );
}
