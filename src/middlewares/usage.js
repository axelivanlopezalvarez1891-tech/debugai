import { log } from "../utils/logger.js";
import { getDB } from "../config/db.js";

// [ABUSE] LIMITADOR POR USUARIO — Persistencia en DB (Phase 4)
export function userRateLimiter() {
  return async (req, res, next) => {
    if (!req.user) return next();
    const db = getDB();
    try {
      const u = await db.get("SELECT premium, is_admin, usage_today, last_usage_reset FROM users WHERE username = ?", [req.user]);
      if (!u) return next();

      // Reset diario automático por usuario
      const today = new Date().toISOString().split('T')[0];
      const lastReset = u.last_usage_reset ? u.last_usage_reset.split('T')[0] : '';
      
      let currentUsage = u.usage_today || 0;
      if (today !== lastReset) {
        currentUsage = 0;
        await db.run("UPDATE users SET usage_today = 0, last_usage_reset = CURRENT_TIMESTAMP WHERE username = ?", [req.user]);
      }

      // Calcular límite: FREE (30) vs PRO (200) vs PLUS (80)
      let maxPerDay = 30; 
      if (u.is_admin === 1 || u.premium === 1 || (u.premium > Date.now())) maxPerDay = 200;
      else if (u.premium === 2) maxPerDay = 80;

      if (currentUsage >= maxPerDay) {
        log.warn('USER_DAILY_LIMIT_EXCEEDED', { user: req.user, planLimit: maxPerDay });
        return res.status(200).json({ ok: false, upgradeRequired: true, msg: `Has alcanzado tu límite de ${maxPerDay} mensajes diarios.` });
      }

      // Incrementar uso
      await db.run("UPDATE users SET usage_today = usage_today + 1 WHERE username = ?", [req.user]);
      next();
    } catch(e) {
      log.error('LIMITER_ERROR', { error: e.message });
      next();
    }
  };
}
