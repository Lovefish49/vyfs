const STYLE_PROMPTS = {
  chibi: 'chibi style, cute exaggerated proportions, big head small body, kawaii aesthetic',
  ghibli: 'Studio Ghibli style, soft whimsical aesthetic, gentle warm colors, dreamy',
  popmart: 'Pop Mart vinyl toy style, smooth matte surfaces, designer art toy aesthetic',
  realistic: 'realistic style, lifelike proportions, detailed texture, photorealistic',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_KEY not configured' });
  }

  const { userPhoto, style } = req.body;
  if (!userPhoto || !style || !STYLE_PROMPTS[style]) {
    return res.status(400).json({ error: 'Missing userPhoto or invalid style' });
  }

  const prompt = `Transform this photo into a preserved hydrangea flower sculpture in ${STYLE_PROMPTS[style]}. Soft pastel pink, cream, and lavender flower petals form the subject's silhouette. Maintain recognizable features. Plain white background, square composition.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { 
                mimeType: 'image/jpeg', 
                data: userPhoto.replace(/^data:image\/\w+;base64,/, '')
              }}
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message, code: data.error.code });
    }

    for (const part of data.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return res.json({ 
          success: true, 
          image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` 
        });
      }
    }
    
    return res.status(500).json({ error: 'No image generated', data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
