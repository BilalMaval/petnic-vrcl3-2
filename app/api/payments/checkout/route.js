import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { stripeClient } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const {
      cart_items,
      origin_url,
      user_id,
      user_email,
      shipping,
      selected_design,
      attribution,
    } = body;

    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!origin_url) {
      return NextResponse.json({ error: 'Origin URL required' }, { status: 400 });
    }

    // Server-side price validation: fetch real prices from database.
    const lineItems = [];
    const validatedItems = [];
    let total = 0;

    for (const item of cart_items) {
      // Clamp quantity to a sane range - min 1 so nothing is free, and a
      // generous but bounded max so a spoofed value can't create an
      // absurdly large Stripe line item.
      const qty = Math.min(100, Math.max(1, parseInt(item.quantity || 1, 10)));
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, price, slug, image_url, in_stock')
        .eq('id', item.product_id)
        .single();

      if (error || !product) {
        return NextResponse.json(
          { error: `Product not found: ${item.product_id}` },
          { status: 400 }
        );
      }

      if (product.in_stock === false) {
        return NextResponse.json(
          { error: `${product.name} is currently out of stock` },
          { status: 400 }
        );
      }

      // Design surcharge: re-fetch the selected reference design's price from
      // the DB so the client can never spoof this amount (mirrors the
      // variation-option validation below). item.design_addition and
      // item.design_name, if sent, are display-only leftovers and are
      // ignored for pricing purposes.
      let designAddition = 0;
      let designName = null;
      if (item.design_id) {
        const { data: design } = await supabase
          .from('reference_designs')
          .select('id, name, price_addition')
          .eq('id', item.design_id)
          .single();
        if (design) {
          designAddition = parseFloat(design.price_addition) || 0;
          designName = design.name;
        }
      }

      // Variations: re-fetch the selected options' price from the DB so the
      // client can never spoof the surcharge amount.
      let variationAddition = 0;
      let variationLabels = [];
      const variationOptionIds = Array.isArray(item.variation_option_ids) ? item.variation_option_ids.filter(Boolean) : [];
      if (variationOptionIds.length > 0) {
        const { data: opts } = await supabase
          .from('variation_options')
          .select('id, label, price_addition')
          .in('id', variationOptionIds);
        for (const opt of opts || []) {
          variationAddition += parseFloat(opt.price_addition) || 0;
          variationLabels.push(opt.label);
        }
      }

      const unitPrice = parseFloat(product.price) + designAddition + variationAddition;
      const itemTotal = unitPrice * qty;
      total += itemTotal;

      const nameSuffixParts = [];
      if (designName) nameSuffixParts.push(designName);
      if (variationLabels.length > 0) nameSuffixParts.push(variationLabels.join(', '));
      const itemName = nameSuffixParts.length > 0 ? `${product.name} — ${nameSuffixParts.join(', ')}` : product.name;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: itemName,
            images: product.image_url ? [product.image_url] : [],
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: qty,
      });

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        quantity: qty,
        unit_price: unitPrice,
        total: itemTotal,
        design_name: designName,
        design_addition: designAddition,
        variation_options: variationLabels,
        variation_addition: variationAddition,
      });
    }

    const successUrl = `${origin_url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin_url}/checkout/cancel`;

    const stripe = stripeClient;
    const sessionParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user_id || '',
        user_email: user_email || '',
        items_count: String(validatedItems.length),
      },
    };

    if (user_email) {
      sessionParams.customer_email = user_email;
    }

    if (shipping && shipping.required) {
      sessionParams.shipping_address_collection = {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'PT', 'PL'],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // First-touch marketing attribution (utm_*/fbclid), captured client-side
    // before checkout started. Stored alongside items/shipping in the same
    // JSONB metadata column - a sibling key, not merged into `items`, so it
    // can't corrupt the item schema. Allow-listed so only the known
    // attribution fields can ever land here, regardless of what the client
    // sends.
    const ATTRIBUTION_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'captured_at'];
    let cleanAttribution = null;
    if (attribution && typeof attribution === 'object' && !Array.isArray(attribution)) {
      cleanAttribution = {};
      for (const key of ATTRIBUTION_FIELDS) {
        if (typeof attribution[key] === 'string' && attribution[key]) {
          cleanAttribution[key] = attribution[key].slice(0, 255);
        }
      }
      if (Object.keys(cleanAttribution).length === 0) cleanAttribution = null;
    }

    // Record pending payment transaction. Non-fatal if the table is missing.
    try {
      await supabase.from('payment_transactions').insert({
        session_id: session.id,
        amount: parseFloat(total.toFixed(2)),
        currency: 'usd',
        status: 'pending',
        payment_status: 'initiated',
        user_id: user_id || null,
        user_email: user_email || null,
        metadata: {
          items: validatedItems,
          shipping: shipping || null,
          selected_design: selected_design || null,
          attribution: cleanAttribution,
        },
        created_at: new Date().toISOString(),
      });
    } catch (txErr) {
      console.error('payment_transactions insert failed:', txErr);
    }

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}
