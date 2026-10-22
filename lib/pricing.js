import { getSupabaseAdmin } from '@/lib/supabase';

// Server-side cart pricing. Everything is re-read from the database; the
// browser only supplies ids and quantities, never prices. Shared by
// /api/payments/checkout and /api/coupons/validate so both always agree.
//
// items: [{ product_id, quantity, design_id?, variation_option_ids? }]
// Returns { ok: true, lines, subtotal } or { ok: false, error }.
export async function priceItems(items) {
  const supabase = getSupabaseAdmin();
  const lines = [];
  let subtotalCents = 0;

  for (const item of items) {
    // Clamp quantity: min 1 so nothing is free, bounded max so a spoofed value
    // can't create an absurd Stripe line item.
    const qty = Math.min(100, Math.max(1, parseInt(item.quantity || 1, 10) || 1));

    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, price, slug, image_url, in_stock, collections(slug)')
      .eq('id', item.product_id)
      .single();

    if (error || !product) {
      return { ok: false, error: `Product not found: ${item.product_id}` };
    }
    if (product.in_stock === false) {
      return { ok: false, error: `${product.name} is currently out of stock` };
    }

    // Design surcharge: re-fetched so the client can never spoof it.
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

    // Variation surcharges: also re-fetched.
    let variationAddition = 0;
    const variationLabels = [];
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

    // products.price is the current selling price; original_price is only the
    // struck-through "was" price shown in the UI.
    const unitPrice = parseFloat(product.price) + designAddition + variationAddition;
    const unitCents = Math.round(unitPrice * 100);
    subtotalCents += unitCents * qty;

    const nameSuffixParts = [];
    if (designName) nameSuffixParts.push(designName);
    if (variationLabels.length > 0) nameSuffixParts.push(variationLabels.join(', '));

    lines.push({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      image_url: product.image_url,
      is_digital: product.collections?.slug === 'digital',
      quantity: qty,
      unit_price: unitPrice,
      unit_cents: unitCents,
      total: (unitCents * qty) / 100,
      display_name: nameSuffixParts.length > 0 ? `${product.name} — ${nameSuffixParts.join(', ')}` : product.name,
      design_name: designName,
      design_addition: designAddition,
      variation_options: variationLabels,
      variation_addition: variationAddition,
    });
  }

  return { ok: true, lines, subtotal: subtotalCents / 100 };
}
