import React, { useState, useCallback, useMemo } from 'react';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

const PRICING = {
  styles: { chibi: 0, ghibli: 15, popmart: 20, realistic: 10 },
  cases: { black: 89, gold: 129, terrazzo: 149, led: 169 },
  addons: { dateEngraving: 25, spotifyCode: 15, miniRose: 12, ribbon: 8, messageCard: 5, bellCollar: 6 },
  exchangeRate: 24500,
};

const STYLE_INFO = {
  chibi: { name: 'Chibi', desc: 'Cute, exaggerated proportions', emoji: '🌸' },
  ghibli: { name: 'Ghibli', desc: 'Soft, whimsical aesthetic', emoji: '✨' },
  popmart: { name: 'Pop Mart', desc: 'Designer collectible look', emoji: '🎨' },
  realistic: { name: 'Realistic', desc: 'Close to original photo', emoji: '📷' },
};

const CASE_INFO = {
  black: { name: 'Classic Black', desc: 'Elegant matte finish', image: '/cases/black.jpg', price: 89 },
  gold: { name: 'Luxury Gold', desc: 'Premium gold accent', image: '/cases/gold.jpg', price: 129 },
  terrazzo: { name: 'Terrazzo', desc: 'Modern artistic style', image: '/cases/terrazzo.jpg', price: 149 },
  led: { name: 'LED Display', desc: 'Illuminated showcase', image: '/cases/led.jpg', price: 169 },
};

const ADDON_INFO = {
  dateEngraving: { name: 'Date Engraving', desc: 'Calendar style', emoji: '📅' },
  spotifyCode: { name: 'Spotify Code', desc: 'Your special song', emoji: '🎵' },
  miniRose: { name: 'Mini Rose', desc: 'Accent decoration', emoji: '🌹' },
  ribbon: { name: 'Gift Wrap', desc: 'Premium ribbon', emoji: '🎀' },
  messageCard: { name: 'Message Card', desc: 'Personal note', emoji: '💌' },
  bellCollar: { name: 'Bell Collar', desc: 'For pets', emoji: '🔔' },
};

const formatPrice = (usd, currency) => {
  if (currency === 'VND') return new Intl.NumberFormat('vi-VN').format(Math.round(usd * PRICING.exchangeRate)) + '₫';
  return '$' + usd.toFixed(2);
};

const generateOrderId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'IVY-';
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Compress image to prevent 413 errors
const compressImage = (file, maxWidth = 1024, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = URL.createObjectURL(file);
  });
};

const generateSculpturePreview = async (userPhoto, style, retries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) await sleep(1000 * Math.pow(2, attempt - 1));
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPhoto, style })
      });
      if (response.status === 429) throw new Error('Rate limited. Please wait.');
      if (response.status === 413) throw new Error('Image too large. Please use a smaller photo.');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success || !data.image) throw new Error('No image in response');
      return data.image;
    } catch (error) {
      lastError = error;
      if (error.message.includes('Rate limited') || error.message.includes('too large')) break;
    }
  }
  throw lastError;
};

