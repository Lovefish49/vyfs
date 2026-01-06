const ProductPreview = ({ userPhoto, generatedSculpture, style, caseType, addons, isGenerating, engravingDate, error }) => {
  const currentCase = CASE_INFO[caseType] || CASE_INFO.black;
  
  const FallbackPreview = () => (
    <div className="w-full h-full flex items-center justify-center">
      {userPhoto ? (
        <img src={userPhoto} alt="Your photo" className="w-3/4 h-3/4 object-contain rounded-lg opacity-60" style={{ filter: 'sepia(0.3) saturate(0.8)' }} />
      ) : (
        <div className="text-center text-stone-400">
          <span className="text-4xl">🌸</span>
          <p className="text-xs mt-2">Upload a photo</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-64 h-80 mx-auto">
      {/* Layer 1: Sculpture on BLACK background - required for blend mode */}
      <div className="absolute inset-0 bg-black flex items-center justify-center p-8 pb-16">
        {isGenerating ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-3" />
            <p className="text-sm text-stone-300">Creating sculpture...</p>
            <p className="text-xs text-stone-400 mt-1">~10-15 seconds</p>
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <span className="text-3xl mb-2">⚠️</span>
            <p className="text-sm text-amber-400 text-center">{error}</p>
          </div>
        ) : generatedSculpture ? (
          <img src={generatedSculpture} alt="Generated sculpture" className="max-w-full max-h-full object-contain" />
        ) : (
          <FallbackPreview />
        )}
      </div>
      
      {/* Layer 2: Case overlay - black parts become transparent */}
      <img 
        src={currentCase.image} 
        alt={currentCase.name}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />
      
      {/* Layer 3: Add-ons */}
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
