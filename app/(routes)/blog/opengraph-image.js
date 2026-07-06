import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Petnic Studio Blog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #1A1A2E 0%, #2d2d4e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: 28, color: '#F97316', marginBottom: 24, letterSpacing: 4 }}>
          PETNIC STUDIO
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, color: '#FFFFFF', textAlign: 'center', maxWidth: 900 }}>
          Pet Care Blog & Expert Tips
        </div>
        <div style={{ fontSize: 28, color: '#cbd5e1', marginTop: 24, textAlign: 'center', maxWidth: 800 }}>
          Grooming · Health · Training · Portrait Guides
        </div>
        <div
          style={{
            marginTop: 48,
            padding: '14px 36px',
            background: '#F97316',
            color: '#fff',
            borderRadius: 50,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          Read Our Latest Articles
        </div>
      </div>
    ),
    { ...size }
  );
}
