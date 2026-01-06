import React, { useState, useCallback, useMemo, useEffect } from 'react';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

const PRICING = {
  styles: { chibi: 0, ghibli: 15, popmart: 20, realistic: 10 },
  cases: { black: 89, gold: 129, terrazzo: 149, led: 169 },
  addons: { dateEngraving: 25, spotifyCode: 15, miniRose: 12, ribbon: 8, messageCard: 5, bellCollar: 6 },
  exchangeRate: 24500,
};

const STYLE_INFO = {
  chibi: { name: 'Chibi', desc: 'Cute, exaggerated proportions', icon: '✿' },
  ghibli: { name: 'Ghibli', desc: 'Soft, whimsical aesthetic', icon: '❀' },
  popmart: { name: 'Pop Mart', desc: 'Designer collectible look', icon: '✾' },
  realistic: { name: 'Realistic', desc: 'Close to original photo', icon: '❁' },
};

const CASE_INFO = {
  black: { name: 'Classic Black', desc: 'Elegant matte finish', image: '/cases/black.jpg', price: 89 },
  gold: { name: 'Luxury Gold', desc: 'Premium gold accent', image: '/cases/gold.jpg', price: 129 },
  terrazzo: { name: 'Terrazzo', desc: 'Modern artistic style', image: '/cases/terrazzo.jpg', price: 149 },
  led: { name: 'LED Display', desc: 'Illuminated showcase', image: '/cases/led.jpg', price: 169 },
};

const ADDON_INFO = {
  dateEngraving: { name: 'Date Engraving', desc: 'Calendar style', icon: '📅' },
  spotifyCode: { name: 'Spotify Code', desc: 'Your special song', icon: '🎵' },
  miniRose: { name: 'Mini Rose', desc: 'Accent decoration', icon: '🌹' },
  ribbon: { name: 'Gift Wrap', desc: 'Premium ribbon', icon: '🎀' },
  messageCard: { name: 'Message Card', desc: 'Personal note', icon: '💌' },
  bellCollar: { name: 'Bell Collar', desc: 'For pets', icon: '🔔' },
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success || !data.image) throw new Error('No image in response');
      return data.image;
    } catch (error) {
      lastError = error;
      if (error.message.includes('Rate limited')) break;
    }
  }
  throw lastError;
};

// Floating petals animation component
const FloatingPetals = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="absolute text-2xl opacity-20 animate-float"
        style={{
          left: `${10 + i * 15}%`,
          animationDelay: `${i * 0.8}s`,
          animationDuration: `${6 + i}s`,
        }}
      >
        {['✿', '❀', '✾', '❁', '✿', '❀'][i]}
      </div>
    ))}
  </div>
);

// Glass card component
const GlassCard = ({ children, className = '', hover = true }) => (
  <div className={`
    bg-white/70 backdrop-blur-md rounded-3xl border border-white/50 shadow-lg
    ${hover ? 'hover:shadow-xl hover:scale-[1.02] hover:bg-white/80' : ''}
    transition-all duration-500 ease-out
    ${className}
  `}>
    {children}
  </div>
);

