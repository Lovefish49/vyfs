const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const STYLE_PROMPTS = {
  chibi: `CHIBI STYLE:
- Super deformed: massive head (50% of total height), tiny body
- Huge sparkling eyes with highlights, small nose, tiny mouth
- Short stubby limbs, rounded pudgy body
- Kawaii aesthetic with rosy cheek blush marks
- Cute, childlike proportions`,

  ghibli: `STUDIO GHIBLI STYLE:
- Soft watercolor painted look
- Gentle, dreamy, nostalgic atmosphere  
- Natural but slightly stylized proportions
- Warm, serene expression
- Miyazaki / Totoro aesthetic
- Organic flowing shapes`,

  popmart: `POP MART VINYL TOY STYLE:
- Smooth matte plastic finish
- Oversized head, minimal features
- Tiny dot eyes, no nose, simple or no mouth
- Bold solid colors, flat shading
- Designer art toy / Bearbrick / Molly aesthetic
- Clean geometric shapes`,

  realistic: `PHOTOREALISTIC STYLE:
- True-to-life proportions
- Detailed accurate likeness from photo
- Natural features and expression
- High detail, museum quality
- Lifelike depth and texture`
};

export default async function handler(req, res) {
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

  const prompt = `Create a preserved flower sculpture based on this photo.

${STYLE_PROMPTS[style]}

CRITICAL REQUIREMENTS:
1. Made entirely of soft pastel flower petals (pink, cream, lavender, blush)
2. Maintain recognizable features/identity from the photo
3. Subject must be LARGE - fill 85% of the frame
4. Centered, front-facing pose
5. PURE SOLID BLACK background (#000000) - NOTHING ELSE
6. NO white areas, NO gradients, NO shadows, NO floor, NO reflections
7. NO display case, NO decorations, NO text, NO watermarks
8. Square 1:1 composition
9. The sculpture floats on pure black void

OUTPUT: Only the flower sculpture on absolute black background. No other elements.`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: userPhoto.replace(/^data:image\/\w+;base64,/, '') }}
          ]}],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
      }
    );

    const data = await response.json();
    for (const part of data.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return res.json({ success: true, image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
      }
    }
    return res.status(500).json({ error: 'No image generated', details: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
