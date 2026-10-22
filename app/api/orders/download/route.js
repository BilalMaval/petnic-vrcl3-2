import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { extensionFromUrl } from '@/lib/orders-finalize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Serves a purchased file. The checkout session id (unguessable, known only
// to the buyer via the success page / email) proves the order, and the file
// must belong to a product in that paid order. The storage URL itself is
// never sent to the browser; the file is streamed as an attachment.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id') || '';
  const productId = searchParams.get('product_id') || '';
  if (!sessionId || !productId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: tx } = await supabase
    .from('payment_transactions')
    .select('payment_status, metadata')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (!tx || tx.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Order not found or not paid' }, { status: 404 });
  }
  if (!(tx.metadata?.items || []).some((i) => i.product_id === productId)) {
    return NextResponse.json({ error: 'This product is not part of the order' }, { status: 404 });
  }

  const { data: product } = await supabase
    .from('products')
    .select('name, slug, download_file_url')
    .eq('id', productId)
    .maybeSingle();
  if (!product?.download_file_url) return NextResponse.json({ error: 'No file available for this product' }, { status: 404 });

  let upstream;
  try {
    upstream = await fetch(product.download_file_url);
  } catch {
    return NextResponse.json({ error: 'The file could not be retrieved' }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) return NextResponse.json({ error: 'The file could not be retrieved' }, { status: 502 });

  const ext = extensionFromUrl(product.download_file_url);
  const filename = `${product.slug || 'download'}${ext ? `.${ext}` : ''}`;
  const headers = new Headers({
    'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'private, no-store',
  });
  const length = upstream.headers.get('content-length');
  if (length) headers.set('Content-Length', length);

  return new Response(upstream.body, { status: 200, headers });
}
