const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const STYLE_PROMPTS = {
  chibi: 'chibi style, cute exaggerated proportions, big head small body, kawaii aesthetic',
  ghibli: 'Studio Ghibli style, soft whimsical aesthetic, gentle warm colors, dreamy',
  popmart: 'Pop Mart vinyl toy style, smooth matte surfaces, designer art toy aesthetic',
  realistic: 'realistic style, lifelike proportions, detailed texture, photorealistic',
};

export default async function handler(req, res) {
  // 1. CORS & Method Validation
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { userPhoto, style } = req.body;
  if (!userPhoto || !style || !STYLE_PROMPTS[style]) {
    return res.status(400).json({ error: 'Missing userPhoto or invalid style' });
  }

  // 2. Prompt Construction
  const prompt = `Transform this photo into a preserved hydrangea flower sculpture in ${STYLE_PROMPTS[style]}. Soft pastel pink, cream, and lavender flower petals form the subject's silhouette. Maintain recognizable features. Plain white background, square composition.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { 
                  mimeType: 'image/jpeg', 
                  data: userPhoto.split(',')[1] || userPhoto // Cleaner base64 extraction
              }}
            ]
          }],
          // 3. Add Generation Config and Safety Settings
          generationConfig: {
            temperature: 1.0,
            topP: 0.95,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
          ]
        })
      }
    );

    const data = await response.json();

    // 4. Enhanced Error Handling
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return res.status(data.code || 500).json({ 
        error: data.error.message, 
        details: "Check if billing is linked to your Google Cloud project to enable the free tier." 
      });
    }

    // Check for blocked content
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      return res.status(400).json({ error: "Image generation blocked by safety filters. Try a different photo." });
    }

    // 5. Extract Image Data
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return res.json({ 
          success: true, 
          image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` 
        });
      }
    }
    
    return res.status(500).json({ error: 'Model did not return an image. It may have responded with text instead.', data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
