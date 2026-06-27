"use client";
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, Image, Palette, Eye, ArrowRight, Check, RotateCcw, ZoomIn, Move, Layers, Sparkles, Loader2, X, Download, AlertCircle, CreditCard, Shield } from 'lucide-react';

const artStyles = [
  { id: 'watercolor', name: 'Watercolor', color: '#3B82F6', description: 'Soft, flowing colors with artistic brush strokes' },
  { id: 'oil-painting', name: 'Oil Painting', color: '#F59E0B', description: 'Rich colors, Renaissance masters style' },
  { id: 'pop-art', name: 'Pop Art', color: '#EF4444', description: 'Bold, Andy Warhol inspired' },
  { id: 'renaissance', name: 'Renaissance', color: '#8B5CF6', description: 'Classical royal portrait style' },
  { id: 'minimalist', name: 'Minimalist', color: '#1A1A2E', description: 'Clean, simple modern art' },
  { id: 'cartoon', name: 'Cartoon', color: '#10B981', description: 'Cute illustration style' },
  { id: 'pencil-sketch', name: 'Pencil Sketch', color: '#6B7280', description: 'Detailed black and white' },
  { id: 'neon-glow', name: 'Neon Glow', color: '#EC4899', description: 'Cyberpunk style with neon' },
];

const productTypes = [
  { id: 1, name: 'Canvas Print', sizes: ['12x16"', '16x20"', '20x24"', '24x36"'], basePrice: 79.99 },
  { id: 2, name: 'Framed Poster', sizes: ['8x10"', '11x14"', '16x20"', '24x36"'], basePrice: 59.99 },
  { id: 3, name: 'Phone Case', sizes: ['iPhone 15', 'iPhone 16', 'Samsung S24', 'Pixel 9'], basePrice: 29.99 },
  { id: 4, name: 'Mug', sizes: ['11oz', '15oz'], basePrice: 24.99 },
  { id: 5, name: 'T-Shirt', sizes: ['S', 'M', 'L', 'XL', '2XL'], basePrice: 34.99 },
  { id: 6, name: 'Blanket', sizes: ['50x60"', '60x80"'], basePrice: 69.99 },
  { id: 7, name: 'Pillow', sizes: ['16x16"', '18x18"', '20x20"'], basePrice: 39.99 },
  { id: 8, name: 'Tote Bag', sizes: ['Standard', 'Large'], basePrice: 27.99 },
];

