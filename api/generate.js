const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const STYLE_PROMPTS = {
  chibi: 'CHIBI style with super-deformed cute proportions - oversized head (40% of body), huge round eyes, tiny stubby limbs, kawaii aesthetic',
  ghibli: 'STUDIO GHIBLI style - soft, dreamy, whimsical Miyazaki-inspired aesthetic with gentle warm tones',
  popmart: 'POP MART style - designer vinyl toy look with oversized head, minimal facial features, smooth rounded shapes',
  realistic: 'REALISTIC style - true-to-life proportions and accurate likeness matching the original photo'
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

  const prompt = `Create a PRESERVED HYDRANGEA FLOWER SCULPTURE based on this photo.

CONSTRUCTION (CRITICAL):
- Made ENTIRELY of small preserved hydrangea flower petals clustered together
- Fluffy, textured surface from hundreds of tiny flower petals
- Like a teddy bear made of real dried flowers - soft, organic, tactile
- Each petal is visible, creating rich texture
- NOT smooth plastic, NOT cartoon render - real preserved flowers

FLOWER COLORS:
- Soft natural tones: cream, blush pink, dusty rose, lavender, tan, brown
- Colors should match the subject's natural coloring where possible
- Subtle color gradients across the sculpture

STYLE TRANSFORMATION:
${STYLE_PROMPTS[style]}

DETAILS:
- Small black bead eyes
- Recognizable features from the original photo
- Sitting/standing pose, front-facing
- Subject fills 70% of frame, centered

BACKGROUND:
- Pure solid black (#000000)
- NO other elements, NO floor, NO shadows

Output: A flower petal sculpture on pure black background.`;

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
