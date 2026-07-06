import '@/styles/globals.css';
import Script from 'next/script';
import LayoutWrapper from '@/components/layout/LayoutWrapper';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const metadata = {
  title: 'Custom Pet Portraits | Personalized Pet Art - Petnic Studio',
  description: 'Create stunning custom pet portraits from your photos. Shop personalized canvas prints, framed art, mugs & more. 48,000+ 5-star reviews. Free shipping over $50.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'Custom Pet Portraits | Personalized Pet Art - Petnic Studio',
    description: 'Create stunning custom pet portraits from your photos. Shop personalized canvas prints, framed art & more.',
    siteName: 'Petnic Studio',
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
  },
  twitter: { 
    card: 'summary_large_image',
    title: 'Custom Pet Portraits | Personalized Pet Art - Petnic Studio',
    description: 'Create stunning custom pet portraits from your photos. Shop personalized canvas prints, framed art & more.',
  },
  icons: { 
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Non-blocking Google Fonts load: preconnect early, then fetch the
            stylesheet directly (instead of a CSS @import, which forces the
            browser to download+parse globals.css before it even discovers
            the font request, adding a full extra round-trip to LCP/CLS). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        />
        {/* Google Analytics - Only load if measurement ID is set */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
