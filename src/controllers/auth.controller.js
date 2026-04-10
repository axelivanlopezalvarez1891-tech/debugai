import jwt from "jsonwebtoken";
import xss from "xss";
import { getDB } from "../config/db.js";
import { log } from "../utils/logger.js";

const SECRET = process.env.JWT_SECRET || "debugai_ultra_secure_secret_2026";
const IS_PROD = process.env.RENDER || process.env.NODE_ENV === 'production';

export async function login(req, res) {
  const db = getDB();
  const { user, pass } = req.body;
  if (!user || !pass) return res.json({ ok: false, msg: "Faltan datos" });
  
  const u = xss(user.trim());
  const p = pass.trim();

  // [STAGING] Bloqueo de acceso privado
  const STAGING_MODE = process.env.STAGING_MODE === 'true';
  const ALLOWED_USERS = ["axel", "test_user"];
  if (STAGING_MODE && !ALLOWED_USERS.includes(u.toLowerCase())) {
     return res.status(403).json({ ok: false, msg: "El sistema está en mantenimiento privado." });
  }

  log.info('LOGIN_ATTEMPT', { user: u });

  const match = await db.get("SELECT * FROM users WHERE (username = ? OR LOWER(username) = LOWER(?)) AND password = ?", [u, u, p]);
  if (!match) {
    log.warn('LOGIN_FAILED', { user: u });
    return res.json({ ok: false, msg: 'Credenciales incorrectas' });
  }
  
  log.info('LOGIN_SUCCESS', { user: match.username });
  
  const ua = req.headers['user-agent'] || '';
  const isMobile = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua);
  const platform = isMobile ? 'Mobile' : 'Desktop';
  
  await db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP, last_platform = ? WHERE username = ?", [platform, match.username]);
  
  const token = jwt.sign({ user: match.username }, SECRET, { expiresIn: "7d" });
  
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: IS_PROD, 
    sameSite: IS_PROD ? 'Strict' : 'Lax', 
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ ok: true }); 
}

export async function register(req, res) {
  const db = getDB();
  const { user, pass } = req.body;
  if (!user || !pass) return res.json({ ok: false, msg: "Faltan datos" });
  
  const u = xss(user.trim());
  const p = pass.trim();

  const STAGING_MODE = process.env.STAGING_MODE === 'true';
  const ALLOWED_USERS = ["axel", "test_user"];
  if (STAGING_MODE && !ALLOWED_USERS.includes(u.toLowerCase())) {
     return res.status(403).json({ ok: false, msg: "Fase de pruebas privada. Registro cerrado." });
  }

  const existing = await db.get("SELECT username FROM users WHERE username = ?", [u]);
  if (existing) return res.json({ ok: false, msg: "Este usuario ya está en nuestra base de datos." });
  
  const ua = req.headers['user-agent'] || '';
  const isMobile = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua);
  const platform = isMobile ? 'Mobile' : 'Desktop';
  
  await db.run("INSERT INTO users (username, password, creditos, premium, is_admin, last_platform) VALUES (?, ?, 30, 0, 0, ?)", [u, p, platform]);
  
  const token = jwt.sign({ user: u }, SECRET, { expiresIn: "7d" });
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'Strict' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ ok: true, msg: "🎁 ¡REGALO ACTIVADO!: Has recibido 30 tokens gratis para comenzar. Inicia sesión ahora.", token });
}

export async function logout(req, res) {
  res.clearCookie('authToken', { httpOnly: true, secure: IS_PROD, sameSite: IS_PROD ? 'Strict' : 'Lax' });
  res.json({ ok: true, msg: "Desconectado exitosamente" });
}

