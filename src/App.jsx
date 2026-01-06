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
  let result = 'FDC-';
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
      <div className="absolute inset-0 bg-black flex items-center justify-center p-6 pb-12">
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
  const steps = ['Upload', 'Style', 'Case', 'Extras', 'Pay'];
  return (
    <div className="flex items-center justify-center gap-1 py-3 px-2 bg-white/80 backdrop-blur sticky top-0 z-40 border-b border-stone-100">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${i + 1 < currentStep ? 'bg-rose-500 text-white' : i + 1 === currentStep ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-400' : 'bg-stone-100 text-stone-400'}`}>{i + 1 < currentStep ? '✓' : i + 1}</div>
            <span className={`text-xs hidden sm:inline ${i + 1 <= currentStep ? 'text-rose-600' : 'text-stone-300'}`}>{step}</span>
          </div>
          {i < steps.length - 1 && <div className={`w-4 sm:w-8 h-0.5 ${i + 1 < currentStep ? 'bg-rose-400' : 'bg-stone-200'}`} />}
        </React.Fragment>
      ))}
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
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-stone-200 p-3 z-50 shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div><p className="text-xs text-stone-400 uppercase tracking-wide">Total</p><p className="text-xl font-semibold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>{formatPrice(total, currency)}</p></div>
        <button onClick={() => setCurrency(c => c === 'VND' ? 'USD' : 'VND')} className="text-xs text-rose-500 hover:text-rose-600">→ {currency === 'VND' ? 'USD' : 'VND'}</button>
      </div>
    </div>
  );
};

