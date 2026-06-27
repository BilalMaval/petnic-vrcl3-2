# Legal / Policy Pages

Five pages required for Stripe merchant approval — and best practice for any ecommerce site.

| URL | Purpose | Stripe field |
|---|---|---|
| `/privacy` | Privacy Policy (GDPR/CCPA) | Privacy Policy URL |
| `/terms` | Terms & Conditions | Terms of Service URL |
| `/refund` | Refund & Return Policy | Refund Policy URL |
| `/shipping` | Shipping & Delivery Policy | Shipping Policy URL |
| `/cookies` | Cookie Policy | Cookie Policy URL |

---

## 1. Architecture

All five pages share a **single reusable layout component**:

```
/app/components/views/LegalPage.jsx
└── used by:
    ├── /app/app/(routes)/privacy/page.js
    ├── /app/app/(routes)/terms/page.js
    ├── /app/app/(routes)/refund/page.js
    ├── /app/app/(routes)/shipping/page.js
    └── /app/app/(routes)/cookies/page.js
```

The layout provides:
- Sticky **table of contents** sidebar with scroll-spy active highlighting
- Breadcrumb (`Home → <Title>`)
- Effective date header
- Section numbering (`01.`, `02.`, ...)
- Brand-consistent typography & spacing
- "Contact us" footer with mailto link

---

## 2. Adding or editing content

Each policy is a Next.js **server component** with a `sections` array:

```js
const sections = [
  {
    id: 'information-we-collect',  // anchor id; used in TOC + URL hash
    heading: 'Information We Collect',
    body: (
      <>
        <p>...</p>
        <ul>
          <li>...</li>
        </ul>
      </>
    ),
  },
  // ...more sections
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effective="May 31, 2026"
      intro="Plain-language summary of the page..."
      sections={sections}
    />
  );
}
```

To **change the wording**, edit the JSX inside the relevant `sections` array. To **add a new section**, append a new `{ id, heading, body }` object — it will automatically appear in the TOC.

---

## 3. SEO metadata

Each page exports a `metadata` object so search engines and link unfurlers get proper signals:

```js
export const metadata = {
  title: 'Privacy Policy | Petnic Studio',
  description: 'How Petnic Studio collects, uses, ...',
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};
```

All five pages are included in `/app/app/sitemap.js` with:
- `changeFrequency: 'yearly'`
- `priority: 0.3`

---

## 4. Footer integration

The site footer (`/app/components/layout/Footer.jsx`) exposes the policies in two places:

1. **Bottom legal bar** — horizontal strip of all five links + "Secure payments by Stripe" tagline.
2. **Resources column** — quick links to Shipping & Delivery + Refund & Returns for shoppers.

The legal-link list is centralised in `/app/config/static-data.js` under `footerLinks.legal`:

```js
legal: [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Refund Policy', href: '/refund' },
  { label: 'Shipping Policy', href: '/shipping' },
  { label: 'Cookie Policy', href: '/cookies' },
],
```

Update the array if URLs ever change — the footer reads from it automatically.

---

## 5. Cross-linking

Policies reference each other where relevant (good for SEO equity + UX):
- `Terms` → `Privacy`, `Refund`, `Shipping`, `Cookies`
- `Refund` ↔ `Shipping`
- `Privacy` → `Cookies`

---

## 6. Stripe submission

After deployment, add the public URLs in **Stripe Dashboard → Settings → Business → Public details**:

| Field | URL |
|---|---|
| Privacy Policy | `https://www.petnicstudio.com/privacy` |
| Terms of Service | `https://www.petnicstudio.com/terms` |
| Refund Policy | `https://www.petnicstudio.com/refund` |
| Shipping Policy | `https://www.petnicstudio.com/shipping` |

Stripe's review bot fetches these URLs to verify they exist and contain plausible policy content. Approval typically takes 1-3 business days.
