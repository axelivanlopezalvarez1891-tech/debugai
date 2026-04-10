import { Router } from "express";
import { getStats, getAnalytics, getEventos, upgradeUser, giftTokens, deleteUser, makeMeAdmin } from "../controllers/admin.controller.js";
import { auth, requireMaster } from "../middlewares/auth.js";
import { rateLimiters } from "../config/security.js";
import { getDB } from "../config/db.js";

const router = Router();

router.post("/api/admin/make-me-admin", rateLimiters.admin, makeMeAdmin);
router.get("/api/admin/stats", requireMaster, getStats);
router.get("/api/admin/eventos", requireMaster, getEventos);
router.get("/api/admin/analiticas", requireMaster, getAnalytics);
router.post("/api/admin/upgrade-user", requireMaster, upgradeUser);
router.post("/api/admin/gift-tokens", requireMaster, giftTokens);
router.post("/api/admin/delete-user", requireMaster, deleteUser);

// [FIX] Missing endpoint that existed inline but was missing in early extractions: create-user
import xss from 'xss';
router.post("/api/admin/create-user", requireMaster, async (req, res) => {
  try {
    const db = getDB();
    const { newUser, newPass, tokens, isPro } = req.body;
    if (!newUser || !newPass) return res.json({ ok: false, msg: "Usuario y contraseña son obligatorios." });
    
    const safeUser = xss(newUser.trim());
    const safePass = newPass.trim();
    const safeTokens = (!isNaN(parseInt(tokens)) && parseInt(tokens) >= 0) ? parseInt(tokens) : 1000;
    const premiumVal = isPro ? 1 : 0;
    
    const existing = await db.get("SELECT username FROM users WHERE username = ?", [safeUser]);
    if (existing) return res.json({ ok: false, msg: `El usuario '${safeUser}' ya existe.` });
    
    await db.run(
      "INSERT INTO users (username, password, creditos, premium, is_admin) VALUES (?, ?, ?, ?, 0)",
      [safeUser, safePass, safeTokens, premiumVal]
    );
    await db.run("INSERT INTO eventos (username, tipo_evento, metadata) VALUES (?, ?, ?)", ["Axel", 'ADMIN_CREATE_USER', JSON.stringify({ target: safeUser, tokens: safeTokens, isPro: premiumVal })]);
    res.json({ ok: true, msg: `✅ Usuario '${safeUser}' creado con ${safeTokens} tokens${isPro ? ' y acceso PRO' : ''}.` });
  } catch (e) {
    res.json({ ok: false, msg: "Error interno al crear usuario." });
  }
});

export default router;
