import { Router } from "express";
import authRoutes from "./auth.routes.js";
import chatRoutes from "./chat.routes.js";
import adminRoutes from "./admin.routes.js";
import paymentRoutes from "./payment.routes.js";
import aiRoutes from "./ai.routes.js";
import stripeRoutes from "./stripe.routes.js";

import multer from "multer";
import { auth } from "../middlewares/auth.js";
import { log } from "../utils/logger.js";
import { getDB } from "../config/db.js";

const router = Router();

// Montaje de sub-rutas
router.use(authRoutes);
router.use(chatRoutes);
router.use(adminRoutes);
router.use(paymentRoutes);
router.use(stripeRoutes);
router.use("/api/ai", aiRoutes);

// Utilidades extras de /api
let disableUpdates = false; 

router.get("/api/config", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=30");
  res.json({ disableUpdates });
});

router.post("/api/metrics/update", (req, res) => {
  const isAuth = req.cookies?.authToken || req.headers?.authorization;
  const data = req.body || {}; 
  log.info('PWA_OTA_UPDATED', { userPath: isAuth ? 'AuthUser' : 'Guest', body: data });
  res.json({ ok: true });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/upload-document", auth, upload.single("document"), async (req, res) => {
  if (!req.file) return res.json({ ok: false, msg: "No se subió archivo" });
  try {
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let textExtracted = "";

    if (ext === "pdf") {
      // Dynamic import inside handler to avoid Top-Level Await
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(req.file.buffer);
      textExtracted = data.text;
    } else if (ext === "docx") {
      const mammoth = await import('mammoth');
      const data = await mammoth.extractRawText({ buffer: req.file.buffer });
      textExtracted = data.value;
    } else {
      textExtracted = req.file.buffer.toString("utf8");
    }
    res.json({ ok: true, text: textExtracted });
  } catch (err) {
    log.error('UPLOAD_ERROR', { error: err.message });
    res.json({ ok: false, msg: "Error al interpretar archivo" });
  }
});

router.post("/api/eventos/track", auth, async (req, res) => {
  const { tipo, metadata } = req.body;
  const TIPOS_PERMITIDOS = [
    'CLICK_PRO', 'ONBOARDING_VISTO', 'MODAL_ABIERTO', 'PRO_MODAL_OPENED',
    'PRO_CLICKED', 'PRO_SUGGESTION_SHOWN', 'SIN_TOKENS_MODAL_SHOWN', 'TRIAL_ENDED_MODAL_SHOWN'
  ];
  if (!tipo || !TIPOS_PERMITIDOS.includes(tipo)) return res.status(400).json({ ok: false });
  try {
    const db = getDB();
    await db.events.track(req.user, tipo, metadata);
  } catch (e) {}
  res.json({ ok: true });
});

export default router;
