import { getDB } from "../config/db.js";
import { log } from "../utils/logger.js";
import jwt from "jsonwebtoken";
import xss from "xss";

export async function getStats(req, res) {
  const db = getDB();
  const totalUsers = await db.get("SELECT COUNT(*) as c FROM users");
  const proUsers = await db.get("SELECT COUNT(*) as c FROM users WHERE premium = 1");
  let usersList = [];
  try { usersList = await db.all("SELECT username, premium, is_admin, creditos, created_at, last_platform FROM users ORDER BY created_at DESC"); } 
  catch(e) { usersList = await db.all("SELECT username, premium, is_admin, creditos, created_at FROM users ORDER BY created_at DESC"); }
  const mobileUsers = usersList.filter(u => u.last_platform === 'Mobile').length;
  
  const totalPayments = await db.get("SELECT COUNT(*) as c FROM payments");
  const totalRevenue = await db.get("SELECT COALESCE(SUM(amount_cents), 0) as total FROM payments");
  const recentPayments = await db.all("SELECT * FROM payments ORDER BY created_at DESC LIMIT 50");
  
  res.json({ 
    ok: true, 
    totalUsers: totalUsers.c, 
    proUsers: proUsers.c,
    mobileUsers,
    users: usersList,
    paymentsCount: totalPayments.c,
    revenueUsd: (totalRevenue.total / 100).toFixed(2),
    recentPayments: recentPayments
  });
}

export async function getAnalytics(req, res) {
  const db = getDB();
  const dau = await db.get("SELECT COUNT(DISTINCT username) as c FROM eventos WHERE tipo_evento = 'MSG_ENVIADO' AND DATE(timestamp) = DATE('now')");
  const msgsHoy = await db.get("SELECT COUNT(*) as c FROM eventos WHERE tipo_evento = 'MSG_ENVIADO' AND DATE(timestamp) = DATE('now')");
  const msgsTotal = await db.get("SELECT COUNT(*) as c FROM eventos WHERE tipo_evento = 'MSG_ENVIADO'");
  const sinTokensHoy = await db.get("SELECT COUNT(*) as c FROM eventos WHERE tipo_evento = 'SIN_TOKENS' AND DATE(timestamp) = DATE('now')");
  const eventosTipo = await db.all("SELECT tipo_evento, COUNT(*) as total FROM eventos WHERE timestamp >= datetime('now', '-30 days') GROUP BY tipo_evento ORDER BY total DESC");
  const actividadDiaria = await db.all("SELECT DATE(timestamp) as dia, COUNT(*) as mensajes FROM eventos WHERE tipo_evento = 'MSG_ENVIADO' AND timestamp >= datetime('now', '-7 days') GROUP BY dia ORDER BY dia ASC");
  const comprasTotal = await db.get("SELECT COUNT(*) as c FROM eventos WHERE tipo_evento = 'COMPRA'");
  const usuariosSinTokens = await db.get("SELECT COUNT(DISTINCT username) as c FROM eventos WHERE tipo_evento = 'SIN_TOKENS'");
  const usuariosQueCompraron = await db.get("SELECT COUNT(DISTINCT username) as c FROM eventos WHERE tipo_evento = 'COMPRA'");

  res.json({
    ok: true,
    dau: dau.c, msgsHoy: msgsHoy.c, msgsTotal: msgsTotal.c, sinTokensHoy: sinTokensHoy.c, comprasTotal: comprasTotal.c,
    tasaConversion: usuariosSinTokens.c > 0 ? ((usuariosQueCompraron.c / usuariosSinTokens.c) * 100).toFixed(1) : '0.0',
    eventosTipo, actividadDiaria
  });
}

export async function getEventos(req, res) {
  const db = getDB();
  const limit = parseInt(req.query.limit) || 100;
  const eventos = await db.all("SELECT * FROM eventos ORDER BY timestamp DESC LIMIT ?", [limit]);
  res.json({ ok: true, eventos });
}

export async function upgradeUser(req, res) {
  const db = getDB();
  const { targetUser, duration } = req.body;
  const safeUser = xss(targetUser);
  const durationMs = (duration && !isNaN(parseInt(duration))) ? parseInt(duration) : null;
  await db.run("UPDATE users SET pending_gift = ? WHERE username = ?", [JSON.stringify({type:"pro", duration: durationMs}), safeUser]);
  res.json({ ok: true, msg: `🎁 Regalo PRO enviado a ${safeUser}. Esperando a que lo abra.` });
}

export async function giftTokens(req, res) {
  const db = getDB();
  const { targetUser, amount } = req.body;
  const safeUser = xss(targetUser);
  await db.run("UPDATE users SET pending_gift = ? WHERE username = ?", [JSON.stringify({type:"tokens", amount: amount || 1000}), safeUser]);
  res.json({ ok: true, msg: `🎁 ${amount} tokens enviados a ${safeUser}. Esperando a que los abra.` });
}

export async function deleteUser(req, res) {
  const db = getDB();
  const { targetUser } = req.body;
  let usersToDelete = Array.isArray(targetUser) ? targetUser : [targetUser];
  usersToDelete = usersToDelete.filter(u => u !== "Axel" && u !== req.user); // Evitar autodespido o borrar a Axel
  
  if (usersToDelete.length === 0) return res.json({ ok: false, msg: "Ningún usuario válido para eliminar." });
  
  const placeholders = usersToDelete.map(() => '?').join(',');
  await db.run(`DELETE FROM users WHERE username IN (${placeholders})`, usersToDelete);
  res.json({ ok: true, msg: `Cuentas eliminadas correctamente: ${usersToDelete.join(', ')}` });
}

export async function makeMeAdmin(req, res) {
  const db = getDB();
  const { secret, user } = req.body;
  const MASTER_KEY = process.env.MASTER_KEY || "UltraMaster99X";
  const SECRET = process.env.JWT_SECRET || "debugai_ultra_secure_secret_2026";
  const safeSecret = xss(secret);
  if (safeSecret && safeSecret.trim() === MASTER_KEY) {
    let targetUser = xss(user) || "Axel";
    const exists = await db.get("SELECT * FROM users WHERE LOWER(username) = LOWER(?)", [targetUser]);
    if (!exists && targetUser === "Axel") {
       await db.run("INSERT INTO users (username, password, is_admin, premium, creditos) VALUES (?, ?, ?, ?, ?)", ["Axel", "Axel1891", 1, 1, 999999]);
    } else {
       await db.run("UPDATE users SET is_admin = 1, premium = 1 WHERE LOWER(username) = LOWER(?)", [targetUser]);
    }
    const token = jwt.sign({ user: targetUser }, SECRET, { expiresIn: "7d" });
    const isProd = process.env.RENDER || process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, { httpOnly: true, secure: isProd, sameSite: IS_PROD ? 'Strict' : 'Lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ ok: true, msg: "¡Identidad Maestra Verificada!", token });
  }
  res.status(403).json({ ok: false, msg: "Llave incorrecta." });
}
