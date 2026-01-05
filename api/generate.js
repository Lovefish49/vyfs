export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY_2;

  // 1. Check if key exists
  if (!apiKey) {
    return res.status(500).json({ error: "API Key 'GEMINI_API_KEY_2' is missing in Vercel settings." });
  }

  // 2. The stable model URL (No "preview" string)
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        // Force the model to return an image
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Google API Error Details:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Google API Error",
        details: data
      });
    }

    // 3. Extract the image from the response
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (!imagePart) {
      return res.status(500).json({ error: "No image was generated. Try a different prompt." });
    }

    // Return the base64 image to the frontend
    return res.status(200).json({ 
      image: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