export async function getPerfil(req, res) {
  const db = getDB();
  let u = await db.get("SELECT * FROM users WHERE username = ?", [req.user]);
  if (!u) return res.json({ ok: false });

  // Expiración PRO automágica garantizada
  if (u.premium > 1 && Date.now() > u.premium) {
    await db.run("UPDATE users SET premium = 0 WHERE username = ?", [req.user]);
    // registrar evento
    try {
      await db.run("INSERT INTO eventos (username, tipo_evento, metadata) VALUES (?, ?, ?)", [req.user, 'TRIAL_ENDED', '{}']);
    } catch(e){}
    u = await db.get("SELECT * FROM users WHERE username = ?", [req.user]);
  }

  let flags = {};
  try { flags = JSON.parse(u.automation_flags || '{}'); } catch(e) {}
  if (!flags.ab_variant) {
    flags.ab_variant = Math.random() > 0.5 ? "A" : "B";
    await db.run("UPDATE users SET automation_flags = ? WHERE username = ?", [JSON.stringify(flags), req.user]);
  }

  const isActuallyPremium = u.premium === 1 || u.premium > Date.now() || u.is_admin === 1;
  const isPlus = u.premium === 2;
  
  let planDesc = 'FREE';
  let maxMsgs = 30; // Matches DB rate limiter!
  if (isPlus) { planDesc = 'PLUS'; maxMsgs = 80; }
  if (isActuallyPremium) { planDesc = 'PRO'; maxMsgs = 200; }
  
  res.json({ 
    ok: true, 
    nombre: u.nombre || "", 
    rol: u.rol || "", 
    premium: isActuallyPremium, 
    is_admin: u.is_admin === 1, 
    creditos: u.creditos, 
    abVariant: flags.ab_variant, 
    planDesc, 
    maxMsgs, 
    msgsUsadosHoy: u.usage_today || 0,
    // Stripe subscription info
    stripe_plan: u.stripe_plan || 'free',
    stripe_period_end: u.stripe_period_end || null,
    stripe_subscription_id: u.stripe_subscription_id ? '●●●●' : null, // Nunca exponer ID real
  });
}

export async function updatePerfil(req, res) {
  const db = getDB();
  const { nombre, rol } = req.body;
  await db.run("UPDATE users SET nombre = ?, rol = ? WHERE username = ?", [xss(nombre || ""), xss(rol || ""), req.user]);
  res.json({ ok: true });
}

export async function checkGift(req, res) {
  const db = getDB();
  const u = await db.get("SELECT pending_gift FROM users WHERE username = ?", [req.user]);
  if (!u || !u.pending_gift) return res.json({ ok: false });
  try {
    const gift = JSON.parse(u.pending_gift);
    res.json({ ok: true, gift });
  } catch (e) {
    res.json({ ok: false });
  }
}

export async function claimGift(req, res) {
  const db = getDB();
  const u = await db.get("SELECT * FROM users WHERE username = ?", [req.user]);
  if (!u || !u.pending_gift) return res.json({ ok: false, msg: "No hay regalos pendientes." });
  
  try {
    const gift = JSON.parse(u.pending_gift);
    if (gift.type === "pro") {
      const expirationDate = gift.duration ? Date.now() + gift.duration : 1; 
      await db.run("UPDATE users SET premium = ?, creditos = creditos + 10000, pending_gift = NULL WHERE username = ?", [expirationDate, req.user]);
    } else if (gift.type === "tokens") {
      await db.run("UPDATE users SET creditos = creditos + ?, pending_gift = NULL WHERE username = ?", [gift.amount, req.user]);
    }
    res.json({ ok: true, msg: "¡Regalo reclamado exitosamente!" });
  } catch (e) {
    res.json({ ok: false, msg: "Error al reclamar el regalo." });
  }
}

export async function deleteAccount(req, res) {
  const db = getDB();
  const { confirmation } = req.body;
  if (!confirmation || confirmation !== req.user) {
    return res.json({ ok: false, msg: "El nombre de usuario de confirmación no coincide." });
  }
  if (req.user === "Axel") {
    return res.json({ ok: false, msg: "La cuenta de Administrador Maestro no puede ser eliminada." });
  }
  await db.run("DELETE FROM users WHERE username = ?", [req.user]);
  res.clearCookie('authToken', { httpOnly: true, secure: IS_PROD, sameSite: IS_PROD ? 'Strict' : 'Lax' });
  res.json({ ok: true, msg: "Tu cuenta y todos tus datos han sido eliminados de forma permanente." });
}
