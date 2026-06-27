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