// Animated button component
const Button = ({ children, onClick, disabled, variant = 'primary', className = '' }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200/50 hover:shadow-xl hover:shadow-pink-300/50 hover:scale-105 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 disabled:shadow-none disabled:scale-100',
    secondary: 'bg-white/80 text-gray-700 border-2 border-pink-200 hover:border-pink-300 hover:bg-pink-50/80',
    ghost: 'text-gray-500 hover:text-pink-500 hover:bg-pink-50/50',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3.5 rounded-2xl font-medium
        transition-all duration-300 ease-out
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

const AddonOverlays = ({ addons, engravingDate }) => (
  <>
    {addons.bellCollar && <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 z-20 animate-bounce" style={{ animationDuration: '2s' }}><span className="text-xl drop-shadow-md">🔔</span></div>}
    {addons.miniRose && <div className="absolute bottom-[15%] right-[15%] z-20 animate-pulse"><span className="text-2xl drop-shadow-md">🌹</span></div>}
    {addons.spotifyCode && <div className="absolute bottom-[12%] left-[12%] z-20"><div className="bg-black/80 rounded-full px-2 py-1 flex items-center gap-1.5 shadow-lg"><span className="text-green-400 text-sm">♪</span><div className="flex gap-0.5 items-end h-3">{[4,7,3,8,5,9,4,6].map((h, i) => <div key={i} className="w-0.5 bg-green-400 rounded-full animate-pulse" style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }} />)}</div></div></div>}
    {addons.dateEngraving && <div className="absolute top-[12%] right-[12%] z-20"><div className="bg-white/95 backdrop-blur rounded-xl shadow-lg px-3 py-2 text-center border border-pink-100"><div className="text-pink-400 text-xs font-bold">❤</div><div className="text-gray-700 text-sm font-semibold">{engravingDate ? new Date(engravingDate).getDate() : '14'}</div><div className="text-gray-400 text-[10px] uppercase tracking-wide">{engravingDate ? new Date(engravingDate).toLocaleString('default', { month: 'short' }) : 'FEB'}</div></div></div>}
    {addons.ribbon && <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 animate-bounce" style={{ animationDuration: '3s' }}><span className="text-4xl drop-shadow-lg">🎀</span></div>}
  </>
);

const ProductPreview = ({ userPhoto, generatedSculpture, style, caseType, addons, isGenerating, engravingDate, error }) => {
  const currentCase = CASE_INFO[caseType] || CASE_INFO.black;

  return (
    <div className="relative w-72 h-96 mx-auto group">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-200/30 to-purple-200/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700 scale-90" />
      
      {/* Main container */}
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
        {/* Layer 1: Sculpture on black background */}
        <div className="absolute inset-0 bg-black flex items-center justify-center p-8 pb-16">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-pink-200/30 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-pink-400 rounded-full animate-spin" />
                <div className="absolute inset-2 border-4 border-transparent border-t-rose-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <p className="text-white/80 text-sm mt-4 font-light">Creating magic...</p>
              <p className="text-white/50 text-xs mt-1">~10-15 seconds</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-amber-200 text-sm">{error}</p>
            </div>
          ) : generatedSculpture ? (
            <img src={generatedSculpture} alt="Generated sculpture" className="w-full h-full object-contain animate-fadeIn" />
          ) : userPhoto ? (
            <img src={userPhoto} alt="Your photo" className="w-3/4 h-3/4 object-contain rounded-2xl opacity-40 grayscale" />
          ) : (
            <div className="text-center text-white/40">
              <span className="text-5xl block mb-3">✿</span>
              <p className="text-sm font-light">Your sculpture preview</p>
            </div>
          )}
        </div>

        {/* Layer 2: Case overlay */}
        <img
          src={currentCase.image}
          alt={currentCase.name}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500"
          style={{ mixBlendMode: 'screen' }}
        />

        {/* Layer 3: Add-ons */}
        <AddonOverlays addons={addons} engravingDate={engravingDate} />
      </div>

      {/* Style badge */}
      {style && (
        <div className="absolute -top-3 -left-3 bg-white rounded-2xl px-4 py-2 shadow-lg border border-pink-100 z-40 animate-fadeIn">
          <span className="text-sm font-medium text-gray-700">{STYLE_INFO[style].icon} {STYLE_INFO[style].name}</span>
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
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-pink-100/50">
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center gap-1">
                <div className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center text-lg
                  transition-all duration-500 ease-out
                  ${currentStep > step.num 
                    ? 'bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200/50 scale-90' 
                    : currentStep === step.num 
                      ? 'bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200/50 scale-110' 
                      : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {currentStep > step.num ? '✓' : step.icon}
                </div>
                <span className={`text-xs font-medium transition-colors duration-300 ${currentStep >= step.num ? 'text-pink-500' : 'text-gray-300'}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${currentStep > step.num ? 'bg-gradient-to-r from-pink-400 to-rose-400' : 'bg-gray-100'}`} />
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
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/90 backdrop-blur-lg border-t border-pink-100/50 shadow-2xl shadow-black/10">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-2xl font-semibold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              {formatPrice(total, currency)}
            </p>
          </div>
          <button 
            onClick={() => setCurrency(c => c === 'VND' ? 'USD' : 'VND')} 
            className="text-sm text-gray-400 hover:text-pink-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-pink-50"
          >
            Switch to {currency === 'VND' ? 'USD' : 'VND'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PhotoUpload = ({ order, setOrder, onNext }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleFile = useCallback((file) => {
    if (!file || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => setOrder(prev => ({ ...prev, referencePhoto: e.target.result }));
    reader.readAsDataURL(file);
  }, [setOrder]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/30 to-purple-50/30 relative overflow-hidden">
      <FloatingPetals />
      
      <div className="relative z-10 px-6 py-12 max-w-md mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="inline-flex items-center gap-2 bg-pink-100/50 rounded-full px-4 py-2 mb-6">
            <span className="text-pink-400">✿</span>
            <span className="text-sm text-pink-600 font-medium">Handcrafted with love</span>
          </div>
          
          <h1 className="text-4xl font-light text-gray-800 mb-3 tracking-tight">
            Ivy <span className="font-semibold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">Florisity</span>
          </h1>
          <p className="text-gray-500 font-light leading-relaxed">
            Transform your cherished memories into<br />beautiful preserved flower sculptures
          </p>
        </div>

        {/* Upload Area */}
        <GlassCard className="p-8 mb-8 animate-slideUp" hover={false}>
          <div
            onClick={() => document.getElementById('photo-input')?.click()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
              transition-all duration-500 ease-out
              ${order.referencePhoto 
                ? 'border-pink-300 bg-pink-50/50' 
                : isHovered 
                  ? 'border-pink-400 bg-pink-50/50 scale-[1.02]' 
                  : 'border-gray-200 hover:border-pink-300'
              }
            `}
          >
            <input 
              id="photo-input" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFile(e.target.files?.[0])} 
            />
            
            {order.referencePhoto ? (
              <div className="animate-fadeIn">
                <img 
                  src={order.referencePhoto} 
                  alt="Uploaded" 
                  className="max-h-56 mx-auto rounded-2xl shadow-lg object-contain" 
                />
                <p className="text-sm text-gray-400 mt-4">Tap to change photo</p>
              </div>
            ) : (
              <div className="py-8">
                <div className={`
                  w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 
                  flex items-center justify-center mb-4 transition-transform duration-500
                  ${isHovered ? 'scale-110 rotate-3' : ''}
                `}>
                  <span className="text-3xl">📷</span>
                </div>
                <p className="text-gray-700 font-medium mb-2">Upload a photo</p>
                <p className="text-sm text-gray-400">Your pet, loved one, or special memory</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Continue Button */}
        <Button 
          onClick={onNext} 
          disabled={!order.referencePhoto}
          className="w-full animate-slideUp"
          style={{ animationDelay: '0.2s' }}
        >
          Continue to Style Selection →
        </Button>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-4 animate-slideUp" style={{ animationDelay: '0.3s' }}>
          {[
            { icon: '🌿', label: 'Handcrafted' },
            { icon: '📦', label: 'Safe Shipping' },
            { icon: '💎', label: 'Premium Quality' },
          ].map((feature) => (
            <div key={feature.label} className="text-center">
              <span className="text-2xl">{feature.icon}</span>
              <p className="text-xs text-gray-400 mt-1">{feature.label}</p>
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
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/20 to-pink-50/30 pb-32">
      <ProgressSteps currentStep={2} />
      
      <div className="px-6 py-8 max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors mb-6 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back</span>
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-gray-800 mb-2">Choose Your <span className="font-semibold text-pink-500">Style</span></h2>
          <p className="text-gray-400 text-sm">AI will create a preview of your sculpture</p>
        </div>

        <div className="mb-8">
          <ProductPreview 
            userPhoto={order.referencePhoto} 
            generatedSculpture={order.style ? generatedImages[order.style] : null} 
            style={order.style} 
            caseType={order.caseType || 'black'} 
            addons={order.addons} 
            isGenerating={isGenerating} 
            error={error} 
          />
          {order.style && (generatedImages[order.style] || error) && !isGenerating && (
            <button 
              onClick={handleRegenerate} 
              className="mx-auto mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-pink-500 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all"
            >
              <span className="animate-spin-slow">🔄</span>
              {error ? 'Retry' : 'Regenerate'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {Object.entries(STYLE_INFO).map(([key, info], i) => (
            <GlassCard
              key={key}
              className={`p-4 cursor-pointer animate-slideUp ${order.style === key ? 'ring-2 ring-pink-400 bg-pink-50/50' : ''}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div onClick={() => !isGenerating && handleStyleSelect(key)} className={isGenerating ? 'opacity-50' : ''}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{info.icon}</span>
                  {generatedImages[key] && <span className="text-green-500 text-sm bg-green-50 rounded-full px-2 py-0.5">✓</span>}
                </div>
                <h3 className="font-medium text-gray-800">{info.name}</h3>
                <p className="text-xs text-gray-400 mb-2">{info.desc}</p>
                <p className="text-sm font-medium text-pink-500">
                  {PRICING.styles[key] === 0 ? 'Included' : `+$${PRICING.styles[key]}`}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>

        <Button onClick={onNext} disabled={!order.style} className="w-full">
          Continue to Case Selection →
        </Button>
      </div>
    </div>
  );
};

const CaseSelection = ({ order, setOrder, generatedImages, onNext, onBack }) => (
  <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/20 to-purple-50/30 pb-32">
    <ProgressSteps currentStep={3} />
    
    <div className="px-6 py-8 max-w-md mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors mb-6 group">
        <span className="group-hover:-translate-x-1 transition-transform">←</span>
        <span>Back</span>
      </button>
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light text-gray-800 mb-2">Select Your <span className="font-semibold text-pink-500">Case</span></h2>
        <p className="text-gray-400 text-sm">Tap to preview each display case</p>
      </div>

      <div className="mb-8">
        <ProductPreview 
          userPhoto={order.referencePhoto} 
          generatedSculpture={generatedImages[order.style]} 
          style={order.style} 
          caseType={order.caseType || 'black'} 
          addons={order.addons} 
          isGenerating={false} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {Object.entries(CASE_INFO).map(([key, info], i) => (
          <GlassCard
            key={key}
            className={`overflow-hidden cursor-pointer animate-slideUp ${order.caseType === key ? 'ring-2 ring-pink-400' : ''}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div onClick={() => setOrder(prev => ({ ...prev, caseType: key }))}>
              <div className="h-32 bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
                <img src={info.image} alt={info.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-800">{info.name}</h3>
                <p className="text-xs text-gray-400 mb-2">{info.desc}</p>
                <p className="text-lg font-semibold text-pink-500">${info.price}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <Button onClick={onNext} disabled={!order.caseType} className="w-full">
        Continue to Extras →
      </Button>
    </div>
  </div>
);

const AddonsSelection = ({ order, setOrder, generatedImages, onNext, onBack }) => {
  const toggleAddon = (key) => setOrder(prev => ({ ...prev, addons: { ...prev.addons, [key]: !prev.addons[key] } }));
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/20 to-pink-50/30 pb-32">
      <ProgressSteps currentStep={4} />
      
      <div className="px-6 py-8 max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors mb-6 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back</span>
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-gray-800 mb-2">Add <span className="font-semibold text-pink-500">Extras</span></h2>
          <p className="text-gray-400 text-sm">Make it even more special</p>
        </div>

        <div className="mb-8">
          <ProductPreview 
            userPhoto={order.referencePhoto} 
            generatedSculpture={generatedImages[order.style]} 
            style={order.style} 
            caseType={order.caseType} 
            addons={order.addons} 
            isGenerating={false} 
            engravingDate={order.engravingDate} 
          />
        </div>

        <div className="space-y-3 mb-6">
          {Object.entries(ADDON_INFO).map(([key, info], i) => (
            <GlassCard
              key={key}
              className={`p-4 cursor-pointer animate-slideUp ${order.addons[key] ? 'ring-2 ring-pink-400 bg-pink-50/50' : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div onClick={() => toggleAddon(key)} className="flex items-center gap-4">
                <div className={`
                  w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300
                  ${order.addons[key] ? 'bg-pink-500 border-pink-500 text-white scale-110' : 'border-gray-300'}
                `}>
                  {order.addons[key] && <span className="text-xs">✓</span>}
                </div>
                <span className="text-2xl">{info.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{info.name}</h3>
                  <p className="text-xs text-gray-400">{info.desc}</p>
                </div>
                <span className="text-pink-500 font-medium">+${PRICING.addons[key]}</span>
              </div>
            </GlassCard>
          ))}
        </div>

        {order.addons.dateEngraving && (
          <GlassCard className="p-4 mb-4 animate-fadeIn" hover={false}>
            <label className="block text-sm font-medium text-gray-600 mb-2">📅 Select Date</label>
            <input 
              type="date" 
              value={order.engravingDate || ''} 
              onChange={(e) => setOrder(prev => ({ ...prev, engravingDate: e.target.value }))} 
              className="w-full p-3 rounded-xl border border-pink-200 bg-white/50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300" 
            />
          </GlassCard>
        )}

        {order.addons.messageCard && (
          <GlassCard className="p-4 mb-6 animate-fadeIn" hover={false}>
            <textarea 
              value={order.message || ''} 
              onChange={(e) => setOrder(prev => ({ ...prev, message: e.target.value }))} 
              placeholder="Write your heartfelt message..." 
              maxLength={150} 
              className="w-full p-3 rounded-xl border border-pink-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none h-24 text-gray-700" 
            />
          </GlassCard>
        )}

        <Button onClick={onNext} className="w-full">
          Continue to Checkout →
        </Button>
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
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/20 to-purple-50/30 pb-8">
      <ProgressSteps currentStep={5} />
      
      <div className="px-6 py-8 max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors mb-6 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back</span>
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-gray-800 mb-2">Complete Your <span className="font-semibold text-pink-500">Order</span></h2>
        </div>

        <div className="mb-6 scale-75 origin-top">
          <ProductPreview 
            userPhoto={order.referencePhoto} 
            generatedSculpture={generatedImages[order.style]} 
            style={order.style} 
            caseType={order.caseType} 
            addons={order.addons} 
            isGenerating={false} 
            engravingDate={order.engravingDate} 
          />
        </div>

        {/* Order Summary */}
        <GlassCard className="p-6 mb-4" hover={false}>
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <span>📋</span> Order Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{STYLE_INFO[order.style]?.name} Style</span>
              <span>{PRICING.styles[order.style] === 0 ? 'Included' : formatPrice(PRICING.styles[order.style], currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{CASE_INFO[order.caseType]?.name}</span>
              <span>{formatPrice(PRICING.cases[order.caseType], currency)}</span>
            </div>
            {Object.entries(order.addons).filter(([_, v]) => v).map(([key]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-500">{ADDON_INFO[key]?.name}</span>
                <span>{formatPrice(PRICING.addons[key], currency)}</span>
              </div>
            ))}
            <div className="border-t border-pink-100 pt-3 mt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-pink-500">{formatPrice(total, currency)}</span>
            </div>
          </div>
          <button onClick={() => setCurrency(c => c === 'VND' ? 'USD' : 'VND')} className="text-xs text-gray-400 mt-3 hover:text-pink-500 transition-colors">
            Switch to {currency === 'VND' ? 'USD' : 'VND'}
          </button>
        </GlassCard>

        {/* Contact Info */}
        <GlassCard className="p-6 mb-4" hover={false}>
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <span>👤</span> Contact Information
          </h3>
          <div className="space-y-3">
            <input 
              type="text" 
              value={contact.name} 
              onChange={(e) => setContact(p => ({ ...p, name: e.target.value }))} 
              placeholder="Full name *" 
              className={`w-full p-3 rounded-xl border bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 ${errors.name ? 'border-red-300' : 'border-pink-100'}`} 
            />
            <input 
              type="tel" 
              value={contact.phone} 
              onChange={(e) => setContact(p => ({ ...p, phone: e.target.value }))} 
              placeholder="Phone / Zalo *" 
              className={`w-full p-3 rounded-xl border bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 ${errors.phone ? 'border-red-300' : 'border-pink-100'}`} 
            />
            <input 
              type="email" 
              value={contact.email} 
              onChange={(e) => setContact(p => ({ ...p, email: e.target.value }))} 
              placeholder="Email (optional)" 
              className="w-full p-3 rounded-xl border border-pink-100 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" 
            />
            <textarea 
              value={contact.address} 
              onChange={(e) => setContact(p => ({ ...p, address: e.target.value }))} 
              placeholder="Shipping address *" 
              className={`w-full p-3 rounded-xl border bg-white/50 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-pink-300 ${errors.address ? 'border-red-300' : 'border-pink-100'}`} 
            />
          </div>
        </GlassCard>

        {/* Payment */}
        <GlassCard className="p-6 mb-6" hover={false}>
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <span>💳</span> Payment
          </h3>
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 text-sm space-y-2 mb-4">
            <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">Vietcombank</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-mono">1234567890</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span>IVY FLORISITY</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-pink-500">{formatPrice(total, currency)}</span></div>
          </div>
          <label className="block w-full p-4 border-2 border-dashed border-pink-200 rounded-2xl text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/50 transition-all">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setScreenshot(ev.target.result); r.readAsDataURL(f); }}} />
            {screenshot ? (
              <div>
                <img src={screenshot} alt="Payment" className="max-h-24 mx-auto rounded-xl" />
                <p className="text-xs text-gray-400 mt-2">Tap to change</p>
              </div>
            ) : (
              <div>
                <span className="text-2xl">📸</span>
                <p className="text-sm text-gray-500 mt-2">Upload payment screenshot</p>
              </div>
            )}
          </label>
        </GlassCard>

        <Button onClick={handleSubmit} className="w-full">
          Submit Order ✨
        </Button>
        <p className="text-xs text-gray-400 text-center mt-4">We'll contact you via Zalo within 24 hours</p>
      </div>
    </div>
  );
};

const Confirmation = ({ order, onReset }) => (
  <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white px-4 py-10">
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4"><span className="text-2xl">✓</span></div>
      <h1 className="text-xl text-stone-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>Thank You!</h1>
      <p className="text-stone-500 text-sm mb-6">Order received</p>
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6 text-left">
        <div className="text-center mb-4"><p className="text-xs text-stone-500">Reference</p><p className="text-2xl font-mono font-bold text-rose-600">{order.id}</p></div>
        <div className="border-t border-stone-100 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-stone-500">Style</span><span>{STYLE_INFO[order.style]?.name}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Case</span><span>{CASE_INFO[order.caseType]?.name}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span className="text-rose-600">{formatPrice(order.totalPrice, order.currency)}</span></div>
        </div>
      </div>
      <div className="bg-rose-50 rounded-lg p-3 mb-6 text-sm text-stone-600">📱 We'll contact you at <strong>{order.customerContact.phone}</strong> within 24 hours</div>
      <button onClick={onReset} className="w-full py-3 rounded-xl font-medium border-2 border-rose-200 text-rose-600 hover:bg-rose-50">Create Another Order</button>
    </div>
  </div>
);

const initialOrder = { referencePhoto: null, style: null, caseType: null, addons: { dateEngraving: false, spotifyCode: false, miniRose: false, ribbon: false, messageCard: false, bellCollar: false }, message: '', engravingDate: '' };

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
    <div className="font-sans antialiased bg-floral-frame min-h-screen">
      {step > 1 && step < 6 && <ProgressSteps currentStep={step} />}
      {step === 1 && <PhotoUpload order={order} setOrder={setOrder} onNext={() => setStep(2)} />}
      {step === 2 && <StyleSelection order={order} setOrder={setOrder} generatedImages={generatedImages} setGeneratedImages={setGeneratedImages} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <CaseSelection order={order} setOrder={setOrder} generatedImages={generatedImages} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <AddonsSelection order={order} setOrder={setOrder} generatedImages={generatedImages} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
      {step === 5 && <Checkout order={order} generatedImages={generatedImages} currency={currency} setCurrency={setCurrency} onComplete={handleComplete} onBack={() => setStep(4)} />}
      {step >= 2 && step <= 4 && <PriceBar order={order} currency={currency} setCurrency={setCurrency} />}
    </div>
  );
}
