"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart, Heart, Upload, Check, CreditCard, Truck, Shield, ArrowLeft, Minus, Plus, X, ChevronLeft, ChevronRight, Download, ExternalLink, DollarSign, Sparkles } from 'lucide-react';
import { useCart, buildCartItemId } from '@/lib/cart-context';
import { trackViewItem, trackAddToCart, trackBeginCheckout, getStoredAttribution } from '@/lib/analytics';
import CouponBox from '@/components/CouponBox';

// Default reference designs for POD products
const defaultReferenceDesigns = [
  { id: '1', name: 'Royal Portrait', image_url: 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/11faab607d7dfdaec837a6ca421e7369244f77bbbaabea7caedc8d34f5bf07a0.png', style: 'Renaissance', price_addition: 15 },
  { id: '2', name: 'Watercolor Dream', image_url: 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/31cf0344eed89a11be88b5db76b107a0997f3fc000dbe4bf24011f19370fc976.png', style: 'Watercolor', price_addition: 10 },
  { id: '3', name: 'Pop Art Style', image_url: 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/097e314d68b881e61ddc64e167bb4cd94331e59eccff0582fa8f002ce4074689.png', style: 'Pop Art', price_addition: 12 },
  { id: '4', name: 'Minimalist Line', image_url: 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/d1d29644436b09b6ac43c931164715c89e977ff7f09fa689179db62b3f058836.png', style: 'Minimalist', price_addition: 8 },
  { id: '5', name: 'Oil Masterpiece', image_url: 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/a54b09da7dfaf130c0aea05b11c47d1f14137401aa7437f6a78787859e99d267.png', style: 'Oil Painting', price_addition: 18 },
  { id: '6', name: 'Neon Glow', image_url: 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/c72ddb46b2e864863327d1092bdf1947225321617d2d11b1e62c77aa3a63df5f.png', style: 'Neon', price_addition: 14 },
  { id: '7', name: 'Pencil Sketch', image_url: 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/281636f64e373da47761d96f9e76d510631c888f794b21815caec0df9b825abe.png', style: 'Sketch', price_addition: 10 },
  { id: '8', name: 'Cartoon Fun', image_url: 'https://static.prod-images.emergentagent.com/jobs/5614e763-9c16-41e3-8efd-88debc2ee481/images/453fb1b37636087cfd3298bcca5cdc4a49efce15cf5ebf869e69a74780c4347a.png', style: 'Cartoon', price_addition: 12 },
];

const ProductDetail = ({ product, related = [] }) => {
  const [quantity, setQuantity] = useState(1);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [referenceDesigns, setReferenceDesigns] = useState(defaultReferenceDesigns);
  const [showPayment, setShowPayment] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ name: '', email: '' });
  const [paymentError, setPaymentError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [variationGroups, setVariationGroups] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({}); // { [groupId]: optionId }
  const [variationError, setVariationError] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // validated coupon preview from the server
  const fileInputRef = useRef(null);
  const { addItem } = useCart();
  const viewedProductIdRef = useRef(null);

  // Fire view_item exactly once per distinct product id - guards against
  // React re-renders and Strict Mode's dev-only double-invoke firing it
  // twice for the same page visit.
  useEffect(() => {
    if (!product?.id || viewedProductIdRef.current === product.id) return;
    viewedProductIdRef.current = product.id;
    trackViewItem({
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: parseFloat(product.price) || 0,
        quantity: 1,
        item_category: product.categories?.name || product.collections?.name,
      }],
      value: parseFloat(product.price) || 0,
    });
  }, [product?.id]);

  // Fetch reference designs from API
  useEffect(() => {
    if (product?.collections?.slug === 'pod') {
      fetch('/api/reference-designs')
        .then(r => r.json())
        .then(d => { if (d.designs?.length > 0) setReferenceDesigns(d.designs); })
        .catch(() => {});
    }
  }, [product]);

  // Fetch applicable variation groups (global + this product's category + this product specifically)
  useEffect(() => {
    if (!product?.id) return;
    const params = new URLSearchParams({ productId: product.id });
    if (product.category_id) params.set('categoryId', product.category_id);
    fetch(`/api/variations?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        const groups = d.groups || [];
        setVariationGroups(groups);
        // Pre-select each group's default option, if any
        const defaults = {};
        groups.forEach(g => {
          const def = (g.variation_options || []).find(o => o.is_default)
            || (g.is_required ? (g.variation_options || [])[0] : null);
          if (def) defaults[g.id] = def.id;
        });
        setSelectedVariations(defaults);
      })
      .catch(() => {});
  }, [product?.id, product?.category_id]);

  if (!product) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center" data-testid="product-not-found">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Product Not Found</h1>
          <Link href="/shop" className="text-[#F97316] font-semibold hover:underline" data-testid="back-to-shop-link">Back to Shop</Link>
        </div>
      </main>
    );
  }

  const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;
  const isPOD = product.collections?.slug === 'pod';
  const isDigital = product.collections?.slug === 'digital';
  const isPetCare = product.collections?.slug === 'petcare';
  
  // Calculate total with design addition + selected variations
  const designAddition = selectedDesign?.price_addition || 0;
  const selectedOptionsList = variationGroups
    .map(g => (g.variation_options || []).find(o => o.id === selectedVariations[g.id]))
    .filter(Boolean);
  const variationAddition = selectedOptionsList.reduce((sum, o) => sum + (parseFloat(o.price_addition) || 0), 0);
  const baseTotal = (product.price * quantity);
  const total = (baseTotal + (isPOD ? designAddition : 0) + (variationAddition * quantity)).toFixed(2);
  // Per-unit price including design/variation surcharges - used for
  // analytics item price fields (GA4/Meta expect a per-unit price, not the
  // multiplied line total).
  const unitPrice = parseFloat(product.price) + (isPOD ? designAddition : 0) + variationAddition;
  const analyticsVariant = [
    isPOD && selectedDesign?.name,
    ...selectedOptionsList.map(o => o.label),
  ].filter(Boolean).join(', ') || undefined;

  const handleSelectVariation = (groupId, optionId, isRequired) => {
    setVariationError('');
    setSelectedVariations(prev => ({
      ...prev,
      [groupId]: (!isRequired && prev[groupId] === optionId) ? null : optionId,
    }));
  };

  const missingRequiredGroup = variationGroups.find(g => g.is_required && !selectedVariations[g.id]);

  // Parse gallery images (support gallery_urls array, JSON string, or comma-separated string)
  let galleryImages = [product.image_url];
  const gallerySource = product.gallery_urls || product.gallery_images;
  if (gallerySource) {
    try {
      const parsed = Array.isArray(gallerySource) 
        ? gallerySource
        : typeof gallerySource === 'string' 
          ? (gallerySource.startsWith('[') ? JSON.parse(gallerySource) : gallerySource.split(',').map(s => s.trim()))
          : [];
      if (parsed.length > 0) {
        galleryImages = [product.image_url, ...parsed.filter(Boolean)];
      }
    } catch {}
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setProcessing(true);
    // Buy Now checkout is starting - one item, no add_to_cart involved.
    trackBeginCheckout({
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: unitPrice,
        quantity,
        item_category: product.categories?.name || product.collections?.name,
        item_variant: analyticsVariant,
      }],
      value: parseFloat(total),
    });
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_url: window.location.origin,
          user_email: paymentForm.email || null,
          couponCode: appliedCoupon?.coupon.code || undefined,
          cart_items: [
            {
              product_id: product.id,
              quantity,
              design_id: isPOD ? selectedDesign?.id || null : null,
              variation_option_ids: selectedOptionsList.map(o => o.id),
            },
          ],
          shipping: { required: !isDigital, name: paymentForm.name },
          selected_design: isPOD ? selectedDesign?.name || null : null,
          attribution: getStoredAttribution(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to start checkout');
      }
      window.location.href = data.url;
    } catch (err) {
      setPaymentError(err.message || 'Something went wrong. Please try again.');
      setProcessing(false);
    }
  };

  const handleAddToCart = () => {
    if (missingRequiredGroup) {
      setVariationError(`Please choose a ${missingRequiredGroup.name.toLowerCase()}.`);
      return;
    }
    const variationOptionIds = selectedOptionsList.map(o => o.id);
    const designId = isPOD ? (selectedDesign?.id || null) : null;
    addItem({
      id: buildCartItemId(product.id, designId, variationOptionIds),
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      image_url: product.image_url,
      price: product.price,
      collection_slug: product.collections?.slug || null,
      quantity,
      design: isPOD && selectedDesign ? { id: selectedDesign.id, name: selectedDesign.name, price_addition: selectedDesign.price_addition } : null,
      variations: selectedOptionsList.map(o => ({ id: o.id, label: o.label, price_addition: o.price_addition })),
    });
    // Fire only after the item has actually been added above - represents
    // the quantity/config just added in this action, not the cart's new
    // cumulative total for that line.
    trackAddToCart({
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: unitPrice,
        quantity,
        item_category: product.categories?.name || product.collections?.name,
        item_variant: analyticsVariant,
      }],
      value: unitPrice * quantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleDownload = () => {
    if (product.download_file_url) {
      window.open(product.download_file_url, '_blank');
    }
  };

  if (orderComplete) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-20">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-lg text-center" data-testid="order-confirmation">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-10 h-10 text-green-600" /></div>
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Order Confirmed!</h1>
          <p className="text-[#4A4A68] mb-2" data-testid="order-id">Thank you for your order.</p>
          <p className="text-gray-500 mb-8">{isDigital ? 'Your download link has been sent to your email.' : 'Your custom product is being crafted with love.'}</p>
          <Link href="/shop" className="bg-[#F97316] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] py-8" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={isDigital ? '/digital-downloads' : '/shop'} className="inline-flex items-center gap-2 text-[#4A4A68] hover:text-[#F97316] transition-colors mb-8" data-testid="back-link">
          <ArrowLeft className="w-4 h-4" /><span>Back to {isDigital ? 'Digital Downloads' : 'Shop'}</span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm aspect-square">
              {uploadedImage ? (
                // Locally-uploaded data: URL preview — next/image can't optimize data URIs.
                <img src={uploadedImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Image
                  src={galleryImages[currentImageIndex]}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
              {product.badge && <span className="absolute top-4 left-4 bg-[#F97316] text-white text-sm font-bold px-4 py-1.5 rounded-full">{product.badge}</span>}
              {discount > 0 && <span className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">-{discount}% OFF</span>}
              
              {/* Gallery Navigation */}
              {galleryImages.length > 1 && !uploadedImage && (
                <>
                  <button 
                    onClick={() => setCurrentImageIndex(i => i === 0 ? galleryImages.length - 1 : i - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCurrentImageIndex(i => i === galleryImages.length - 1 ? 0 : i + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {galleryImages.length > 1 && !uploadedImage && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentImageIndex(idx); setUploadedImage(null); }}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-[#F97316] ring-2 ring-[#F97316] ring-offset-2' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Image src={img} alt={`${product.name} ${idx + 1}`} fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Pet Photo Upload Preview (POD only) */}
            {isPOD && uploadedImage && (
              <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
                <img src={uploadedImage} alt="Your pet" className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-green-700">Your pet photo uploaded</p>
                  <button onClick={() => setUploadedImage(null)} className="text-sm text-red-500 hover:underline">Remove</button>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-[#F97316] uppercase tracking-wider mb-2">{product.categories?.name || product.collections?.name}</p>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`w-5 h-5 ${s <= Math.round(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />)}</div>
                <span className="text-sm text-[#4A4A68]">{product.rating} ({(product.review_count || 0).toLocaleString()} reviews)</span>
              </div>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-[#F97316]">${product.price}</span>
                {product.original_price && <span className="text-xl text-gray-400 line-through">${product.original_price}</span>}
                {discount > 0 && <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">Save ${(product.original_price - product.price).toFixed(2)}</span>}
              </div>
              <p className="text-[#4A4A68] leading-relaxed">{product.description}</p>
            </div>

            {/* Digital Product Info */}
            {isDigital && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                {product.file_format && <p className="text-sm"><strong>Format:</strong> {product.file_format}</p>}
                {product.file_size && <p className="text-sm"><strong>Size:</strong> {product.file_size}</p>}
                {product.is_free && <p className="text-sm font-semibold text-green-600">Free Download</p>}
              </div>
            )}

            {/* Pet Care Product Info */}
            {isPetCare && (
              <div className="bg-green-50 rounded-xl p-4 space-y-2">
                {product.ingredients && <p className="text-sm"><strong>Ingredients:</strong> {product.ingredients}</p>}
                {product.weight && <p className="text-sm"><strong>Weight:</strong> {product.weight}</p>}
                {product.supplier_name && (
                  <p className="text-sm flex items-center gap-2 text-purple-600">
                    <ExternalLink className="w-4 h-4" />
                    <span>Shipped via {product.supplier_name}</span>
                  </p>
                )}
              </div>
            )}

            {/* Reference Designs Section (POD only) */}
            {isPOD && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#F97316]" />
                  <h3 className="font-bold text-[#1A1A2E]">Choose Your Art Style</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {referenceDesigns.slice(0, 8).map((design) => (
                    <button
                      key={design.id}
                      onClick={() => setSelectedDesign(selectedDesign?.id === design.id ? null : design)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:-translate-y-0.5 ${
                        selectedDesign?.id === design.id
                          ? 'border-[#F97316] ring-2 ring-[#F97316] ring-offset-1'
                          : 'border-gray-200 hover:border-orange-200'
                      }`}
                      data-testid={`design-${design.id}`}
                    >
                      <Image src={design.image_url} alt={design.name} fill sizes="120px" className="object-cover" />
                      {design.price_addition > 0 && (
                        <span className="absolute top-1 right-1 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          +${design.price_addition}
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                        <p className="text-white text-[9px] font-semibold truncate">{design.name}</p>
                      </div>
                      {selectedDesign?.id === design.id && (
                        <div className="absolute inset-0 bg-[#F97316]/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedDesign && (
                  <p className="text-sm text-[#4A4A68]">
                    Selected: <strong className="text-[#F97316]">{selectedDesign.name}</strong>
                    {selectedDesign.price_addition > 0 && <span className="text-green-600"> (+${selectedDesign.price_addition})</span>}
                  </p>
                )}
              </div>
            )}

            {/* Upload Section for POD products */}
            {isPOD && (
              <div 
                className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-[#F97316] transition-colors cursor-pointer" 
                onClick={() => fileInputRef.current?.click()} 
                data-testid="upload-section"
              >
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" data-testid="file-upload-input" />
                {uploadedImage ? (
                  <div className="space-y-2">
                    <Check className="w-8 h-8 text-green-500 mx-auto" />
                    <p className="text-green-600 font-semibold">Photo uploaded! Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="font-semibold text-[#1A1A2E]">Upload Your Pet Photo</p>
                    <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  </div>
                )}
              </div>
            )}

            {/* Product Variations (size, color, frame style, etc.) */}
            {variationGroups.length > 0 && (
              <div className="space-y-5">
                {variationGroups.map(group => (
                  <div key={group.id} data-testid={`variation-group-${group.id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-[#1A1A2E]">{group.name}</h3>
                      {group.is_required && <span className="text-xs text-red-500">Required</span>}
                    </div>

                    {group.input_type === 'select' ? (
                      <select
                        value={selectedVariations[group.id] || ''}
                        onChange={e => handleSelectVariation(group.id, e.target.value || null, group.is_required)}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-200"
                        data-testid={`variation-select-${group.id}`}
                      >
                        <option value="">{group.is_required ? 'Select...' : 'None'}</option>
                        {(group.variation_options || []).map(o => (
                          <option key={o.id} value={o.id}>
                            {o.label}{parseFloat(o.price_addition) > 0 ? ` (+$${parseFloat(o.price_addition).toFixed(2)})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : group.input_type === 'swatch' ? (
                      <div className="flex flex-wrap gap-2">
                        {(group.variation_options || []).map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => handleSelectVariation(group.id, o.id, group.is_required)}
                            title={`${o.label}${parseFloat(o.price_addition) > 0 ? ` (+$${parseFloat(o.price_addition).toFixed(2)})` : ''}`}
                            className={`w-9 h-9 rounded-full border-2 transition-all ${selectedVariations[group.id] === o.id ? 'border-[#F97316] ring-2 ring-[#F97316] ring-offset-2' : 'border-gray-200 hover:border-gray-300'}`}
                            style={{ backgroundColor: o.swatch_color || '#ccc' }}
                            data-testid={`variation-swatch-${o.id}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(group.variation_options || []).map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => handleSelectVariation(group.id, o.id, group.is_required)}
                            className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${selectedVariations[group.id] === o.id ? 'border-[#F97316] bg-orange-50 text-[#F97316]' : 'border-gray-200 text-[#1A1A2E] hover:border-gray-300'}`}
                            data-testid={`variation-button-${o.id}`}
                          >
                            {o.label}{parseFloat(o.price_addition) > 0 && <span className="text-green-600"> +${parseFloat(o.price_addition).toFixed(2)}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quantity & Buy */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-[#1A1A2E]">Quantity:</span>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"><Minus className="w-4 h-4" /></button>
                  <span className="w-12 text-center font-semibold" data-testid="quantity-display">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Price Summary */}
              {(((isPOD && selectedDesign)) || selectedOptionsList.length > 0) && (
                <div className="bg-orange-50 rounded-xl p-4 space-y-1 text-sm" data-testid="price-summary">
                  <div className="flex justify-between"><span>Base Price</span><span>${product.price}</span></div>
                  {isPOD && selectedDesign && (
                    <div className="flex justify-between text-green-600"><span>Design ({selectedDesign.name})</span><span>+${selectedDesign.price_addition}</span></div>
                  )}
                  {selectedOptionsList.map(o => (
                    <div key={o.id} className="flex justify-between text-green-600">
                      <span>{o.label}</span><span>+${parseFloat(o.price_addition).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span className="text-[#F97316]">${total}</span></div>
                </div>
              )}

              <div className="flex gap-3">
                {isDigital && product.is_free ? (
                  <button 
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-bold text-base hover:bg-green-700 transition-all"
                    data-testid="download-button"
                  >
                    <Download className="w-5 h-5" />Download Free
                  </button>
                ) : (
                  <button
                    data-testid="buy-now-button"
                    onClick={() => {
                      if (missingRequiredGroup) {
                        setVariationError(`Please choose a ${missingRequiredGroup.name.toLowerCase()}.`);
                        return;
                      }
                      setShowPayment(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#F97316] text-white py-4 rounded-xl font-bold text-base hover:bg-[#EA6C10] transition-all hover:shadow-lg hover:shadow-orange-200"
                  >
                    <ShoppingCart className="w-5 h-5" />Buy Now — ${total}
                  </button>
                )}
                {!(isDigital && product.is_free) && (
                  <button
                    type="button"
                    data-testid="add-to-cart-button"
                    onClick={handleAddToCart}
                    className={`w-14 h-14 border-2 rounded-xl flex items-center justify-center transition-colors ${addedToCart ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-200 text-gray-500 hover:border-[#F97316] hover:text-[#F97316]'}`}
                    title="Add to Cart"
                  >
                    {addedToCart ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                )}
                <button data-testid="wishlist-button" className="w-14 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:border-[#F97316] hover:text-[#F97316] transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
              {addedToCart && <p className="text-sm text-green-600 font-semibold" data-testid="add-to-cart-confirmation">✓ Added to cart</p>}
              {variationError && <p className="text-sm text-red-600" data-testid="variation-error">{variationError}</p>}
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-gray-100 text-sm text-[#4A4A68]">
              <span className="flex items-center gap-2"><Truck className="w-4 h-4" />Free Shipping Over $50</span>
              <span className="flex items-center gap-2"><Shield className="w-4 h-4" />30-Day Guarantee</span>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-20" data-testid="related-products">
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>You Might Also Like</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(p => (
                <Link key={p.id} href={`/product/${p.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all block">
                  <div className="relative overflow-hidden h-48">
                    <Image src={p.image_url} alt={p.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    {p.badge && <span className="absolute top-3 left-3 bg-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[#1A1A2E] line-clamp-1 mb-2">{p.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-[#F97316]">${p.price}</span>
                      {p.original_price && <span className="text-sm text-gray-400 line-through">${p.original_price}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="payment-modal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Checkout</h2>
              <button onClick={() => setShowPayment(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="font-semibold">{product.name} x {quantity}</p>
              {selectedDesign && <p className="text-sm text-[#4A4A68]">Style: {selectedDesign.name}</p>}
              {selectedOptionsList.length > 0 && (
                <p className="text-sm text-[#4A4A68]">{selectedOptionsList.map(o => o.label).join(', ')}</p>
              )}
              {appliedCoupon && (
                <p className="text-sm text-green-600 mt-1" data-testid="payment-coupon-line">Coupon ({appliedCoupon.coupon.code}) &minus;${appliedCoupon.discount.toFixed(2)}</p>
              )}
              <p className="text-2xl font-bold text-[#F97316]" data-testid="payment-total">${appliedCoupon ? appliedCoupon.total.toFixed(2) : total}</p>
            </div>
            <CouponBox
              items={[{ productId: product.id, quantity, designId: isPOD ? selectedDesign?.id || null : null, variationOptionIds: selectedOptionsList.map(o => o.id) }]}
              email={paymentForm.email}
              onChange={setAppliedCoupon}
            />
            <form onSubmit={handlePaymentSubmit} className="space-y-4" data-testid="payment-form">
              <p className="text-sm text-[#4A4A68]">
                You will be redirected to Stripe&apos;s secure checkout to complete payment{!isDigital ? ' and enter your shipping address' : ''}.
              </p>
              <input type="text" required placeholder="Full Name" value={paymentForm.name} onChange={e => setPaymentForm(f => ({...f, name: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" data-testid="payment-name-input" />
              <input type="email" required placeholder="Email Address" value={paymentForm.email} onChange={e => setPaymentForm(f => ({...f, email: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" data-testid="payment-email-input" />
              {paymentError && (
                <p className="text-sm text-red-600" data-testid="payment-error">{paymentError}</p>
              )}
              <button type="submit" data-testid="pay-now-button" disabled={processing} className="w-full flex items-center justify-center gap-2 bg-[#F97316] text-white py-4 rounded-xl font-bold text-base hover:bg-[#EA6C10] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <CreditCard className="w-5 h-5" />{processing ? 'Redirecting…' : appliedCoupon?.total === 0 ? 'Complete Free Order' : `Continue to Payment — ${appliedCoupon ? appliedCoupon.total.toFixed(2) : total}`}
              </button>
              <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1"><Shield className="w-3 h-3" />Secure payment powered by Stripe</p>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProductDetail;
