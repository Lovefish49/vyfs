export default function handler(req, res) {
  const hasKey = !!process.env.GEMINI_KEY;
  const allEnvKeys = Object.keys(process.env).filter(k => k.includes('GEMINI'));
  
  res.json({ 
    hasGeminiKey: hasKey,
    geminiEnvVars: allEnvKeys,
    nodeEnv: process.env.NODE_ENV
  });
}
