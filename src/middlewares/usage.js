import { log } from "../utils/logger.js";
import { getDB } from "../config/db.js";

// [ABUSE] LIMITADOR POR USUARIO — Supabase Integration
export function userRateLimiter() {
  return async (req, res, next) => {
    if (!req.user) return next();
    const db = getDB();
    try {
      const profile = await db.profiles.get(req.user);
      if (!profile) return next();

      // The user wants a strict 5-analysis limit for Free users
      const analysesCount = profile.analyses_count || 0;
      const analysesLimit = profile.analyses_limit || 5;
      const plan = profile.plan || 'free';

      if (plan === 'free' && analysesCount >= analysesLimit) {
        log.warn('USER_DAILY_LIMIT_EXCEEDED', { user: req.user, planLimit: analysesLimit });
        return res.status(200).json({ 
          ok: false, 
          upgradeRequired: true, 
          msg: `Has alcanzado tu límite de ${analysesLimit} análisis para el plan gratuito. Pásate a PRO para análisis ilimitados.` 
        });
      }

      next();
    } catch(e) {
      log.error('LIMITER_ERROR', { error: e.message });
      next();
    }
  };
}
