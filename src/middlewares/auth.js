import { supabase } from "../config/supabase.js";
import { log } from "../utils/logger.js";
import { getDB } from "../config/db.js";

// [SEC-4] MIDDLEWARE DE AUTENTICACIÓN — Supabase Auth Integration
export async function auth(req, res, next) {
  let token = req.cookies?.['sb-access-token'];
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1] || req.headers.authorization;
  }
  
  if (!token) return res.status(401).json({ ok: false, msg: 'No autorizado' });
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      log.warn('AUTH_INVALID', { reason: error?.message });
      return res.status(401).json({ ok: false, msg: 'Token inválido o expirado' });
    }
    
    req.user = user.id; // UUID from Supabase
    next();
  } catch (err) {
    log.error('AUTH_MIDDLEWARE_ERROR', { error: err.message });
    return res.status(401).json({ ok: false, msg: 'Error de autenticación' });
  }
}

// Middleware para verificar si es administrador
export async function requireMaster(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, msg: "No autorizado." });
  
  try {
    const db = getDB();
    const profile = await db.profiles.get(req.user);
    
    // In Supabase architecture, we can use metadata or a role field in the profile
    if (!profile || profile.plan !== 'admin') {
      log.warn('ADMIN_ACCESS_DENIED', { user: req.user });
      return res.status(403).json({ ok: false, msg: "Permisos insuficientes." });
    }
    next();
  } catch (e) {
    return res.status(500).json({ ok: false, msg: "Error al verificar permisos." });
  }
}
