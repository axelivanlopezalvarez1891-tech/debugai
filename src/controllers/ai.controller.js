import { log } from "../utils/logger.js";
import { getDB } from "../config/db.js";

export async function analyzeCode(req, res) {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ ok: false, msg: "No se proporcionó código para analizar." });
  }

  const db = getDB();
  const profile = await db.profiles.get(req.user);
  if (!profile) return res.status(401).json({ ok: false, msg: "Usuario no encontrado." });

  // Safety logic is handled by the userRateLimiter middleware, but we check plan for credits/priority
  const isPremium = profile.plan === 'pro' || profile.plan === 'admin';

  const prompt = `You are DebugAI Master Guardian, a legendary senior software architect and security auditor.
Your mission is to provide 100% accurate, production-ready solutions for code issues.
For every code snippet or problem description provided, you must act as a 'Guardian' who protects the project from flaws.

Return a structured response in JSON format.
For every issue (error, warning, or suggestion):
- title: A professional name for the issue.
- explanation: A master-class explanation of WHY this is happening, what is the risk, and the technical logic behind the failure.
- fix: The COMPLETE, optimized, and ready-to-use code fix.
- impact: (high/medium/low) based on technical risk.

Your tone should be authoritative, educational, and precise.

Structure your response as:
- errors: Critical/Breaking bugs or security holes.
- warnings: Performance or maintainability issues.
- suggestions: Professional optimizations.

IMPORTANT: Return ONLY the JSON object. No Markdown. No text outside the JSON.

Input to analyze:
${code}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

    const data = await response.json();
    let analysis;
    try {
      analysis = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      log.error('AI_JSON_PARSE_FAILED', { content: data.choices[0].message.content });
      return res.status(500).json({ ok: false, msg: "Fallo al procesar respuesta de IA." });
    }

    // Increment analysis count in Supabase
    await db.profiles.incrementAnalyses(req.user);

    res.json({ 
      ok: true, 
      analyses_count: (profile.analyses_count || 0) + 1,
      ...analysis 
    });

  } catch (err) {
    log.error('AI_ANALYSIS_FAILED', { error: err.message, user: req.user });
    res.status(500).json({ ok: false, msg: "Error al realizar el análisis de IA." });
  }
}
