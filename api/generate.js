const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const STYLE_PROMPTS = {
  chibi: `CHIBI STYLE sculpture:
- Super deformed proportions: head is 1/2 to 1/3 of total body height
- Extremely large round eyes with sparkles/highlights
- Tiny simplified body, short stubby limbs
- Rounded, pudgy features - no sharp edges
- Exaggerated cute expressions (blush marks on cheeks)
- Simplified hands (mitten-like)
- Kawaii Japanese aesthetic
- Soft pastel flower petals forming the figure`,

  ghibli: `STUDIO GHIBLI STYLE sculpture:
- Hand-painted watercolor aesthetic
- Soft, dreamy, nostalgic atmosphere
- Natural proportions but slightly stylized
- Gentle rounded features, warm expressions
- Muted earth tones mixed with soft pastels
- Delicate linework feeling, organic shapes
- Hayao Miyazaki / Totoro / Spirited Away aesthetic
- Whimsical, magical, serene mood
- Flower petals with painterly, flowing quality`,

  popmart: `POP MART / DESIGNER TOY STYLE sculpture:
- Vinyl collectible toy aesthetic
- Smooth, matte, plastic-like surface finish
- Bold graphic style with clean lines
- Oversized head with minimal facial features
- Small dot eyes, no nose, simple mouth or no mouth
- Uniform solid colors, flat shading
- Contemporary art toy / urban vinyl look
- Bearbrick / Molly / Labubu inspired
- Glossy or matte toy-like flower petals`,

  realistic: `REALISTIC STYLE sculpture:
- True-to-life proportions and anatomy
- Detailed facial features matching the photo
- Natural skin texture represented in petals
- Accurate likeness preservation
- Photorealistic rendering quality
- Lifelike eyes with depth and reflection
- Natural pose and expression from photo
- High detail flower petal arrangement
- Museum-quality preserved flower sculpture look`
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const { userPhoto, style } = req.body;
  if (!userPhoto || !style || !STYLE_PROMPTS[style]) {
    return res.status(400).json({ error: 'Missing userPhoto or invalid style' });
  }

  const prompt = `Transform this photo into a preserved hydrangea flower sculpture.

${STYLE_PROMPTS[style]}

REQUIREMENTS:
- Soft pastel pink, cream, lavender, and blush flower petals form the subject
- Maintain recognizable identity/features of the subject in the photo
- Subject centered, facing forward
- PURE BLACK background (#000000) - absolutely nothing else
- NO display case, NO decorations, NO shadows, NO gradients
- Square composition, subject fills 70% of frame
- The sculpture should look like it's made entirely of delicate preserved flowers

Output ONLY the flower sculpture on pure black background.`;

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