const CustomizePage = () => {
  const [step, setStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [customSize, setCustomSize] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [aiPreviewImage, setAiPreviewImage] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [petDescription, setPetDescription] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', address: '', city: '', zip: '', card: '' });
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setAiPreviewImage(null);
        setAiError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setAiPreviewImage(null);
        setAiError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const generateAIPreview = async () => {
    if (!selectedStyle) { setAiError('Please select an art style first'); return; }
    setAiLoading(true);
    setAiError(null);

    try {
      const prompt = petDescription.trim() ? `${petDescription}, cute pet portrait` : 'cute adorable pet, beautiful animal portrait';
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('style', selectedStyle.id);

      const response = await fetch('/api/ai-preview', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to generate preview');
      if (data.image_base64) {
        setAiPreviewImage(`data:image/png;base64,${data.image_base64}`);
      } else {
        throw new Error('No image returned from AI service');
      }
    } catch (error) {
      setAiError(error.message || 'Failed to generate AI preview. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const downloadPreview = () => {
    if (aiPreviewImage) {
      const link = document.createElement('a');
      link.href = aiPreviewImage;
      link.download = `pet-portrait-${selectedStyle?.id || 'preview'}.png`;
      link.click();
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setAiPreviewImage(null);
    setAiError(null);
    setPetDescription('');
    setStep(1);
  };

  const calculatePrice = () => {
    if (!selectedProduct) return 0;
    const sizeIndex = selectedProduct.sizes.indexOf(selectedSize);
    const sizeMultiplier = customSize ? 1.3 : (1 + (sizeIndex * 0.15));
    return (selectedProduct.basePrice * sizeMultiplier).toFixed(2);
  };

  const discountedPrice = () => (parseFloat(calculatePrice()) * 0.75).toFixed(2);
  const finalSize = customSize || selectedSize;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: `Custom ${selectedProduct?.name} - ${selectedStyle?.name}`,
          size: finalSize,
          style: selectedStyle?.name,
          quantity: 1,
          total: parseFloat(discountedPrice()),
          customer: { name: checkoutForm.name, email: checkoutForm.email },
          shippingAddress: { address: checkoutForm.address, city: checkoutForm.city, zip: checkoutForm.zip },
          customOrder: true,
        }),
      });
    } catch (err) {}
    setProcessing(false);
    setShowCheckout(false);
    setOrderComplete(true);
  };

  // Order Complete Screen
  if (orderComplete) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-20">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-lg text-center" data-testid="order-confirmation">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Order Confirmed!</h1>
          <p className="text-[#4A4A68] mb-2">Thank you for your custom order.</p>
          <p className="text-gray-500 mb-8">Your custom {selectedProduct?.name} with {selectedStyle?.name} style is being crafted with love.</p>
          <Link href="/shop" className="bg-[#F97316] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors inline-block">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            Create Your Custom Pet Masterpiece
          </h1>
          <p className="text-[#4A4A68] text-base">
            Describe your pet, choose a style, and watch AI create a stunning portrait preview
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[{ n: 1, label: 'Describe Pet' }, { n: 2, label: 'Choose Style' }, { n: 3, label: 'Pick Product' }, { n: 4, label: 'Preview & Order' }].map((s, idx) => (
            <React.Fragment key={s.n}>
              <button
                onClick={() => s.n <= step && setStep(s.n)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  step === s.n ? 'bg-[#F97316] text-white shadow-lg shadow-orange-200' : step > s.n ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}
                data-testid={`step-${s.n}-btn`}
              >
                {step > s.n ? <Check className="w-4 h-4" /> : <span>{s.n}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {idx < 3 && <div className={`w-8 h-0.5 ${step > s.n ? 'bg-green-300' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* Step 1: Upload/Describe */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <h2 className="text-xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <Sparkles className="inline w-5 h-5 mr-2 text-[#F97316]" />
                  Describe Your Pet
                </h2>
                <p className="text-sm text-gray-500 mb-4">Our AI will generate a beautiful portrait based on your description.</p>
                
                <textarea
                  value={petDescription}
                  onChange={(e) => setPetDescription(e.target.value)}
                  placeholder="Example: A fluffy golden retriever with big brown eyes, wearing a red bandana..."
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] outline-none resize-none h-32 text-sm"
                  data-testid="pet-description-input"
                />

                <div className="mt-4 text-center">
                  <span className="text-xs text-gray-400">— OR upload a reference photo (optional) —</span>
                </div>

                <div
                  className="mt-4 border-2 border-dashed border-orange-200 rounded-xl p-8 text-center hover:border-[#F97316] transition-colors cursor-pointer bg-orange-50/50"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  data-testid="upload-zone"
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} data-testid="file-input" />
                  {uploadedImage ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={uploadedImage} alt="Uploaded" className="w-16 h-16 rounded-lg object-cover" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Photo uploaded</p>
                        <p className="text-xs text-gray-400">{uploadedFile?.name}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); resetUpload(); }} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-[#F97316] mx-auto mb-3" />
                      <p className="text-[#1A1A2E] font-semibold mb-1">Drop your photo here</p>
                      <p className="text-xs text-gray-400">or click to browse • JPG, PNG • Max 10MB</p>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!petDescription.trim() && !uploadedImage}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-[#F97316] text-white py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="continue-to-style-btn"
                >
                  Continue to Style Selection <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Style */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <h2 className="text-xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  <Palette className="inline w-5 h-5 mr-2 text-[#F97316]" />
                  Choose Your Art Style
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {artStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-4 rounded-xl border-2 text-center transition-all hover:-translate-y-1 ${
                        selectedStyle?.id === style.id ? 'border-[#F97316] bg-orange-50 shadow-lg' : 'border-gray-100 hover:border-orange-200'
                      }`}
                      data-testid={`style-${style.id}-btn`}
                    >
                      <div className="w-10 h-10 rounded-full mx-auto mb-2" style={{ backgroundColor: style.color + '20' }}>
                        <Palette className="w-5 h-5 mx-auto mt-2.5" style={{ color: style.color }} />
                      </div>
                      <p className="text-xs font-semibold text-[#1A1A2E]">{style.name}</p>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{style.description}</p>
                    </button>
                  ))}
                </div>

                {selectedStyle && (
                  <div className="mt-6 space-y-4">
                    <button
                      onClick={generateAIPreview}
                      disabled={aiLoading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                      data-testid="generate-ai-preview-btn"
                    >
                      {aiLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" />Generating AI Preview... (30-60 seconds)</>
                      ) : (
                        <><Sparkles className="w-5 h-5" />Generate AI Preview</>
                      )}
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="w-full flex items-center justify-center gap-2 bg-[#F97316] text-white py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors"
                      data-testid="continue-to-product-btn"
                    >
                      Continue to Product Selection <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Product with Custom Size */}
            {step === 3 && (
              <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <h2 className="text-xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Select Your Product</h2>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {productTypes.map((pt) => (
                    <button
                      key={pt.id}
                      onClick={() => { setSelectedProduct(pt); setSelectedSize(pt.sizes[0]); setCustomSize(''); }}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:-translate-y-0.5 ${
                        selectedProduct?.id === pt.id ? 'border-[#F97316] bg-orange-50' : 'border-gray-100 hover:border-orange-200'
                      }`}
                      data-testid={`product-${pt.id}-btn`}
                    >
                      <p className="text-sm font-semibold text-[#1A1A2E]">{pt.name}</p>
                      <p className="text-xs text-gray-400">From ${pt.basePrice}</p>
                    </button>
                  ))}
                </div>
                {selectedProduct && (
                  <div>
                    {/* Size Selection - Preset and Custom side by side */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Preset Sizes */}
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A2E] mb-2">Choose Size:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.sizes.map((s) => (
                            <button
                              key={s}
                              onClick={() => { setSelectedSize(s); setCustomSize(''); }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                selectedSize === s && !customSize ? 'bg-[#F97316] text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-100'
                              }`}
                              data-testid={`size-${s}-btn`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Custom Size Input */}
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A2E] mb-2">Custom Size:</p>
                        <input
                          type="text"
                          value={customSize}
                          onChange={(e) => setCustomSize(e.target.value)}
                          placeholder="e.g. 30x40 inches"
                          className={`w-full px-3 py-2 rounded-lg text-sm border-2 outline-none transition-colors ${
                            customSize ? 'border-[#F97316] bg-orange-50' : 'border-gray-200 focus:border-[#F97316]'
                          }`}
                          data-testid="custom-size-input"
                        />
                        {customSize && <p className="text-xs text-green-600 mt-1">+30% for custom size</p>}
                      </div>
                    </div>

                    <button
                      onClick={() => setStep(4)}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-[#F97316] text-white py-3 rounded-xl font-semibold hover:bg-[#EA6C10] transition-colors"
                      data-testid="preview-order-btn"
                    >
                      Preview My Design <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Order Summary with Checkout */}
            {step === 4 && (
              <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <h2 className="text-xl font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Art Style</span><span className="font-semibold">{selectedStyle?.name}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Product</span><span className="font-semibold">{selectedProduct?.name}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Size</span>
                    <span className="font-semibold">{customSize || selectedSize} {customSize && <span className="text-green-600 text-xs">(Custom)</span>}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Subtotal</span><span className="font-semibold">${calculatePrice()}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Discount (25%)</span><span className="font-semibold text-green-600">-${(calculatePrice() * 0.25).toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Shipping</span><span className="font-semibold text-green-600">FREE</span></div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-100 text-lg"><span className="font-bold text-[#1A1A2E]">Total</span><span className="font-bold text-[#F97316]">${discountedPrice()}</span></div>
                </div>
                <button 
                  onClick={() => setShowCheckout(true)}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-[#F97316] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#EA6C10] transition-colors" 
                  data-testid="checkout-btn"
                >
                  Proceed to Checkout — ${discountedPrice()}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">30-day money-back guarantee • Free shipping on $50+</p>
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col items-center justify-center min-h-[500px]">
            {aiLoading ? (
              <div className="text-center" data-testid="ai-loading-state">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#F97316] animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-[#F97316] animate-pulse" />
                </div>
                <p className="text-[#1A1A2E] font-semibold mb-2">Creating Your AI Portrait...</p>
                <p className="text-sm text-gray-400">This may take 30-60 seconds</p>
              </div>
            ) : aiError ? (
              <div className="text-center" data-testid="ai-error-state">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-600 font-semibold mb-2">Oops! Something went wrong</p>
                <p className="text-sm text-gray-500 mb-4">{aiError}</p>
                <button onClick={generateAIPreview} className="px-6 py-2 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-[#EA6C10]" data-testid="retry-ai-btn">Try Again</button>
              </div>
            ) : aiPreviewImage ? (
              <div className="text-center w-full" data-testid="ai-preview-result">
                <div className="relative inline-block">
                  <img src={aiPreviewImage} alt="AI Generated Pet Portrait" className="w-full max-w-md rounded-xl shadow-lg mx-auto" data-testid="ai-preview-image" />
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Generated • {selectedStyle?.name}
                  </span>
                </div>
                <div className="flex justify-center gap-3 mt-6">
                  <button onClick={downloadPreview} className="p-2.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200" title="Download" data-testid="download-preview-btn"><Download className="w-4 h-4" /></button>
                  <button onClick={generateAIPreview} className="p-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-[#F97316]" title="Regenerate" data-testid="regenerate-btn"><RotateCcw className="w-4 h-4" /></button>
                </div>
                <p className="text-xs text-gray-400 mt-3">This is a preview. Final product will be professionally produced.</p>
              </div>
            ) : uploadedImage ? (
              <div className="text-center w-full">
                <div className="relative inline-block">
                  <img src={uploadedImage} alt="Uploaded pet photo" className="w-full max-w-md rounded-xl shadow-lg mx-auto" />
                  <span className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full">Your Photo</span>
                </div>
                {selectedStyle && (
                  <button onClick={generateAIPreview} className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 flex items-center gap-2 mx-auto" data-testid="generate-from-photo-btn">
                    <Sparkles className="w-5 h-5" /> Generate {selectedStyle.name} Preview
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Image className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 text-sm mb-2">Your AI portrait preview will appear here</p>
                <p className="text-xs text-gray-300">Describe your pet and select a style to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="checkout-modal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Playfair Display, serif' }}>Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="font-semibold">{selectedProduct?.name} - {selectedStyle?.name}</p>
              <p className="text-sm text-gray-500">Size: {customSize || selectedSize}</p>
              <p className="text-2xl font-bold text-[#F97316]">${discountedPrice()}</p>
            </div>
            <form onSubmit={handleCheckoutSubmit} className="space-y-4" data-testid="checkout-form">
              <input type="text" required placeholder="Full Name" value={checkoutForm.name} onChange={e => setCheckoutForm(f => ({...f, name: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" />
              <input type="email" required placeholder="Email Address" value={checkoutForm.email} onChange={e => setCheckoutForm(f => ({...f, email: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" />
              <input type="text" required placeholder="Shipping Address" value={checkoutForm.address} onChange={e => setCheckoutForm(f => ({...f, address: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" required placeholder="City" value={checkoutForm.city} onChange={e => setCheckoutForm(f => ({...f, city: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" />
                <input type="text" required placeholder="ZIP Code" value={checkoutForm.zip} onChange={e => setCheckoutForm(f => ({...f, zip: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" />
              </div>
              <input type="text" required placeholder="Card Number" value={checkoutForm.card} onChange={e => setCheckoutForm(f => ({...f, card: e.target.value}))} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none" />
              <button type="submit" data-testid="pay-now-button" disabled={processing} className="w-full flex items-center justify-center gap-2 bg-[#F97316] text-white py-4 rounded-xl font-bold text-base hover:bg-[#EA6C10] transition-all disabled:opacity-50">
                <CreditCard className="w-5 h-5" />{processing ? 'Processing...' : `Pay $${discountedPrice()}`}
              </button>
              <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1"><Shield className="w-3 h-3" />Secure 256-bit SSL encrypted payment</p>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default CustomizePage;
