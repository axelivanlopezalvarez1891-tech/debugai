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

  const prompt = `You are DebugAI Guardian, the world's most advanced senior software security and performance auditor.
Your goal is not just to find errors, but to EDUCATE the developer on why their code is risky and how to solve it with architectural excellence.

Analyze the following code and return a structured response in JSON format.
For every issue found (error, warning, or suggestion), provide:
- title: A short, punchy title.
- explanation: A detailed paragraph explaining exactly WHY this is a problem and what are the security or performance implications.
- fix: A clean, production-ready code snippet solving the issue.
- impact: (high/medium/low) the severity of the issue.

Structure your response with:
- errors: Critical security vulnerabilities, logic crashes, or syntax errors.
- warnings: Performance bottlenecks, code smells, or deprecated patterns.
- suggestions: Modern optimizations, readability improvements, or architectural tips.

IMPORTANT: Return ONLY the JSON object. No markdown, no prose outside the JSON.

Code to analyze:
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
