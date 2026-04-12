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

export default router;
