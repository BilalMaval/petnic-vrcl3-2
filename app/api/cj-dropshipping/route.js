import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// CJ Dropshipping API Configuration
const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const CJ_ACCESS_TOKEN = process.env.CJ_ACCESS_TOKEN || '';

// Helper to make CJ API requests
async function cjApiRequest(endpoint, method = 'POST', body = null) {
  if (!CJ_ACCESS_TOKEN) {
    return { error: 'CJ Dropshipping API token not configured' };
  }

  try {
    const response = await fetch(`${CJ_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': CJ_ACCESS_TOKEN,
      },
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

// GET: Search/List products from CJ catalog
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const productId = searchParams.get('productId');
  const keyword = searchParams.get('keyword');
  const orderId = searchParams.get('orderId');

  // Get product details
  if (action === 'product' && productId) {
    const result = await cjApiRequest('/product/query', 'POST', { pid: productId });
    return NextResponse.json(result);
  }

  // Search products
  if (action === 'search' && keyword) {
    const result = await cjApiRequest('/product/list', 'POST', {
      productNameEn: keyword,
      pageNum: 1,
      pageSize: 20,
    });
    return NextResponse.json(result);
  }

  // Get order tracking
  if (action === 'tracking' && orderId) {
    const result = await cjApiRequest('/logistic/getTrackInfo', 'POST', { orderId });
    return NextResponse.json(result);
  }

  // List categories
  if (action === 'categories') {
    const result = await cjApiRequest('/product/getCategory', 'POST', {});
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// POST: Create order in CJ Dropshipping
export async function POST(request) {
  const body = await request.json();
  const { action } = body;

  // Create dropship order
  if (action === 'createOrder') {
    const { orderData } = body;
    
    if (!orderData) {
      return NextResponse.json({ error: 'Order data required' }, { status: 400 });
    }

    // CJ Order format
    const cjOrder = {
      orderNumber: orderData.orderId,
      shippingZip: orderData.shipping?.zip,
      shippingCountry: orderData.shipping?.country || 'US',
      shippingCountryCode: orderData.shipping?.countryCode || 'US',
      shippingProvince: orderData.shipping?.state,
      shippingCity: orderData.shipping?.city,
      shippingAddress: orderData.shipping?.address,
      shippingCustomerName: orderData.shipping?.name,
      shippingPhone: orderData.shipping?.phone || '',
      remark: orderData.notes || '',
      products: orderData.items?.map(item => ({
        vid: item.variantId || item.sku,
        quantity: item.quantity,
      })) || [],
    };

    const result = await cjApiRequest('/shopping/order/createOrder', 'POST', cjOrder);
    
    // Update order status in our database
    if (result.result && result.data?.orderId) {
      const supabase = getSupabaseAdmin();
      await supabase.from('orders').update({
        cj_order_id: result.data.orderId,
        dropship_status: 'submitted',
      }).eq('order_id', orderData.orderId);
    }

    return NextResponse.json(result);
  }

  // Sync product from CJ to our store
  if (action === 'syncProduct') {
    const { cjProductId, categoryId } = body;
    
    // Get product from CJ
    const productResult = await cjApiRequest('/product/query', 'POST', { pid: cjProductId });
    
    if (!productResult.result || !productResult.data) {
      return NextResponse.json({ error: 'Product not found in CJ' }, { status: 404 });
    }

    const cjProduct = productResult.data;
    const supabase = getSupabaseAdmin();

    // Get petcare collection
    const { data: collection } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', 'petcare')
      .single();

    // Create product in our store
    const { data: newProduct, error } = await supabase.from('products').insert({
      collection_id: collection?.id,
      category_id: categoryId,
      name: cjProduct.productNameEn,
      slug: cjProduct.productNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: cjProduct.description || cjProduct.productNameEn,
      price: parseFloat(cjProduct.sellPrice || 0),
      original_price: parseFloat(cjProduct.sellPrice || 0) * 1.3,
      image_url: cjProduct.productImage,
      gallery_urls: cjProduct.productImageSet || [],
      badge: 'Dropship',
      rating: 4.5,
      review_count: Math.floor(Math.random() * 500) + 100,
      in_stock: true,
      supplier_sku: cjProduct.pid,
      supplier_name: 'CJ Dropshipping',
      supplier_url: `https://cjdropshipping.com/product/${cjProduct.pid}`,
      weight: cjProduct.packWeight ? `${cjProduct.packWeight}g` : null,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: newProduct });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