const PhotoUpload = ({ order, setOrder, onNext }) => {
  const handleFile = useCallback((file) => {
    if (!file || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => setOrder(prev => ({ ...prev, referencePhoto: e.target.result }));
    reader.readAsDataURL(file);
  }, [setOrder]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-stone-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8"><div className="text-4xl mb-3">🌸</div><h1 className="text-2xl text-stone-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>Fleur de Charm</h1><p className="text-stone-400 text-sm">Preserved flower sculptures of your loved ones</p></div>
        <div onClick={() => document.getElementById('photo-input')?.click()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${order.referencePhoto ? 'border-rose-300 bg-rose-50/50' : 'border-stone-300 hover:border-rose-300 hover:bg-rose-50/30'}`}>
          <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          {order.referencePhoto ? <div><img src={order.referencePhoto} alt="Uploaded" className="max-h-48 mx-auto rounded-xl shadow-md object-contain" /><p className="text-xs text-stone-400 mt-3">Tap to change</p></div> : <div className="py-6"><div className="w-14 h-14 mx-auto bg-rose-100 rounded-full flex items-center justify-center mb-3"><span className="text-2xl">📷</span></div><p className="text-stone-600 font-medium">Upload a photo</p><p className="text-xs text-stone-400 mt-1">Your pet, partner, or cherished memory</p></div>}
        </div>
        <button onClick={onNext} disabled={!order.referencePhoto} className={`w-full mt-6 py-3.5 rounded-xl font-medium transition-all ${order.referencePhoto ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200' : 'bg-stone-100 text-stone-400'}`}>Continue →</button>
        <div className="mt-6 flex justify-center gap-4 text-xs text-stone-400"><span>🌿 Handcrafted</span><span>📦 Safe Shipping</span><span>💝 Guaranteed</span></div>
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
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-rose-50/30 px-4 py-4 pb-28">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-stone-500 hover:text-stone-700 mb-4 text-sm">← Back</button>
        <h2 className="text-xl text-stone-800 mb-1 text-center" style={{ fontFamily: 'Georgia, serif' }}>Choose Style</h2>
        <p className="text-stone-400 text-sm mb-4 text-center">AI will preview your sculpture</p>
        <div className="mb-4">
          <ProductPreview userPhoto={order.referencePhoto} generatedSculpture={order.style ? generatedImages[order.style] : null} style={order.style} caseType={order.caseType || 'black'} addons={order.addons} isGenerating={isGenerating} error={error} />
          {order.style && (generatedImages[order.style] || error) && !isGenerating && <button onClick={handleRegenerate} className="mx-auto mt-2 flex items-center gap-1 text-xs text-stone-500 hover:text-rose-500 bg-white px-3 py-1.5 rounded-full shadow-sm">🔄 {error ? 'Retry' : 'Regenerate'}</button>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(STYLE_INFO).map(([key, info]) => (
            <button key={key} onClick={() => handleStyleSelect(key)} disabled={isGenerating} className={`p-3 rounded-xl border-2 text-left transition-all ${order.style === key ? 'border-rose-400 bg-rose-50 shadow-md' : 'border-stone-200 bg-white hover:border-rose-200'} ${isGenerating ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2"><span className="text-xl">{info.emoji}</span>{generatedImages[key] && <span className="text-green-500 text-xs">✓</span>}</div>
              <div className="font-medium text-stone-800 text-sm">{info.name}</div>
              <div className="text-xs text-stone-500">{info.desc}</div>
              <div className="text-xs text-rose-500 mt-1 font-medium">{PRICING.styles[key] === 0 ? 'Included' : `+$${PRICING.styles[key]}`}</div>
            </button>
          ))}
        </div>
        <button onClick={onNext} disabled={!order.style} className={`w-full mt-6 py-3.5 rounded-xl font-medium transition-all ${order.style ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200' : 'bg-stone-100 text-stone-400'}`}>Continue →</button>
      </div>
    </div>
  );
};

const CaseSelection = ({ order, setOrder, generatedImages, onNext, onBack }) => (
  <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white px-4 py-4 pb-28">
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-stone-500 hover:text-stone-700 mb-4 text-sm">← Back</button>
      <div className="mb-4"><ProductPreview userPhoto={order.referencePhoto} generatedSculpture={generatedImages[order.style]} style={order.style} caseType={order.caseType || 'black'} addons={order.addons} isGenerating={false} /></div>
      <h2 className="text-xl text-stone-800 mb-1 text-center" style={{ fontFamily: 'Georgia, serif' }}>Select Case</h2>
      <p className="text-stone-400 text-sm mb-4 text-center">Tap to preview each case</p>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(CASE_INFO).map(([key, info]) => (
          <button key={key} onClick={() => setOrder(prev => ({ ...prev, caseType: key }))} className={`p-3 rounded-xl border-2 text-center transition-all ${order.caseType === key ? 'border-rose-400 bg-rose-50 shadow-md' : 'border-stone-200 bg-white hover:border-rose-200'}`}>
            <div className="w-full h-24 mb-2 rounded-lg overflow-hidden bg-stone-100">
              <img src={info.image} alt={info.name} className="w-full h-full object-cover" />
            </div>
            <div className="font-medium text-stone-800 text-sm">{info.name}</div>
            <div className="text-xs text-stone-500">{info.desc}</div>
            <div className="text-rose-500 font-semibold text-sm mt-1">${info.price}</div>
          </button>
        ))}
      </div>
      <button onClick={onNext} disabled={!order.caseType} className={`w-full mt-6 py-3.5 rounded-xl font-medium transition-all ${order.caseType ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200' : 'bg-stone-100 text-stone-400'}`}>Continue →</button>
    </div>
  </div>
);

const AddonsSelection = ({ order, setOrder, generatedImages, onNext, onBack }) => {
  const toggleAddon = (key) => setOrder(prev => ({ ...prev, addons: { ...prev.addons, [key]: !prev.addons[key] } }));
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-stone-50 px-4 py-4 pb-28">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-stone-500 hover:text-stone-700 mb-4 text-sm">← Back</button>
        <div className="mb-4"><ProductPreview userPhoto={order.referencePhoto} generatedSculpture={generatedImages[order.style]} style={order.style} caseType={order.caseType} addons={order.addons} isGenerating={false} engravingDate={order.engravingDate} /></div>
        <h2 className="text-xl text-stone-800 mb-1 text-center" style={{ fontFamily: 'Georgia, serif' }}>Add Extras</h2>
        <p className="text-stone-400 text-sm mb-4 text-center">Toggle to preview add-ons</p>
        <div className="space-y-2">
          {Object.entries(ADDON_INFO).map(([key, info]) => (
            <button key={key} onClick={() => toggleAddon(key)} className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${order.addons[key] ? 'border-rose-400 bg-rose-50' : 'border-stone-200 bg-white hover:border-rose-200'}`}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${order.addons[key] ? 'bg-rose-500 border-rose-500 text-white' : 'border-stone-300'}`}>{order.addons[key] && '✓'}</div>
              <div className="text-lg">{info.emoji}</div>
              <div className="flex-1"><div className="font-medium text-stone-800 text-sm">{info.name}</div><div className="text-xs text-stone-500">{info.desc}</div></div>
              <div className="text-rose-500 font-medium text-sm">+${PRICING.addons[key]}</div>
            </button>
          ))}
        </div>
        {order.addons.dateEngraving && <div className="mt-3 p-3 bg-rose-50 rounded-xl"><label className="block text-xs font-medium text-stone-600 mb-1">📅 Select Date</label><input type="date" value={order.engravingDate || ''} onChange={(e) => setOrder(prev => ({ ...prev, engravingDate: e.target.value }))} className="w-full p-2 rounded-lg border border-stone-200 text-sm" /></div>}
        {order.addons.messageCard && <textarea value={order.message || ''} onChange={(e) => setOrder(prev => ({ ...prev, message: e.target.value }))} placeholder="Your message..." maxLength={150} className="w-full mt-3 p-3 rounded-xl border border-rose-200 bg-rose-50 focus:outline-none resize-none h-20 text-sm" />}
        <button onClick={onNext} className="w-full mt-6 py-3.5 rounded-xl font-medium bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200">Continue →</button>
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
  const validate = () => { const e = {}; if (!contact.name.trim()) e.name = true; if (!contact.phone.trim()) e.phone = true; if (!contact.address.trim()) e.address = true; setErrors(e); return Object.keys(e).length === 0; };
  const handleSubmit = () => { if (!validate()) return; onComplete({ ...order, id: generateOrderId(), createdAt: new Date().toISOString(), totalPrice: total, currency, paymentScreenshot: screenshot, customerContact: contact, status: 'pending', generatedPreview: generatedImages[order.style] }); };
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-rose-50 px-4 py-4 pb-8">
      <div className="max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-stone-500 hover:text-stone-700 mb-4 text-sm">← Back</button>
        <div className="mb-4 scale-75 origin-top"><ProductPreview userPhoto={order.referencePhoto} generatedSculpture={generatedImages[order.style]} style={order.style} caseType={order.caseType} addons={order.addons} isGenerating={false} engravingDate={order.engravingDate} /></div>
        <h2 className="text-xl text-stone-800 mb-4 text-center" style={{ fontFamily: 'Georgia, serif' }}>Complete Order</h2>
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-medium text-stone-700 mb-3 text-sm">Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">{STYLE_INFO[order.style]?.name}</span><span>{PRICING.styles[order.style] === 0 ? 'Included' : formatPrice(PRICING.styles[order.style], currency)}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">{CASE_INFO[order.caseType]?.name}</span><span>{formatPrice(PRICING.cases[order.caseType], currency)}</span></div>
            {Object.entries(order.addons).filter(([_, v]) => v).map(([key]) => <div key={key} className="flex justify-between"><span className="text-stone-500">{ADDON_INFO[key]?.name}</span><span>{formatPrice(PRICING.addons[key], currency)}</span></div>)}
            <div className="border-t border-stone-100 pt-2 mt-2 flex justify-between font-semibold"><span>Total</span><span className="text-rose-600">{formatPrice(total, currency)}</span></div>
          </div>
          <button onClick={() => setCurrency(c => c === 'VND' ? 'USD' : 'VND')} className="text-xs text-stone-500 mt-2 underline">Show in {currency === 'VND' ? 'USD' : 'VND'}</button>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-medium text-stone-700 mb-3 text-sm">Contact</h3>
          <div className="space-y-3">
            <input type="text" value={contact.name} onChange={(e) => setContact(p => ({ ...p, name: e.target.value }))} placeholder="Full name *" className={`w-full p-2.5 rounded-lg border text-sm ${errors.name ? 'border-red-300' : 'border-stone-200'}`} />
            <input type="tel" value={contact.phone} onChange={(e) => setContact(p => ({ ...p, phone: e.target.value }))} placeholder="Phone / Zalo *" className={`w-full p-2.5 rounded-lg border text-sm ${errors.phone ? 'border-red-300' : 'border-stone-200'}`} />
            <input type="email" value={contact.email} onChange={(e) => setContact(p => ({ ...p, email: e.target.value }))} placeholder="Email (optional)" className="w-full p-2.5 rounded-lg border border-stone-200 text-sm" />
            <textarea value={contact.address} onChange={(e) => setContact(p => ({ ...p, address: e.target.value }))} placeholder="Shipping address *" className={`w-full p-2.5 rounded-lg border text-sm resize-none h-16 ${errors.address ? 'border-red-300' : 'border-stone-200'}`} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-medium text-stone-700 mb-3 text-sm">Payment</h3>
          <div className="bg-rose-50 rounded-lg p-3 text-sm space-y-1.5 mb-3">
            <div className="flex justify-between"><span className="text-stone-500">Bank</span><span className="font-medium">Vietcombank</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Account</span><span className="font-mono">1234567890</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Name</span><span>FLEUR DE CHARM</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Amount</span><span className="font-semibold text-rose-600">{formatPrice(total, currency)}</span></div>
          </div>
          <label className="block w-full p-3 border-2 border-dashed border-stone-300 rounded-lg text-center cursor-pointer hover:border-rose-300">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setScreenshot(ev.target.result); r.readAsDataURL(f); }}} />
            {screenshot ? <div><img src={screenshot} alt="Payment" className="max-h-24 mx-auto rounded" /><p className="text-xs text-stone-400 mt-1">Tap to change</p></div> : <div><span className="text-lg">📸</span><p className="text-xs text-stone-500 mt-1">Upload payment screenshot</p></div>}
          </label>
        </div>
        <button onClick={handleSubmit} className="w-full py-3.5 rounded-xl font-medium bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200">Submit Order</button>
        <p className="text-xs text-stone-400 text-center mt-3">We'll contact you via Zalo within 24 hours</p>
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
    <div className="font-sans antialiased bg-stone-50 min-h-screen">
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