const AddonOverlays = ({ addons, engravingDate }) => (
  <>
    {addons.bellCollar && <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 z-20 animate-bounce" style={{ animationDuration: '2s' }}><span className="text-xl drop-shadow-md">🔔</span></div>}
    {addons.miniRose && <div className="absolute bottom-[15%] right-[15%] z-20"><span className="text-2xl drop-shadow-md">🌹</span></div>}
    {addons.spotifyCode && <div className="absolute bottom-[12%] left-[12%] z-20"><div className="bg-black/80 rounded-full px-2 py-1 flex items-center gap-1.5 shadow-lg"><span className="text-green-400 text-sm">♪</span><div className="flex gap-0.5 items-end h-3">{[4,7,3,8,5,9,4,6].map((h, i) => <div key={i} className="w-0.5 bg-green-400 rounded-full" style={{ height: `${h}px` }} />)}</div></div></div>}
    {addons.dateEngraving && <div className="absolute top-[12%] right-[12%] z-20"><div className="bg-white/95 rounded shadow-lg px-2 py-1 text-center border border-stone-200"><div className="text-rose-500 text-xs font-bold">❤</div><div className="text-stone-700 text-xs font-medium">{engravingDate ? new Date(engravingDate).getDate() : '14'}</div><div className="text-stone-400 text-[8px]">{engravingDate ? new Date(engravingDate).toLocaleString('default', { month: 'short' }) : 'FEB'}</div></div></div>}
    {addons.ribbon && <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30"><span className="text-3xl drop-shadow-lg">🎀</span></div>}
  </>
);

const ProductPreview = ({ userPhoto, generatedSculpture, style, caseType, addons, isGenerating, engravingDate, error }) => {
  const currentCase = CASE_INFO[caseType] || CASE_INFO.black;

  const ContentLayer = () => {
    if (isGenerating) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-3" style={{ borderWidth: '3px', borderStyle: 'solid' }} />
          <p className="text-xs text-stone-300">Creating sculpture...</p>
          <p className="text-[10px] text-stone-400 mt-1">~10-15 seconds</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <span className="text-2xl mb-2">⚠️</span>
          <p className="text-xs text-amber-400 text-center">{error}</p>
        </div>
      );
    }
    if (generatedSculpture) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img 
            src={generatedSculpture} 
            alt="Generated sculpture" 
            className="max-w-[85%] max-h-[85%] object-contain"
            style={{ 
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
            }}
          />
        </div>
      );
    }
    return userPhoto ? (
      <img src={userPhoto} alt="Your photo" className="w-3/4 h-3/4 object-contain rounded-lg opacity-50" style={{ filter: 'sepia(0.3) saturate(0.8)' }} />
    ) : (
      <div className="text-center text-stone-400">
        <span className="text-4xl">🌸</span>
        <p className="text-xs mt-2">Upload a photo</p>
      </div>
    );
  };

  return (
    <div className="relative w-64 h-80 mx-auto">
      {/* Layer 1: Sculpture content on black background */}
      <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden rounded-t-lg">
        <ContentLayer />
      </div>

      {/* Layer 2: Case image overlay with screen blend mode */}
      <img
        src={currentCase.image}
        alt={currentCase.name}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Layer 3: Add-ons on top */}
      <AddonOverlays addons={addons} engravingDate={engravingDate} />

      {/* Style badge */}
      {style && (
        <div className="absolute -top-2 -left-2 bg-white rounded-full px-2 py-1 shadow-md border border-stone-100 z-40">
          <span className="text-xs">{STYLE_INFO[style].emoji} {STYLE_INFO[style].name}</span>
        </div>
      )}
    </div>
  );
};

  const ContentLayer = () => {
    if (isGenerating) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-3" style={{ borderWidth: '3px', borderStyle: 'solid' }} />
          <p className="text-xs text-stone-300">Creating sculpture...</p>
          <p className="text-[10px] text-stone-400 mt-1">~10-15 seconds</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <span className="text-2xl mb-2">⚠️</span>
          <p className="text-xs text-amber-400 text-center">{error}</p>
        </div>
      );
    }
    if (generatedSculpture) {
      return <img src={generatedSculpture} alt="Generated sculpture" className="w-full h-full object-contain" />;
    }
    return userPhoto ? (
      <img src={userPhoto} alt="Your photo" className="w-3/4 h-3/4 object-contain rounded-lg opacity-50" style={{ filter: 'sepia(0.3) saturate(0.8)' }} />
    ) : (
      <div className="text-center text-stone-400">
        <span className="text-4xl">🌸</span>
        <p className="text-xs mt-2">Upload a photo</p>
      </div>
    );
  };

  return (
    <div className="relative w-64 h-80 mx-auto">
      <div className="absolute inset-0 bg-black flex items-center justify-center p-6 pb-12 rounded-xl overflow-hidden">
        <ContentLayer />
      </div>
      <img
        src={currentCase.image}
        alt={currentCase.name}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />
      <AddonOverlays addons={addons} engravingDate={engravingDate} />
      {style && (
        <div className="absolute -top-2 -left-2 bg-white rounded-full px-2 py-1 shadow-md border border-stone-100 z-40">
          <span className="text-xs">{STYLE_INFO[style].emoji} {STYLE_INFO[style].name}</span>
        </div>
      )}
    </div>
  );
};

