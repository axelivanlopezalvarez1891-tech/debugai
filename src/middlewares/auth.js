import jwt from "jsonwebtoken";
import { log } from "../utils/logger.js";
import { getDB } from "../config/db.js";

const SECRET = process.env.JWT_SECRET || "debugai_ultra_secure_secret_2026";

// [SEC-4] MIDDLEWARE DE AUTENTICACIÓN — JWT con hardening completo
export function auth(req, res, next) {
  let token = req.cookies?.authToken;
  if (!token && req.headers.authorization && req.headers.authorization !== 'cookie_mode') {
    token = req.headers.authorization;
  }
  
  if (!token) return res.status(401).json({ ok: false, msg: 'No autorizado' });
  
  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    if (!decoded?.user || typeof decoded.user !== 'string') {
      return res.status(401).json({ ok: false, msg: 'Token inválido' });
    }
    
    if (decoded.exp && Date.now() / 1000 > decoded.exp) {
      return res.status(401).json({ ok: false, msg: 'Sesión expirada. Vuelve a iniciar sesión.' });
    }
    
    req.user = decoded.user;
    next();
  } catch (err) {
    log.warn('JWT_INVALID', { reason: err.name });
    return res.status(401).json({ ok: false, msg: 'Token inválido o expirado' });
  }
}

// Middleware para verificar si es administrador
export async function requireMaster(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, msg: "No autorizado." });
  
  try {
    const db = getDB();
    const u = await db.get("SELECT is_admin FROM users WHERE username = ?", [req.user]);
    if (!u || u.is_admin !== 1) {
      log.warn('ADMIN_ACCESS_DENIED', { user: req.user, ip: req.ip });
      return res.status(403).json({ ok: false, msg: "Permisos insuficientes." });
    }
    next();
  } catch (e) {
    return res.status(500).json({ ok: false, msg: "Error al verificar permisos." });
  }
}
