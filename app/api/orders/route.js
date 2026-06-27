import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendEmail, getOrderConfirmationHtml } from '@/lib/email';

// Send order confirmation email
async function sendOrderConfirmationEmail(order, product, customer, isDigital = false) {
  const result = await sendEmail({
    to: customer.email,
    toName: customer.name,
    subject: `Order Confirmed: ${order.order_id} 🎉`,
    htmlContent: getOrderConfirmationHtml(order, product, customer, isDigital),
  });
  console.log('Order confirmation email result:', result);
}

// Forward dropship order to CJ Dropshipping
async function forwardToCJDropshipping(order, product, customer, shippingAddress) {
  const cjToken = process.env.CJ_ACCESS_TOKEN;
  if (!cjToken || !product?.supplier_sku) return null;

  try {
    const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': cjToken,
      },
      body: JSON.stringify({
        orderNumber: order.order_id,
        shippingZip: shippingAddress?.zip || '',
        shippingCountry: 'US',
        shippingCountryCode: 'US',
        shippingProvince: shippingAddress?.state || '',
        shippingCity: shippingAddress?.city || '',
        shippingAddress: shippingAddress?.address || '',
        shippingCustomerName: customer.name,
        shippingPhone: customer.phone || '',
        products: [{
          vid: product.supplier_sku,
          quantity: order.quantity,
        }],
      }),
    });

    return await response.json();
  } catch (e) {
    console.error('CJ Dropshipping order error:', e.message);
    return null;
  }
}

export async function POST(request) {
  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { productSlug, productName, quantity, total, customer, shippingAddress, petImageUrl, selectedDesign, designAddition, size, style, customOrder } = body;

  if (!productName || !customer?.email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const orderId = `PNC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Get product details for email and dropship
  const { data: product } = await supabase
    .from('products')
    .select('*, collections(slug)')
    .eq('slug', productSlug)
    .single();

  const isDigital = product?.collections?.slug === 'digital';
  const isPetCare = product?.collections?.slug === 'petcare';
  const isDropship = product?.supplier_name && isPetCare;

  // Base order data (always supported)
  const orderData = {
    order_id: orderId,
    product_id: product?.id || null,
    product_name: productName,
    product_slug: productSlug,
    quantity: quantity || 1,
    total,
    customer_name: customer.name,
    customer_email: customer.email,
    shipping_address: shippingAddress || null,
    pet_image_url: petImageUrl || null,
    status: 'confirmed',
  };

  // Try to insert with extended fields first, fallback to basic if columns don't exist
  let order, error;
  
  // First try with all new columns
  const extendedData = {
    ...orderData,
    selected_design: selectedDesign || null,
    design_addition: designAddition || 0,
    size: size || null,
    style: style || null,
    custom_order: customOrder || false,
    is_digital: isDigital,
    is_dropship: isDropship,
  };

  const result = await supabase.from('orders').insert(extendedData).select().single();
  
  if (result.error?.message?.includes('column') || result.error?.message?.includes('schema')) {
    // Fallback to basic insert if new columns don't exist
    const basicResult = await supabase.from('orders').insert(orderData).select().single();
    order = basicResult.data;
    error = basicResult.error;
  } else {
    order = result.data;
    error = result.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send order confirmation email
  sendOrderConfirmationEmail(order, product, customer, isDigital);

  // Forward to CJ Dropshipping if applicable
  if (isDropship) {
    const cjResult = await forwardToCJDropshipping(order, product, customer, shippingAddress);
    if (cjResult?.data?.orderId) {
      // Try to update with CJ fields, ignore if columns don't exist
      try {
        await supabase.from('orders').update({
          cj_order_id: cjResult.data.orderId,
          dropship_status: 'submitted',
        }).eq('id', order.id);
      } catch (e) {
        // Ignore if columns don't exist
      }
    }
  }

  return NextResponse.json({ success: true, order }, { status: 201 });
}

export async function GET(request) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data || [] });
}