const ProgressSteps = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Photo', icon: '📷' },
    { num: 2, label: 'Style', icon: '✨' },
    { num: 3, label: 'Case', icon: '🎁' },
    { num: 4, label: 'Extras', icon: '💫' },
    { num: 5, label: 'Order', icon: '💝' },
  ];
  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-40">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all duration-300 ${
                  currentStep > step.num ? 'bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-md' 
                  : currentStep === step.num ? 'bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-lg scale-110' 
                  : 'bg-gray-100 text-gray-400'
                }`}>
                  {currentStep > step.num ? '✓' : step.icon}
                </div>
                <span className={`text-[10px] font-medium ${currentStep >= step.num ? 'text-pink-500' : 'text-gray-300'}`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-300 ${currentStep > step.num ? 'bg-gradient-to-r from-pink-400 to-rose-400' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const PriceBar = ({ order, currency, setCurrency }) => {
  const total = useMemo(() => {
    let sum = 0;
    if (order.caseType) sum += PRICING.cases[order.caseType];
    if (order.style) sum += PRICING.styles[order.style];
    Object.entries(order.addons).forEach(([key, val]) => { if (val && PRICING.addons[key]) sum += PRICING.addons[key]; });
    return sum;
  }, [order]);
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-pink-100 p-3 z-50 shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">{formatPrice(total, currency)}</p>
        </div>
        <button onClick={() => setCurrency(c => c === 'VND' ? 'USD' : 'VND')} className="text-xs text-pink-500 hover:text-pink-600 px-3 py-1.5 rounded-lg hover:bg-pink-50 transition-colors">
          Switch to {currency === 'VND' ? 'USD' : 'VND'}
        </button>
      </div>
    </div>
  );
};

const PhotoUpload = ({ order, setOrder, onNext }) => {
  const handleFile = useCallback(async (file) => {
    if (!file || file.size > 10 * 1024 * 1024) return;
    const compressed = await compressImage(file, 1024, 0.8);
    setOrder(prev => ({ ...prev, referencePhoto: compressed }));
  }, [setOrder]);
  
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Hero */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center gap-2 bg-pink-100/80 backdrop-blur rounded-full px-4 py-2 mb-4">
            <span className="text-pink-400">✿</span>
            <span className="text-sm text-pink-600 font-medium">Handcrafted with love</span>
          </div>
          <h1 className="text-3xl font-light text-gray-800 mb-2">
            Ivy <span className="font-semibold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">Florisity</span>
          </h1>
          <p className="text-gray-500">Transform your cherished memories into<br/>beautiful preserved flower sculptures</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50 mb-6 animate-slideUp">
          <div
            onClick={() => document.getElementById('photo-input')?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
              order.referencePhoto ? 'border-pink-300 bg-pink-50/50' : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/30'
            }`}
          >
            <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {order.referencePhoto ? (
              <div>
                <img src={order.referencePhoto} alt="Uploaded" className="max-h-48 mx-auto rounded-xl shadow-md object-contain" />
                <p className="text-xs text-gray-400 mt-3">Tap to change</p>
              </div>
            ) : (
              <div className="py-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl">📷</span>
                </div>
                <p className="text-gray-700 font-medium">Upload a photo</p>
                <p className="text-sm text-gray-400 mt-1">Your pet, loved one, or special memory</p>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onNext}
          disabled={!order.referencePhoto}
          className={`w-full py-3.5 rounded-2xl font-medium transition-all duration-300 ${
            order.referencePhoto
              ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200/50 hover:shadow-xl hover:scale-[1.02]'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          Continue to Style Selection →
        </button>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 animate-slideUp">
          {[
            { icon: '🌿', label: 'Handcrafted' },
            { icon: '📦', label: 'Safe Shipping' },
            { icon: '💎', label: 'Premium Quality' },
          ].map((f) => (
            <div key={f.label} className="text-center">
              <span className="text-xl">{f.icon}</span>
              <p className="text-xs text-gray-400 mt-1">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StyleSelection = ({ order, setOrder, generatedImages, setGeneratedImages, onNext, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  const handleStyleSelect = async (styleKey) => {
    setOrder(prev => ({ ...prev, style: styleKey }));
    setError(null);
    if (generatedImages[styleKey]) return;
    setIsGenerating(true);
    try {
      const result = await generateSculpturePreview(order.referencePhoto, styleKey);
      setGeneratedImages(prev => ({ ...prev, [styleKey]: result }));
    } catch (err) { setError(err.message || 'Generation failed. Tap to retry.'); }
    finally { setIsGenerating(false); }
  };
  
  const handleRegenerate = async () => {
    if (!order.style) return;
    setIsGenerating(true); setError(null);
    try {
      const result = await generateSculpturePreview(order.referencePhoto, order.style);
      setGeneratedImages(prev => ({ ...prev, [order.style]: result }));
    } catch (err) { setError(err.message || 'Regeneration failed.'); }
    finally { setIsGenerating(false); }
  };
  
  return (
    <div className="min-h-screen px-4 py-4 pb-28">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-pink-500 mb-4 text-sm transition-colors">
          <span>←</span> Back
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-xl text-gray-800 mb-1">Choose Your <span className="font-semibold text-pink-500">Style</span></h2>
          <p className="text-gray-400 text-sm">AI will create a preview of your sculpture</p>
        </div>

        <div className="mb-6">
          <ProductPreview userPhoto={order.referencePhoto} generatedSculpture={order.style ? generatedImages[order.style] : null} style={order.style} caseType={order.caseType || 'black'} addons={order.addons} isGenerating={isGenerating} error={error} />
          {order.style && (generatedImages[order.style] || error) && !isGenerating && (
            <button onClick={handleRegenerate} className="mx-auto mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-pink-500 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm transition-colors">
              🔄 {error ? 'Retry' : 'Regenerate'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {Object.entries(STYLE_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => handleStyleSelect(key)}
              disabled={isGenerating}
              className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 bg-white/80 backdrop-blur ${
                order.style === key ? 'border-pink-400 shadow-lg scale-[1.02]' : 'border-white/50 hover:border-pink-200'
              } ${isGenerating ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{info.emoji}</span>
                {generatedImages[key] && <span className="text-green-500 text-xs bg-green-50 rounded-full px-2 py-0.5">✓</span>}
              </div>
              <div className="font-medium text-gray-800">{info.name}</div>
              <div className="text-xs text-gray-400 mb-1">{info.desc}</div>
              <div className="text-sm font-medium text-pink-500">{PRICING.styles[key] === 0 ? 'Included' : `+$${PRICING.styles[key]}`}</div>
            </button>
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={!order.style}
          className={`w-full py-3.5 rounded-2xl font-medium transition-all duration-300 ${
            order.style ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200/50 hover:shadow-xl' : 'bg-gray-100 text-gray-400'
          }`}
        >
          Continue to Case Selection →
        </button>
      </div>
    </div>
  );
};

const CaseSelection = ({ order, setOrder, generatedImages, onNext, onBack }) => (
  <div className="min-h-screen px-4 py-4 pb-28">
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-pink-500 mb-4 text-sm transition-colors">
        <span>←</span> Back
      </button>
      
      <div className="text-center mb-6">
        <h2 className="text-xl text-gray-800 mb-1">Select Your <span className="font-semibold text-pink-500">Case</span></h2>
        <p className="text-gray-400 text-sm">Tap to preview each display case</p>
      </div>

      <div className="mb-6">
        <ProductPreview userPhoto={order.referencePhoto} generatedSculpture={generatedImages[order.style]} style={order.style} caseType={order.caseType || 'black'} addons={order.addons} isGenerating={false} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {Object.entries(CASE_INFO).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setOrder(prev => ({ ...prev, caseType: key }))}
            className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 bg-white/80 backdrop-blur ${
              order.caseType === key ? 'border-pink-400 shadow-lg scale-[1.02]' : 'border-white/50 hover:border-pink-200'
            }`}
          >
            <div className="h-28 bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
              <img src={info.image} alt={info.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-3">
              <div className="font-medium text-gray-800 text-sm">{info.name}</div>
              <div className="text-xs text-gray-400">{info.desc}</div>
              <div className="text-pink-500 font-semibold mt-1">${info.price}</div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!order.caseType}
        className={`w-full py-3.5 rounded-2xl font-medium transition-all duration-300 ${
          order.caseType ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200/50 hover:shadow-xl' : 'bg-gray-100 text-gray-400'
        }`}
      >
        Continue to Extras →
      </button>
    </div>
  </div>
);

const AddonsSelection = ({ order, setOrder, generatedImages, onNext, onBack }) => {
  const toggleAddon = (key) => setOrder(prev => ({ ...prev, addons: { ...prev.addons, [key]: !prev.addons[key] } }));
  
  return (
    <div className="min-h-screen px-4 py-4 pb-28">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-pink-500 mb-4 text-sm transition-colors">
          <span>←</span> Back
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-xl text-gray-800 mb-1">Add <span className="font-semibold text-pink-500">Extras</span></h2>
          <p className="text-gray-400 text-sm">Make it even more special</p>
        </div>

        <div className="mb-6">
          <ProductPreview userPhoto={order.referencePhoto} generatedSculpture={generatedImages[order.style]} style={order.style} caseType={order.caseType} addons={order.addons} isGenerating={false} engravingDate={order.engravingDate} />
        </div>

        <div className="space-y-2 mb-4">
          {Object.entries(ADDON_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => toggleAddon(key)}
              className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition-all duration-300 bg-white/80 backdrop-blur ${
                order.addons[key] ? 'border-pink-400 shadow-md' : 'border-white/50 hover:border-pink-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center text-xs transition-all ${
                order.addons[key] ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300'
              }`}>
                {order.addons[key] && '✓'}
              </div>
              <span className="text-xl">{info.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-800 text-sm">{info.name}</div>
                <div className="text-xs text-gray-400">{info.desc}</div>
              </div>
              <span className="text-pink-500 font-medium">+${PRICING.addons[key]}</span>
            </button>
          ))}
        </div>

        {order.addons.dateEngraving && (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 mb-4 border border-pink-100">
            <label className="block text-sm font-medium text-gray-600 mb-2">📅 Select Date</label>
            <input
              type="date"
              value={order.engravingDate || ''}
              onChange={(e) => setOrder(prev => ({ ...prev, engravingDate: e.target.value }))}
              className="w-full p-3 rounded-xl border border-pink-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
        )}

        {order.addons.messageCard && (
          <textarea
            value={order.message || ''}
            onChange={(e) => setOrder(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Write your heartfelt message..."
            maxLength={150}
            className="w-full p-4 rounded-2xl border border-pink-200 bg-white/80 backdrop-blur focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none h-24 mb-4"
          />
        )}

        <button
          onClick={onNext}
          className="w-full py-3.5 rounded-2xl font-medium bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200/50 hover:shadow-xl transition-all duration-300"
        >
          Continue to Checkout →
        </button>
      </div>
    </div>
  );
};

const Checkout = ({ order, generatedImages, currency, setCurrency, onComplete, onBack }) => {
  const [contact, setContact] = useState({ name: '', phone: '', email: '', address: '' });
  const [screenshot, setScreenshot] = useState(null);
  const [errors, setErrors] = useState({});
  
  const total = useMemo(() => {
    let sum = PRICING.cases[order.caseType] || 0;
    sum += PRICING.styles[order.style] || 0;
    Object.entries(order.addons).forEach(([key, val]) => { if (val && PRICING.addons[key]) sum += PRICING.addons[key]; });
    return sum;
  }, [order]);
  
  const validate = () => {
    const e = {};
    if (!contact.name.trim()) e.name = true;
    if (!contact.phone.trim()) e.phone = true;
    if (!contact.address.trim()) e.address = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validate()) return;
    onComplete({
      ...order,
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      totalPrice: total,
      currency,
      paymentScreenshot: screenshot,
      customerContact: contact,
      status: 'pending',
      generatedPreview: generatedImages[order.style]
    });
  };
  
  return (
    <div className="min-h-screen px-4 py-4 pb-8">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-pink-500 mb-4 text-sm transition-colors">
          <span>←</span> Back
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-xl text-gray-800 mb-1">Complete Your <span className="font-semibold text-pink-500">Order</span></h2>
        </div>

        <div className="mb-4 scale-75 origin-top">
          <ProductPreview userPhoto={order.referencePhoto} generatedSculpture={generatedImages[order.style]} style={order.style} caseType={order.caseType} addons={order.addons} isGenerating={false} engravingDate={order.engravingDate} />
        </div>

        {/* Summary */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-5 mb-4 border border-white/50 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">📋 Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{STYLE_INFO[order.style]?.name} Style</span><span>{PRICING.styles[order.style] === 0 ? 'Included' : formatPrice(PRICING.styles[order.style], currency)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{CASE_INFO[order.caseType]?.name}</span><span>{formatPrice(PRICING.cases[order.caseType], currency)}</span></div>
            {Object.entries(order.addons).filter(([_, v]) => v).map(([key]) => (
              <div key={key} className="flex justify-between"><span className="text-gray-500">{ADDON_INFO[key]?.name}</span><span>{formatPrice(PRICING.addons[key], currency)}</span></div>
            ))}
            <div className="border-t border-pink-100 pt-2 mt-2 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-pink-500">{formatPrice(total, currency)}</span>
            </div>
          </div>
          <button onClick={() => setCurrency(c => c === 'VND' ? 'USD' : 'VND')} className="text-xs text-gray-400 mt-2 hover:text-pink-500 transition-colors">
            Switch to {currency === 'VND' ? 'USD' : 'VND'}
          </button>
        </div>

        {/* Contact */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-5 mb-4 border border-white/50 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">👤 Contact Information</h3>
          <div className="space-y-3">
            <input type="text" value={contact.name} onChange={(e) => setContact(p => ({ ...p, name: e.target.value }))} placeholder="Full name *" className={`w-full p-3 rounded-xl border bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 ${errors.name ? 'border-red-300' : 'border-pink-100'}`} />
            <input type="tel" value={contact.phone} onChange={(e) => setContact(p => ({ ...p, phone: e.target.value }))} placeholder="Phone / Zalo *" className={`w-full p-3 rounded-xl border bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 ${errors.phone ? 'border-red-300' : 'border-pink-100'}`} />
            <input type="email" value={contact.email} onChange={(e) => setContact(p => ({ ...p, email: e.target.value }))} placeholder="Email (optional)" className="w-full p-3 rounded-xl border border-pink-100 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
            <textarea value={contact.address} onChange={(e) => setContact(p => ({ ...p, address: e.target.value }))} placeholder="Shipping address *" className={`w-full p-3 rounded-xl border bg-white/50 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-pink-300 ${errors.address ? 'border-red-300' : 'border-pink-100'}`} />
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-5 mb-6 border border-white/50 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">💳 Payment</h3>
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 text-sm space-y-2 mb-4">
            <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">Vietcombank</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-mono">1234567890</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span>IVY FLORISITY</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-pink-500">{formatPrice(total, currency)}</span></div>
          </div>
          <label className="block w-full p-4 border-2 border-dashed border-pink-200 rounded-xl text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/50 transition-all">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setScreenshot(ev.target.result); r.readAsDataURL(f); }}} />
            {screenshot ? (
              <div><img src={screenshot} alt="Payment" className="max-h-24 mx-auto rounded-xl" /><p className="text-xs text-gray-400 mt-2">Tap to change</p></div>
            ) : (
              <div><span className="text-2xl">📸</span><p className="text-sm text-gray-500 mt-2">Upload payment screenshot</p></div>
            )}
          </label>
        </div>

        <button onClick={handleSubmit} className="w-full py-3.5 rounded-2xl font-medium bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200/50 hover:shadow-xl transition-all duration-300">
          Submit Order ✨
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">We'll contact you via Zalo within 24 hours</p>
      </div>
    </div>
  );
};

const Confirmation = ({ order, onReset }) => (
  <div className="min-h-screen px-4 py-10">
    <div className="max-w-md mx-auto text-center">
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-400 rounded-3xl flex items-center justify-center mb-6 shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
        <span className="text-3xl text-white">✓</span>
      </div>
      <h1 className="text-2xl font-light text-gray-800 mb-2">Thank You!</h1>
      <p className="text-gray-500 mb-8">Your order has been received</p>
      
      <div className="bg-white/80 backdrop-blur rounded-2xl p-6 mb-6 text-left border border-white/50 shadow-sm">
        <div className="text-center mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order Reference</p>
          <p className="text-2xl font-mono font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">{order.id}</p>
        </div>
        <div className="border-t border-pink-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Style</span><span>{STYLE_INFO[order.style]?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Case</span><span>{CASE_INFO[order.caseType]?.name}</span></div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t border-pink-100"><span>Total</span><span className="text-pink-500">{formatPrice(order.totalPrice, order.currency)}</span></div>
        </div>
      </div>

      <div className="bg-pink-50/80 backdrop-blur rounded-xl p-4 mb-8 text-sm text-gray-600">
        📱 We'll contact you at <strong>{order.customerContact.phone}</strong> within 24 hours
      </div>

      <button onClick={onReset} className="w-full py-3 rounded-2xl font-medium border-2 border-pink-200 text-pink-500 hover:bg-pink-50 transition-colors">
        Create Another Order
      </button>
    </div>
  </div>
);

const initialOrder = {
  referencePhoto: null,
  style: null,
  caseType: null,
  addons: { dateEngraving: false, spotifyCode: false, miniRose: false, ribbon: false, messageCard: false, bellCollar: false },
  message: '',
  engravingDate: ''
};

export default function App() {
  const [step, setStep] = useState(1);
  const [order, setOrder] = useState(initialOrder);
  const [currency, setCurrency] = useState('VND');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  
  const handleComplete = (final) => { setCompletedOrder(final); setStep(6); };
  const handleReset = () => { setOrder(initialOrder); setCompletedOrder(null); setGeneratedImages({}); setStep(1); };
  
  if (step === 6 && completedOrder) return <Confirmation order={completedOrder} onReset={handleReset} />;
  
  return (
    <div className="font-sans antialiased bg-floral-frame min-h-screen relative">
      <div className="relative z-10">
        {step > 1 && step < 6 && <ProgressSteps currentStep={step} />}
        {step === 1 && <PhotoUpload order={order} setOrder={setOrder} onNext={() => setStep(2)} />}
        {step === 2 && <StyleSelection order={order} setOrder={setOrder} generatedImages={generatedImages} setGeneratedImages={setGeneratedImages} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <CaseSelection order={order} setOrder={setOrder} generatedImages={generatedImages} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <AddonsSelection order={order} setOrder={setOrder} generatedImages={generatedImages} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
        {step === 5 && <Checkout order={order} generatedImages={generatedImages} currency={currency} setCurrency={setCurrency} onComplete={handleComplete} onBack={() => setStep(4)} />}
        {step >= 2 && step <= 4 && <PriceBar order={order} currency={currency} setCurrency={setCurrency} />}
      </div>
    </div>
  );
}
